import { Admin } from '../models/admin.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken =  async ( userId ) => {

    try {
        
        const user =  await Admin.findById(userId)

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

} 

const registerUser = asyncHandler( async ( req, res ) => {

    const { userName, fullName, email, password } = req.body

    if( !userName && !fullName && !email && !password ){
        throw new ApiError(401, "All credintials required!")
    }

    const existedUser = await Admin.findOne(
        {
            $or: [ { email }, { userName } ]
        }
    )

    if( existedUser ){
        throw new ApiError(403, "User already exist!")
    }

    const user = await Admin.create(
        {
            fullName,
            userName: userName.toLowerCase(),
            email: email,
            password
        }
    )

    if( !user ){
        throw new ApiError(500, "Something went wrong while registering user!")
    }

    const createdUser = await Admin.findById(user._id).select( "-password -refreshToken" )

    if( !createdUser ){
        throw new ApiError(404, "User not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                createdUser,
                "User registered successfully"
            )
        )
})

const loginUser = asyncHandler( async( req, res ) => {

    const { userName, email, password } = req.body

    if( !userName || !email || !password ){
        throw new ApiError(401, "All credintials required!")
    }

    const user = await Admin.findOne(
        {
            $or:[ { email }, { userName } ]
        }
    )

    if( !user ){
        throw new ApiError(404, "User not found!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if( !isPasswordValid ){
        throw new ApiError(401 , "Invalid password!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await Admin.findById(user._id).select( "-password -refreshToken" )

    
    if( !loggedInUser ){
        throw new ApiError(403, "User can't login!")
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
                { user : loggedInUser, accessToken, refreshToken},
                "User login successfully"
            )
        )

})

export {
    registerUser,
    loginUser
}