//  _id string pk
//   name string
//   email string
//   password string
//   permissions [string]  // e.g., ["manageUsers", "assignComplaints", "viewAllComplaints"]
//   createdAt Date
//   updatedAt Date

import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminSchema = new Schema (
    {
        name: {
            type : String,
            required: true,
            lowercase: true,
            trim: true
        },
        email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
                unique: true,
                index: true
        },
        password: {
            type: String,
            required: true,
        },
        permissions: [{
            type: [String],
            enum: ["manageUsers", "assignComplaints", "viewAllComplaints"],
            default: ["assignComplaints"]
        }]
    },
    { timestamps: true }
)

adminSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next()
})

adminSchema.methods.isPasswordCorrect = async function (password) {
    const result = await bcrypt.compare(password, this.password);
    return result;
}

adminSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        name: this.name,
        email : this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}

adminSchema.methods.generateRefreshToken = async function () {
    return jwt.sign({
        _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}

export const Admin = mongoose.model("Admin", adminSchema)