import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { PlayList } from "../models/playlist.models.js"

const createPlaylist = asyncHandler( async ( req, res ) => {
    
    const { name, description } = req.body

    if(!name || !description){
        throw new ApiError(400, "Name and Description are required")
    }

    const owner = req.user?._id;

    if(!owner){
        throw new ApiError(401, "Unauthorized: Owner not found")
    }

    const playlist = await PlayList.create({
        name,
        description,
        owner
    })

    if(!playlist){
        throw new ApiError(400, "Something went wrong while creating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist is created successfully"))
})

const getUserPlaylist = asyncHandler( async ( req, res ) => {
    
    const { userId } = req.params

    if(!userId){
        throw new ApiError(400, "User Id is not provided")
    }

    const playlists = await PlayList.find({owner:userId})

    if(!playlists.length === 0){
        throw new ApiError(404, "User has not created any playlists")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlist found"))
})

const getPlaylistById = asyncHandler( async ( req, res ) => {
    
    const { playlistId } = req.params

    if(!playlistId){
        throw new ApiError(400, "Playlist Id is not provided")
    }

    console.log("playlistId:" , playlistId)

    const playlist = await PlayList.findById(playlistId)

    if(!playlist || playlist.length === 0){
        throw new ApiError(404, "Playlist is not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist is found"))
})

const addVideoToPlaylist = asyncHandler( async ( req, res ) => {
    
    const { playlistId, videoId } = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400, "Playlist ID or Video ID is not provided")
    }

    const playlist = await PlayList.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist is not found")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }

    //Check if video already exists in playlist
    const videoExists = playlist.videos.some((v) => v.toString() === videoId)

    if(videoExists){
        throw new ApiError(400, "Video already exists in playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler( async ( req, res ) => {
    
    const { videoId, playlistId } = req.params

    if(!videoId || !playlistId){
        throw new ApiError(400, "Video ID or Playlist ID is not provided")
    }

    const playlist = await PlayList.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId) || !mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist Id or Video Id")
    }

    const videoExists =  playlist.videos.some((v) => v.toString() === videoId)

    if(!videoExists){
        throw new ApiError(404, "Video is not found")
    }

    playlist.videos.pull(videoId)
    await playlist.save()

    return res
        .status(200)
        .json(new ApiResponse(200, playlist , "Video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler( async ( req, res ) => {
    
    const { playlistId } = req.params

    if(!playlistId){
        throw new ApiError(400, "Playlist ID is not provided")
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await PlayList.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist is not found")
    }

    await PlayList.findByIdAndDelete(playlist)

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler( async ( req, res ) => {
    
    const { playlistId } = req.params
    const { name , description } = req.body

    if(!playlistId){
        throw new ApiError(400, "Playlist  ID not provided")
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }

    if(!name && !description){
        throw new ApiError(400, "At least one of Name or Description must be provided")
    }

    const playlist = await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {new:true}
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}