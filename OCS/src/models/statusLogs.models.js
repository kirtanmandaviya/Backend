//  _id string pk
//   complaintId ObjectId[] complaints
//   changedBy ObjectId[] users
//   oldStatus string
//   newStatus string
//   changedAt Date
//   createdAt Date
//   updatedAt Date

import mongoose, { Schema } from "mongoose";

const statusLogsSchema = new Schema (
    {
        complaintId:{ 
            type: mongoose.Types.ObjectId,
            ref: "Complaint"
        },
        changedBy: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        oldStatus: {
            type: String,
            enum: ["pending", "in-review", "resolved", "rejected"],
            required: true,
            trim: true,
            lowercase: true
        },
        newStatus: {
            type: String,
            enum: ["pending", "in-review", "resolved", "rejected"],
            required: true,
            trim: true,
            lowercase: true
        },
        changedAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
)

export const StatusLog = mongoose.model("StatusLog", statusLogsSchema)