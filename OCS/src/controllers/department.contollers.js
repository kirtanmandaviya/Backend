import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Department } from '../models/departments.models.js'

// Create Department : Admin creates a new department and optionally assigns head supervisors/
//                     admins.
// Get All Departments : Fetch all departments with populated head supervisors and admins.
// Get Single Department by ID: Get detailed info of one department with populated fields.
// Update Department: Update department name or reassign head supervisors/admins.
// Delete Department (Soft or Hard):  Remove a department from the system.
// Assign Head Supervisor/Admin to Department: Add or replace headSupervisor or headAdmin         
//                                            for an existing department.
// Get Departments by Supervisor or Admin :Get departments where a user is headSupervisor or 
//                                             headAdmin.
// List All Supervisors/Admins by Department:Get headSupervisor and headAdmin users assigned to a 
//                                             department.
// get Head Supervisor via Department model
// get Head admin 

const createDepartment = asyncHandler( async( req, res ) => {

        const { name, headSupervisor = [] , headAdmin = [] } = req.body
        const { role,  roleType } = req.user

        if( roleType !== "main" || role !== "admin" ){
            throw new ApiError(403, "Only main admins can perform this action.")
        }

        if( !name || typeof name !== "string" ){
            throw new ApiError(400, "Department name is required and must be a string.")
        }

        const existedDepartment = await Department.findOne({ name: name.toLowerCase().trim() })

        if( existedDepartment ){
            throw new ApiError( 400, "Department already exists!" )
        }

        const department = await Department.create(
            {
                name,
                headSupervisor,
                headAdmin
            }
        )

        if( !department ){
            throw new ApiError(403, "Department not created")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    department,
                    "Department created successfully!"
                )
            )

})

const getAllDepartment = asyncHandler( async( req, res ) => {

    try {

        const { role, roleType } = req.user

        if( role !== "admin" || roleType !== "main" ){
            throw new ApiError(400, "You have no authorized to fetched data!")
        }
        
        const departments = await Department.find({})
            .populate({
                path: "headSupervisor",
                select: "-password -refreshToken"
            })
            .populate({
                path: "headAdmin",
                select: "-password -refreshToken"
            })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    departments,
                    "All Departments fetched successfully"
                )
            )

    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching departments.")
    }

})

const getDepartmentById = asyncHandler( async( req, res ) => {

    const { departmentId } = req.params;
    const { role, roleType } = req.user;

    if( role !== "admin" || roleType !== "main" ){
        throw new ApiError(403, "You have no authorized to fetched data!")
    }

    if( !departmentId ){
        throw new ApiError(403, "Department ID required!")
    }

    const department = await Department.findById(departmentId)
        .populate({
            path : "headSupervisor",
            select: "-password -refreshToken"
        })
        .populate({
            path : "headAdmin",
            select: "-password -refreshToken"
        })

    if( !department ){
        throw new ApiError(404, "Department not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                department,
                "Department fetched successfully!"
            )
        )
})

const updateDepartment = asyncHandler( async( req, res ) =>{
    
    const { role , roleType } = req.user;
    const { name, headSupervisor, headAdmin } = req.body;
    const { departmentId } = req.params;

    if( role !== "admin" || roleType !== "main" ){
        throw new ApiError(403, "You have no authorized to update data!")
    }

    if( !name && !headSupervisor && !headAdmin ){
        throw new ApiError(403, "Credintials required!")
    }

    if( !departmentId ){
        throw new ApiError(403, "Department ID required!")
    }

    const department = await Department.findByIdAndUpdate(
        departmentId,
        {
            $set:{
                name,
                headSupervisor,
                headAdmin
            }
        },
        { new: true }
    )

    if( !department ){
        throw new ApiError(404, "Department not found!")
    }

    const updatedDepartment = await Department.findById(departmentId)
        .populate({
            path: "headSupervisor",
            select: "-password -refreshToken"
        })
        .populate({
            path: "headAdmin",
            select: "-password -refreshToken"
        })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                updatedDepartment,
                "Department updated successfully"
            )
        )
})

const deleteDepartment = asyncHandler( async( req, res ) => {
    
    const { role, roleType } = req.user;
    const { departmentId } = req.params;

    if( role !== "admin" || roleType !== "main" ){
        throw new ApiError(403, "You have no authority to delete data!")
    }

    if( !departmentId ){
        throw new ApiError(403, "Department ID required!")
    }

    const department = await Department.findByIdAndDelete(departmentId)

    if( !department ){
        throw new ApiError(404, "Department not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Department deleted successfully"
            )
        )
})


export { 
    createDepartment,
    getAllDepartment,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
}