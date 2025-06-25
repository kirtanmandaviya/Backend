import { Router } from "express"
import { toggleSubscription,
         getUserChannelSubscribers,
         getSubscribedChannel
 } from "../controllers/subscription.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"


const router = Router()
router.use(verifyJWT)

router.route("/toggle/c/:channelId").post(toggleSubscription)
router.route("/subscribers/c/:channelId").get(getUserChannelSubscribers)
router.route("/channel/c/:subscriberId").get(getSubscribedChannel)

export default router