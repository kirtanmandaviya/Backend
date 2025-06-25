import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweet.models.js";

const createTweet = asyncHandler( async ( req,  res ) => {

    const { content } = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const owner = req.user?._id

    if(!owner){
        throw new ApiError(401, "Unauthorized: User not found")
    }

    const newTweet = await Tweet.create({
        content,
        owner
    })

    return res
        .status(201)
        .json( new ApiResponse(201, newTweet, "Tweet created successfully"))
})

const getUserTweet = asyncHandler ( async ( req, res ) => {

    const { userId } = req.params

    if(!userId){
        throw new ApiError(400, "UserId is required")
    }

    const users = await User.findById(userId)

    if(!users){
        throw new ApiError(404, "User is not found")
    }

 
    const tweets = await Tweet.find({owner:userId}).sort({createdAt:-1})

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))

})

const updatetweet = asyncHandler ( async ( req, res ) => {

    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(400, "Tweet Id is not provided")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    console.log("Tweet.user:", tweet.owner);
    console.log("req.user.id:", req.user.id);

    if(tweet.owner.toString() !== req.user.id){
        throw new ApiError(403, "Not authorized to update this tweet")
    }

    const user = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:req.body.content
            }
        },
        {new:true}
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user , "Tweet updated successfully"))
})

const deleteTweet = asyncHandler ( async ( req, res ) => {

    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(400, "Tweet id is not provided")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet Id is not founded")
    }

     if (tweet.owner.toString() !== req.user.id) {
        throw new ApiError(403, "Not authorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId)

   return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweet,
    updatetweet,
    deleteTweet
}