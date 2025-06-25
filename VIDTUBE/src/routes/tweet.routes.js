import { Router } from "express";
import { createTweet,
         getUserTweet,
         updatetweet,
         deleteTweet
 } from "../controllers/tweet.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(verifyJWT)

router.route("/createTweet").post(createTweet)
router.route("/getAllTweets/t/:userId").get(getUserTweet)
router.route("/updateTweets/t/:tweetId").patch(updatetweet)
router.route("/deleteTweets/t/:tweetId").delete(deleteTweet)

export default router