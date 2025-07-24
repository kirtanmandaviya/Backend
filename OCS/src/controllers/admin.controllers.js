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

const logoutUser = asyncHandler( async( req, res ) => {

    await Admin.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logout successfully"
            )
        )

}) 

const refreshAccesssToken = asyncHandler( async( req, res ) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken  

    if( !incomingRefreshToken ){
        throw new ApiError(401, "Refresh token is required!")
    }

  try {

        const decodeToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await Admin.findById(decodeToken._id)

        if( !user ){
            throw new ApiError(403, "User not found!")
        }

        if( incomingRefreshToken !== user?.refreshToken ){
            throw new ApiError(403, "Invalid refresh token!")
        }
  
        const { accessToken , refreshToken : newRefreshToken } = await generateAccessAndRefreshToken(user._id)
  
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

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
                    "Access token refresh successfully"
                )
            )
      
  } catch (error) {
    
  }

})

const updatePassword = asyncHandler( async( req, res ) => {

    const { oldPassword, newPassword } = req.body

    if( !oldPassword || !newPassword ){
        throw new ApiError(401, "Credintials required!")
    }

    const user = await Admin.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if( !isPasswordValid ){
        throw new ApiError(403, "Invalid password!")
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

const updateAccountDetails = asyncHandler( async( req, res ) => {

    const { fullName, email, userName } = req.body

    if( !fullName && !email && !userName ){
        throw new ApiError(403, "Credintials required!")
    }

    const user = await Admin.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                userName: userName.toLowerCase(),
                email: email
            }
        },
        { new : true }
    ).select( "-password -refreshToken" )

    if( !user ){
        throw new ApiError(404, "User not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Credintials update successfully"
            )
        )

})

const getCurrentUser = asyncHandler( async( req, res ) => {

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "User data fetched successfully"
            )
        )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccesssToken,
    updatePassword,
    updateAccountDetails,
    getCurrentUser
}