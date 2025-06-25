import { Router } from "express";
import { getChannelStatus,
         getChannelVideos
 } from "../controllers/dashboard.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()
router.use(verifyJWT)

router.route("/getChannelStatus").get(getChannelStatus)
router.route("/getAllVideos").get(getChannelVideos)

export default router