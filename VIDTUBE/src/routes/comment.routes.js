import { Router } from "express";
import { addComment,
         updateComment,
         deleteComment,
         getVideoComment
 } from "../controllers/comment.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router()
router.use(verifyJWT)

router.route("/addComment/c/:videoId").post(addComment)
router.route("/updateComment/c/:commentId").patch(updateComment)
router.route("/deleteComment/c/:commentId").delete(deleteComment)
router.route("/getVideoComments/c/:videoId").get(getVideoComment)

export default router