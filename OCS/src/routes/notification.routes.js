import { createNotification } from '../controllers/notification.controllers.js'
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();
router.use(verifyJWT);

router.route("/create-notification").post(createNotification);

export default router;