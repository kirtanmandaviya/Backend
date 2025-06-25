import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComment = asyncHandler( async ( req, res ) => {
    
    const { videoId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const userId = req.user?._id

    if(!videoId){
        throw new ApiError(400, "Video ID is not provided")
    }

    if(!userId){
        throw new ApiError(403, "User not authenticated")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum;

    const comments = await Comment.find({ video : videoId })
        .sort({ createdAt : -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'username')

    const totalComments = await Comment.countDocuments({ video:videoId });

    return res
        .status(200)
        .json(new ApiResponse(200, { totalComments, comments }, "Data fetched successfully"))
})

const addComment = asyncHandler( async ( req, res ) => {
    
    const { videoId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if(!videoId || !content){
        throw new ApiError(400, "Video ID or Content not provided")
    }

    if(!userId){
        throw new ApiError(400, "User not authenticated")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video is not found")
    }

    const comment = await Comment.create({
        content,
        owner:userId,
        video: videoId
    })

    if(!comment){
        throw new ApiError(400, "Something went wrong while creating comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment created successfully"))
})

const updateComment = asyncHandler( async ( req, res ) => {
    
    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if(!commentId || !content){
        throw new ApiError(400, "Comment ID or Content is not provided")
    }

    if(!userId){
        throw new ApiError(400, "User not authenticated")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },
        {new: true}
    )

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"))

})

const deleteComment = asyncHandler( async ( req, res ) => {
    
    const { commentId } = req.params
    const userId = req.user?._id

    if(!commentId){
        throw new ApiError(400, "Comment ID is not provided")
    }

    if(!userId){
        throw new ApiError(400, "User not authenticated")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    await comment.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(200, null ,  "Comment deleted successfully"))
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComment
}