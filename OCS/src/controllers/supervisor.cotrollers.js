import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Supervisor } from "../models/supervisor.models.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = asyncHandler(  async ( userId ) => {

    try {
        
        const user =  await Supervisor.findById(userId)

        if(!user){
            throw new ApiError(404, "User not found!")
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save( { validateBeforeSave : false } );

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating tokens!")
    }

})

const registerUser = asyncHandler( async ( req, res ) => {
    const { userName, password, email, fullName } = req.body

    if( !userName || !password || !email || !fullName ){
        throw new ApiError(401, "All details required!")
    }

    const existedUser = await Supervisor.findOne(
        {
            $or:[ { email }, { userName } ]
        }
    )

    if(existedUser){
        throw new ApiError(401, "User already exists")
    }

    const user = await Supervisor.create(
        {
            fullName,
            userName: userName.toLowerCase(),
            password,
            email
        }
    )

    if(!user){
        throw new ApiError(404, "Something went wrong while creating user!");
    }

    const createdUser = await Supervisor.findById(user._id).select( " -password -refreshToken " );

    if(!createdUser){
        throw new ApiError(401, "user not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                createdUser,
                "User created successfully"
            )
        )
})

export {
    registerUser
}