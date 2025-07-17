import { registerUser } from "../controllers/supervisor.cotrollers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";

const router = Router()

router.route("/register").post(registerUser)

export default router;