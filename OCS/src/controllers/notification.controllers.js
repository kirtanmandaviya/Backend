import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.models.js"
import mongoose from "mongoose";

// 1:Create Notification
// Route: POST /notifications
// Who can use it:

// ✅ Main Admin

// ✅ Head Admin

// ✅ Head Supervisor (optional)

// 2: Get All Notifications for Logged-In User
// Route: GET /notifications
// Who can use it:

// ✅ Any logged-in user (user, supervisor, admin)

// 3. Mark a Notification as Read
// Route: PATCH /notifications/:notificationId/read
// Who can use it:

// ✅ Only the notification recipient

// 4:Delete a Notification
// Route: DELETE /notifications/:notificationId
// Who can use it:

// ✅ Main Admin

// ✅ (Optionally) allow users to delete their own notifications


// 5: Mark All Notifications as Read
// Route: PATCH /notifications/mark-all-read
// Who can use it:

// ✅ Any logged-in user (only affects their own notifications)

const createNotification = asyncHandler( async( req, res ) => {

    const { role } = req.user
    const { userId, message } = req.body;
 
    if( role !== "admin" && role !== "supervisor" ){
        throw new ApiError(403, "You have no authority to create notification!")
    }
 
    if( !userId || !message ){
        throw new ApiError(400, "User ID or Meaasge are required!")
    }
 
    const exsitedNotification = await Notification.findOne({ 
        userId,
        message: message.trim().toLowerCase()
    })
 
    if( exsitedNotification ){
        throw new ApiError(409, "This message was already sent to that user")
    }
 
    const notification = await Notification.create({
        userId,
        message: message.trim().toLowerCase()
    })

    if( !notification ){
        throw new ApiError(403, "Something went wrong while creating notification!")
    }
 
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                notification,
                "Notification created successfully"
            )
        )

})

const getAllNotification = asyncHandler( async( req, res) => {

    const userId = req.user?._id;
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const skip = ( page - 1 ) * limit;

    if( !userId ){
        throw new ApiError(403, "User ID required!")
    }

    const notifications = await Notification.find({ userId })
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })

    if( !notifications || notifications.length === 0 ){
        throw new ApiError(404, "Notifcation not found!")
    }

    const totalNotifications = await Notification.countDocuments({ userId })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notifications: notifications, totalNotifications },
                "All notification fetched successfully"
            )
        )

})

const markNotificationAsRead = asyncHandler( async( req, res ) => {

    const { notificationId } = req.params;
    const userId = req.user?._id;

    if( !notificationId ){
        throw new ApiError(403, "Notification ID required!")
    }

    if( !userId ){
        throw new ApiError(400, "User ID required!")
    }

    if( !mongoose.Types.ObjectId.isValid(notificationId) ){
        throw new ApiError(400, "Invalid notification ID!")
    }

    const notification = await Notification.findById(notificationId);

    if( !notification ){
        throw new ApiError(404, "Notification not found!")
    }

    if( notification.userId.toString() !== userId.toString() ){
        throw new ApiError(403, "You are not authorized to mark this notification as read")
    }

    if(notification.isRead){
        return res
            .status(200)
            .json(
                new ApiResponse
                    (200, 
                    notification, 
                    "Notification was already marked as read"
                )
            );
    }

    notification.isRead = true;
    await notification.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                notification,
                "Notification marked as read successfully"
            )
        )
})

const deleteNotification = asyncHandler( async( req, res ) => {

    const { role } = req.user;
    const { notificationId } = req.params;

    if( role !== "admin" ){
        throw new ApiError(403, "You have no authority to delete notification!")
    }

    if( !notificationId ){
        throw new ApiError(403, "Notification ID required!")
    }

    if( !mongoose.Types.ObjectId.isValid(notificationId) ){
        throw new ApiError(400, "Invalid notification ID!")
    }

    const notification = await Notification.findByIdAndDelete(notificationId)

    if( !notification ){
        throw new ApiError(404, "Notification not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Notifcation deleted successfully"
            )
        )

})

const markAllNotificationAsRead = asyncHandler( async( req, res ) => {

    const userId = req.user?._id;

    if( !userId ){
        throw new ApiError(400, "User ID required!")
    }

    const notification =  await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    )

    if( !notification ){
        throw new ApiError(404, "Notification not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    matchedCount: notification.matchedCount || notification.n,
                    modifiedCount: notification.modifiedCount || notification.nModified
                },
                "All unread notifications marked as read"
            )
        )

})

export {
    createNotification,
    getAllNotification,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationAsRead
}