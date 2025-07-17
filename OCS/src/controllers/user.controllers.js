import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/user.models.js';

const generateAccessAndRefreshToken = async ( userId ) => {
    try {
        const user = await User.findById(userId)

        if(!user){
            console.log("User doesn't exist")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generatong access and refresh tokens!")
    }
}

const registerUser = asyncHandler( async ( req, res ) => {
    const { userName, email, fullName, password } = req.body

    if(!userName || !email || !fullName || !password){
        throw new ApiError(400, "All fields are required!")
    }

    const existeduser = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(existeduser){
        throw new ApiError(401, "User with email or username already exists")
    }

    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(401, "Something went wrong while registering user!")
    }
  
    return res
        .status(201)
        .json( new ApiResponse(201, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler( async ( req, res ) => {
    const { email, userName, password } = req.body

    if(!email){
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({
        $or: [ { userName }, { email } ]
    })

    if(!user){
        throw new ApiError(404, "User not found!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400, "Invalid password!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select( "-password -refreshtoken" );

    if(!loggedInUser){
        throw new ApiError(403, "User can't logged in!")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json( new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"
        ))
})

const logoutUser = asyncHandler( async ( req, res ) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json( new ApiResponse( 
            200, 
            {}, 
            "User logges out successfully"
        ))
})
 

export {
    registerUser,
    loginUser,
    logoutUser
}