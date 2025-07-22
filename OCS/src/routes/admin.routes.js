import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { registerUser,
         loginUser
 } from '../controllers/admin.controllers.js'

const router = Router()

router.route("/register-user").post(registerUser)
router.route("/login").post(loginUser)

export default router