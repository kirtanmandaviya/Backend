import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.models.js"

const toggleSubscription = asyncHandler( async ( req, res ) => {

    const { channelId } = req.params
    const subscribedId  = req.user._id

    if(!channelId){
        throw new ApiError(400, "Channel Id is not provided")
    }

    console.log("subscribedId:", subscribedId)
    console.log("channelId:", channelId)

    if(channelId.toString() === subscribedId.toString()){
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

   const existingSubscription = await Subscription.findOne({
        subscriber:subscribedId,
        channel:channelId
    })

    let isSubscribed;

    if(existingSubscription){
        await existingSubscription.deleteOne()
        isSubscribed = false
    }

    if(!existingSubscription){
        await Subscription.create({
            subscriber:subscribedId,
            channel:channelId
        })
        isSubscribed = true
    }

    return res
        .status(200)
        .json(new ApiResponse(200,  { isSubscribed }, `Channel is now ${isSubscribed? "Subscribed" : "unSubscribed"}`))

})

// Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler( async ( req, res ) => {

    const { channelId } = req.params

    if(!channelId){
        throw new ApiError(400, "Channel Id is not provided")
    }

    const channel = await Subscription.find({ channel: channelId }).populate("subscriber", "name email")

    if(!channel){
        throw new ApiError(404, "Channel is not found")
    }

    const subscribers = channel.map((sub) => sub.subscriber)

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, `count:${subscribers.length}` ))
})

// Controller to return channel list to which user has subscriberd
const getSubscribedChannel = asyncHandler( async ( req, res) => {
    
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400, "Subscriber Id is not provided")
    }

    const subscriptions  = await Subscription.find({subscriber: subscriberId}).populate("channel", "username email")

     if (!subscriptions || subscriptions.length === 0) {
        throw new ApiError(404, "User is not subscribed to any channels");
    }

    const channels = subscriptions .map((sub) => sub.channel)

    return res
        .status(200)
        .json(new ApiResponse(200, channels, `count:${subscriptions .length}`))
})


 
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannel
}