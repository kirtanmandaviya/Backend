// complaints[icon:list]{
//   _id string pk
//   title string
//   description string
//   category string  // "ragging", "harassment", "other"
//   submittedBy ObjectId[] users
//   status string  // "pending", "in-review", "resolved", "rejected"
//    isAnonymous Boolean  // For hidding student identification
//    attachments [string]  //// file URLs or file IDs
//    department string
//    assignedToSupervisor ObjectId[] supervisors
//    createdAt Date
//    updatedAt Date
//  }

import mongoose, { Schema } from "mongoose";

const complaintSchema = new Schema(
    {
        title:{
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            enum: ["ragging", "harassment", "other"],
            lowercase: true,
            trim: true
        },
        submittedBy:{
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        status: {
            type: String,
            enum: ["pending", "in-review", "resolved", "rejected"],
            default: "pending",
            lowercase: true,
            trim : true
        },
        isAnonymous: {
            type: Boolean,
            default: false
        },
        attachments: [{
            type : String
        }],
        department: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        assignedToSupervisor:[{
            type: Schema.Types.ObjectId,
            ref: "Supervisor"
        }]
    },
    { timestamps: true }
)

export const Complaint = mongoose.model("Complaint", complaintSchema)