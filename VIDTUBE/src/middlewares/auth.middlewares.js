import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler( async (req, res, next ) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    if(!token){
        throw new ApiError(401,"Unauthorized")
    }

    try {
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError (401, "User doesn't exists")
        }

        req.user = user

        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalide access token")
    }
})