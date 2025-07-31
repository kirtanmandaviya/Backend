import { StatusLog } from '../models/statusLogs.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Complaint } from '../models/complaints.models.js';
import { Department } from '../models/departments.models.js';
import { User } from '../models/user.models.js';
import mongoose from "mongoose";


// 1. Create a StatusLog
// Purpose: Log a status change when a complaint's status is updated.
// Who can use:
//              Main Admin
//              Department Admin (within dept)

const VALID_STATUS_TRANSITIONS = {
    pending: ["in_review", "rejected"],
    in_review: ["resolved", "rejected"],
    resolved: [],
    rejected: []
}

const createStatusLog = asyncHandler( async( req, res ) => {

    const { role, _id:userId } = req.user;
    const { complaintId = [], oldStatus, newStatus } = req.body;

    if( role !== "admin" && role !== "supervisor" ){
        throw new ApiError(403, "You have no authority to create status log!")
    }

    if( !complaintId || !oldStatus || !newStatus){
        throw new ApiError(400, "All credintials required!")
    }

    const complaint = await Complaint.findById(complaintId).populate("submittedBy");

    if( !complaint ){
        throw new ApiError(404, "Complaint not found!")
    }

    const validNextStatuses = VALID_STATUS_TRANSITIONS[oldStatus];

    if( !validNextStatuses || !validNextStatuses.includes(newStatus) ){
        throw new ApiError(400,  `Invalid status transition from '${oldStatus}' to '${newStatus}'`)
    }

    complaint.status = newStatus;
    await complaint.save();

    const statusLog = await StatusLog.create({
        complaintId,
        changedBy: userId,
        oldStatus,
        newStatus
    })

    if( !statusLog ){
        throw new ApiError(403, "Something went wrong while creating status log!")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                statusLog,
                "Status log created successfully"
            )
        )

})

// 2. Get All StatusLogs for a Complaint
// Purpose: View full status history for a specific complaint.
// Who can use:
//               User (if it's their complaint)
//               All Admins
//               Supervisors (if complaint belongs to them)

const getAllStatusLogsForComplaint = asyncHandler( async( req, res ) => {

    const { complaintId } = req.params;
    const { role } = req.user;
    const userId = req.user?._id

    if( !complaintId ){
        throw new ApiError(400, "Complaint ID required!")
    }

    const complaint = await Complaint.findById(complaintId);

    if( !complaint ){
        throw new ApiError(404, "Complaint not found!")
    }

    console.log("complaint.submittedBy:", complaint.submittedBy);
    console.log("req.user.userId:", userId);

    const isOwner = complaint.submittedBy?.toString() === userId.toString();
    const supervisorIds = (complaint.assignedToSupervisor || [])
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
        .map((id) => id.toString());

    const isAssignedSupervisor = supervisorIds.includes(userId.toString());

    console.log("assignedToSupervisor raw:", complaint.assignedToSupervisor);


    if( !isOwner && !isAssignedSupervisor && role !== "admin" ){
        throw new ApiError(403, "You are not authorized to view status logs for this complaint.")
    }

    const statusLogs = await StatusLog.find( { complaintId } ).sort({ createdAt: -1 })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                statusLogs,
                "Status logs fetched successfully"
            )
        )
})


// 3. Get All StatusLogs Changed By a Specific User
// Purpose: Useful for admin activity audits or change tracking.
// Who can use:
//             Main Admin (for any user)
//             Department Admin (only for users in their department)
// who can't use:
//               User, 
//               Supervisor (unless explicitly allowed)

const getStatusLogsChangedByUser = asyncHandler( async( req, res ) => {

    const { role, roleType, _id: adminId } = req.user;
    const userId = req.params.userId;

    if( role !== "admin"){
        throw new ApiError(403, "Access denied!")
    }

    if( !mongoose.Types.ObjectId.isValid(userId) ){
        throw new ApiError(400, "Invalid user ID!")
    }

    if( roleType === "main" ){
        const logs = await StatusLog.find({ changedBy: userId })
            .populate(
                {
                    path: "complaintId",
                    populate: { path: "submittedBy", select: "_id fullName userName" }
                }
            );

        const sanitizedLogs = logs.map(log => {

            //creates a fresh, plain JS object without any Mongoose methods or getters/setters.
            //This way you can safely delete properties without affecting the original object or running into immutability.

            const logObj = JSON.parse(JSON.stringify(log)); 


            if(logObj.complaintId?.isAnonymous){
                delete logObj.complaintId.submittedBy
            };
            return logObj;
        })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    sanitizedLogs,
                    "All logs fetched successfully"
                )
            )
    }

    if( roleType === "departmentAdmin" ){
        const [ departmentsManaged, targetUser ] = await Promise.all([
            Department.find({ headAdmin: adminId }).select("_id"),
            User.findById(userId).select("department")
        ])

    if( !targetUser ){
        throw new ApiError(404, "User not found!")
    }

    const managedIds = departmentsManaged.map(dep => dep._id.toString())
    const userDeps = targetUser.department.map(dep => dep.toString())

    const hasAccess = userDeps.some(dep => managedIds.includes(dep));

    if( !hasAccess ){
        throw new ApiError(403, "Access denied. User is not in your department!")
    }

    const logs = await StatusLog.find({ changedBy: userId })
        .populate(
            {
                path: "complaintId",
                populate: { path: "submittedBy", select: "_id fullName userName" }
            }
        );

        const sanitizedLogs = logs.map(log => {
            const logObj = JSON.parse(JSON.stringify(log));
            if(logObj.complaintId?.isAnonymous){
                delete logObj.complaintId.submittedBy
            };
            return logObj;
        })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                sanitizedLogs,
                "Logs fetched successfully"
            )
        )

    }

})

// 4. Get StatusLogs by Date Range (optional, for reporting)
// Purpose: Analyze complaints status changes over time.
// Who can use:
//              Main Admin
//              Department Admin (for their scope)
//              Head Supervisor
// who can't use:
//              User
//              Supervisor (or limited view only)

export {
    createStatusLog,
    getAllStatusLogsForComplaint,
    getStatusLogsChangedByUser
}