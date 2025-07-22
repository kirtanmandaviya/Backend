import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
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

    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(existedUser){
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
        .json( 
            new ApiResponse(
                201, 
                createdUser, 
                "User registered successfully"
            )
        )
})

const loginUser = asyncHandler( async ( req, res ) => {
    const { email, userName, password } = req.body

    if( !email || !userName || !password ){
        throw new ApiError(400, "All creditials required!")
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
        .json( 
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )
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

const refreshAccesssToken = asyncHandler( async ( req, res ) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required!")
    }

    try {
        const decodeToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user =  await User.findById(decodeToken?._id)

        if(!user){
            throw new ApiError(401, "Refresh token is required!")
        }

        console.log("incomingRefreshToken", incomingRefreshToken)
        console.log("user refreshtoken", user.refreshToken)

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid refresh token!")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        console.log("error:", error.message)
        throw new ApiError(500, "Something went wrong while refreshing access token")
    }
})

const updatePassword = asyncHandler( async ( req, res ) => {
    const { oldPassword, newPassword } = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(401, "Password is required!")
    }

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password!")
    }

    user.password = newPassword
    await user.save( { validateBeforeSave: false } )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password updated successfully"
            )
        )
})

const getCurrentUser = asyncHandler( async ( req, res ) => {
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                req.user,
                "Current user details"
            )
        )
})

const updateAccountDetails = asyncHandler( async ( req, res ) => {
    const { fullName, email, userName } = req.body

    if(!fullName && !userName && !email){
        throw new ApiError(401, "Credntials required!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email: email,
                userName
            } 
        },
        { new: true }
    ).select(" -password -refreshToken")

    if(!user){
        throw new ApiError(404, "User not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Credntials updated successfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccesssToken,
    updatePassword,
    getCurrentUser,
    updateAccountDetails
}