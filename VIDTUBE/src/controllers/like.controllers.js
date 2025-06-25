import mongoose from "mongoose";
import { Like } from "../models/like.models.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler( async ( req, res ) => {
   
    const { videoId } = req.params
    const userId  = req.user?._id

    if(!videoId){
        throw new ApiError(400, "Video ID is not provided")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    if(!userId){
        throw new ApiError(401, "User not authenticated")
    }

    const existingLike = await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    let isLiked;
    let likeDoc = null
    
    if(existingLike){
        await existingLike.deleteOne()
        isLiked = false;
    }

    if(!existingLike){
        likeDoc = await Like.create({
            video:videoId,
            likedBy:userId
        })
        isLiked = true;
        await likeDoc.populate('likedBy', 'username');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked, likedBy: likeDoc ? likeDoc.likedBy : null }, `Video is now ${isLiked? "Liked" : "Unliked"}  `))

})

const toggleCommentLike = asyncHandler( async ( req, res ) => {
   
    const { commentId } = req.params
    const userId = req.user?._id

    if(!commentId){
        throw new ApiError(400, "Comment ID is not provided")
    }

    if(!userId){
        throw new ApiError(403, "User not authenticated")
    }

    const existingLike = await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    let isLiked;
    let likeDoc = null;

    if(existingLike){
        await existingLike.deleteOne();
        isLiked = false
    }

    if(!existingLike){
        likeDoc = await Like.create({
            comment : commentId,
            likedBy : userId
        });
        isLiked = true,
        await likeDoc.populate('likedBy', 'username')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked, likedBy: likeDoc ? likeDoc.likedBy : null }, `Comment is now ${isLiked ? 'Liked' : 'Unliked'} `))
})

const toggleTweetLike = asyncHandler( async ( req, res ) => {
    
    const { tweetId } = req.params
    const userId = req.user?._id

    if(!tweetId){
        throw new ApiError(400, "Tweet ID is not provided")
    }

    if(!userId){
        throw new ApiError(400, "User not authenticated")
    }

    const existingLike = await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    let isLiked;
    let likeDoc = null;

    if(existingLike){
        await existingLike.deleteOne()
        isLiked = false
    }

    if(!existingLike){
        likeDoc = await Like.create({
            tweet:tweetId,
            likedBy:userId
        })
        isLiked = true,
        await likeDoc.populate('likedBy', 'username')
    }

    return res
        .status(200)
        .json(new ApiResponse(200,  {isLiked, likedBy:likeDoc? likeDoc.likedBy : null} ,` Tweet is now ${isLiked? 'Liked': "Unliked"}`))
})

const getLikedVideos = asyncHandler( async ( req, res ) => {
    
    const userId = req.user?._id
    
    if(!userId){
        throw new ApiError(400, "User not authenticated")
    }

    console.log("User ID:", req.user._id);

    const likedVideos = await Like.find({likedBy:userId , video: { $ne:null} }).populate('video', '_id title')
    console.log(likedVideos);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "All video fetched successfully"))
})

export {
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideos,
    toggleCommentLike
}