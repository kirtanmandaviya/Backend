import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { createPlaylist,
         getUserPlaylist,
         getPlaylistById,
         addVideoToPlaylist,
         removeVideoFromPlaylist,
         deletePlaylist,
         updatePlaylist
 } from "../controllers/playlist.controllers.js"

const router = Router()
router.use(verifyJWT)

router.route("/createPlaylist").post(createPlaylist)
router.route("/getPlaylist/p/:userId").get(getUserPlaylist)
router.route("/getPlaylistById/p/:playlistId").get(getPlaylistById)
router.route("/addVideo/p/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/removeVideo/p/:videoId/:playlistId").patch(removeVideoFromPlaylist)
router.route("/deletePlaylist/p/:playlistId").delete(deletePlaylist)
router.route("/updatePlaylist/p/:playlistId").patch(updatePlaylist)

export default router