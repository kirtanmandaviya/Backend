import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js"; 
import { uploadOnCloudinary, deleteFromCloudinary, cloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";


const getAllVideo = asyncHandler ( async (req, res ) => {

    const { page = 1,
            limit = 10,
            query,
            sortBy,
            sortType,
            userId 
        } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = ( pageNum - 1 ) * limitNum

    const filter = {
        isPublished : true
    }

    if(query){
        filter.$or = [
            {title: { $regex:query , $options: 'i'}},
            {description: { $regex:query, $options: 'i'} }
        ]
    }

     if (userId) {
        filter.owner = userId;
    }

    const sort = {
        [sortBy]: sortType === 'asc' ? 1 : -1
    }

    const videos = await Video.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'username')

    const total = await Video.countDocuments(filter)

    return res
        .status(200)
        .json(new ApiResponse(200, { total, videos } , "All videos fetched successfully"))
})

const publishAVideo = asyncHandler ( async ( req, res) => {

    const { title , description} = req.body
    const userId = req.user?._id

     if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if(!title || !description){
        throw new ApiError(400, "Title and Description is required")
    }

    const videoLocalPath = req.files?.video?.[0]?.path
    console.log("videoLocalPath", videoLocalPath)

    if(!videoLocalPath){
        throw new ApiError(400, "No video file is uploaded")
    }

    let uploadVideo;

    try {
        uploadVideo = await uploadOnCloudinary(videoLocalPath)
        console.log("video uploaded", uploadVideo)
    } catch (error) {
        console.log("Error uploading video")
        throw new ApiError(500, "Failed to upload a video")
    }

    const thumbnail = cloudinary.url(uploadVideo.public_id, {
        format: "jpg",
        width: 300,
        height: 200,
        crop: "fill",
    });

    try {
        const newVideo = await Video.create({
            title,
            description,
            videoFile:uploadVideo?.url,
            thumbnail,  
            durations: uploadVideo?.duration || 0,
            owner:userId
        })

        const createdVideo = await Video.findById(newVideo._id)

        if(!createdVideo){
            throw new ApiError(500, "Something went wrong while creating a video")
        }

        return res.status(200)
                  .json(new ApiResponse(200, createdVideo, "Video published successfully"))
    } catch (error) {
        console.error("DB create error:", error);
        if(uploadVideo?.public_id){
            await deleteFromCloudinary(uploadVideo.public_id)
        }

        throw new ApiError(500, "Something went wrong while creating a video and video is deleted")
    }
})

const getVideoById = asyncHandler ( async ( req, res ) => {
    
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "VideoId is not provided")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Can't found video")
    }

    return res
        .status(200)
        .json( new ApiResponse(200, video , "Video is found"))
})

const updateVideo = asyncHandler ( async ( req, res) => {

    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Video id is not provided")
    }

      if (!req.file || !req.file.path) {
        throw new ApiError(400, "No file uploaded");
    }

    const video = await uploadOnCloudinary(req.file.path)

    if(!video.url){
        throw new ApiError(400,"Something went wrong while updating")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                video : video.url
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Video is updated successfully"))
})

const deleteVideo = asyncHandler ( async ( req, res) => {

    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Video Id is not provided")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video is not found")
    }

    const videoUrl = video.videoFile
    const publicId = videoUrl.split("/").pop().split(".")[0]

    const cloudinaryResponse = await deleteFromCloudinary(publicId)
    console.log("cloudinaryResponse:", cloudinaryResponse)

    if(cloudinaryResponse?.result !== "ok" && cloudinaryResponse?.result !== "not found"){
        throw new ApiError(400, "Something went wrong while deleting video from cloudinary")
    }

    await Video.findByIdAndDelete(videoId)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $pull: {
                video:videoId 
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user , "Video is deleted"))
})

const togglePublishStatus = asyncHandler( async ( req, res ) => {

    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "VideoId is not provided")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video is not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res
        .status(200)
        .json( new ApiResponse(200, video, `Video is now ${video.isPublished ? "published" : "unpublished"}`))
})

export{
    getAllVideo,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}