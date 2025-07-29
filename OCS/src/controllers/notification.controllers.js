import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.models.js"

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

export {
    createNotification
}