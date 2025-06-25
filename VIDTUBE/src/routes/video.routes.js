import { Router } from "express";
import { getAllVideo,
         publishAVideo,
         getVideoById,
         updateVideo,
         deleteVideo,
         togglePublishStatus
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()
router.use(verifyJWT);

router.route("/publishAVideo").post(
    upload.fields([
        {
            name:"video",
            maxCount:1
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
)

router.route("/getAllVideo").get(getAllVideo)
router.route("/v/:videoId").get(getVideoById)
router.route("/v/:videoId").patch( upload.single("video") ,updateVideo)
router.route("/v/:videoId").delete(deleteVideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router