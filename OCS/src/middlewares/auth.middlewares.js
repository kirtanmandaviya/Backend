import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { Supervisor } from '../models/supervisor.models.js';
import { Admin } from '../models/admin.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler( async ( req, res, next ) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(401, "Unauthorized")
    }

    try {
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
        const supervisor = await Supervisor.findById(decodeToken?._id).select("-password -refreshToken")
        const admin = await Admin.findById(decodeToken?._id).select("-password -refreshToken")

        if (!user && !supervisor && !admin) {
            throw new ApiError(401, "User doesn't exist");
        }

        req.user = user || supervisor || admin;

        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalide access token")
    }
})