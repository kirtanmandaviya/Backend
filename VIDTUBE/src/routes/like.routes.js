import { Router } from "express"
import { toggleVideoLike,
         toggleTweetLike,
         getLikedVideos,
         toggleCommentLike
 } from "../controllers/like.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"


const router = Router()
router.use(verifyJWT)

router.route("/toggleVideoLike/l/:videoId").post(toggleVideoLike)
router.route("/toggleTweetLike/l/:tweetId").post(toggleTweetLike)
router.route("/getLikedVideo").get(getLikedVideos)
router.route("/toggleCommentLike/l/:commentId").post(toggleCommentLike)

export default router