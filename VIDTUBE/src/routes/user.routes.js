import { Router } from "express";
import { registerUser,
         logoutUser,
         loginUser,
         refreshAccessToken,
         updateCurrentPassword,
         getCurrentUser,
         getUserChannelProfile,
         updateAccountDetails,
         updateUserAvatar,
         updateUserCoverImage,
         getWatchHistory
        } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
 
const router = Router()

// Unsecure routes

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// secure routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT,     updateCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar") ,updateUserAvatar)
router.route("/update-coverimage").patch(verifyJWT , upload.single("coverImage"), updateUserCoverImage)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router