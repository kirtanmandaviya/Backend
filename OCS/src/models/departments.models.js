// _id string pk
//   name string
//   headSupervisor ObjectId[] supervisors
//   headAdmin ObjectId[] admins
//   createdAt Date
//   updatedAt Date

import mongoose, { Schema } from "mongoose";

const departmentsSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },
        headSupervisor:[{
            type: mongoose.Types.ObjectId,
            ref:"Supervisor",
        }],
        headAdmin: [{
            type: mongoose.Types.ObjectId,
            ref: "Admin"
        }]
    },
    { timestamps: true }
)

export const Department = mongoose.model("Department", departmentsSchema)