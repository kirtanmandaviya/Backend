import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.models.js"
import { Subscription } from "../models/subscription.models.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStatus = asyncHandler( async ( req, res ) => {
   
    const channelId = req.user?._id

    if(!channelId){
        throw new ApiError(400, "Channel ID not provided")
    }

    const totalVideos = await Video.countDocuments({ channel: channelId })

    const totalViewsAgg = await Video.aggregate([
        {
            $match : {channel: channelId}
        },
        {
            $group:{
                _id:null,
                totalViews:{
                    $sum:"$views"
                }
            }
        }
    ])

    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    const totalSubscribers = await Subscription.countDocuments( { channel:channelId })

    const videoIds = await Video.find({ channel: channelId }).distinct("_id")
    const totalLikes = await Like.countDocuments({ video: { $in:videoIds } })

    return res
        .status(200)
        .json(new ApiResponse(200, { totalVideos, totalViews, totalSubscribers, totalLikes}, "All data fetched successfully"))
})

const getChannelVideos = asyncHandler( async ( req, res ) => {
    
    const channelId = req.user?._id
    const { page = 1, limit = 10   } = req.query

    if(!channelId){
        throw new ApiError(400, "Channel ID is not provided")
    }

    console.log("Extracted channelId:", channelId);

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = ( pageNum - 1 ) * limitNum

    const videos = await Video.find({owner: new mongoose.Types.ObjectId(channelId)})
        .sort({ createdAt : -1 })
        .skip(skip)
        .limit(limitNum)

    if(!videos.length){
        throw new ApiError(404, "No video uploaded")
    }

    const totalVideos = await Video.countDocuments({owner: new mongoose.Types.ObjectId(channelId)})

    return res
        .status(200)
        .json(new ApiResponse(200, {videos , totalVideos}, "All videos fetched successfully"))
})

export {
    getChannelStatus,
    getChannelVideos
}