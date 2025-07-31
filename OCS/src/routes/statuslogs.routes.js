import { createStatusLog,
         getAllStatusLogsForComplaint,
         getStatusLogsChangedByUser
 } from '../controllers/statusLogs.controllers.js';
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js'

const router = Router();
router.use(verifyJWT);

router.route("/create-statusLog").post(createStatusLog);
router.route("/get-allStatusLogForCompalint/s/:complaintId").get(getAllStatusLogsForComplaint);
router.route("/get-statusLogsChagedByUser/s/:userId").get(getStatusLogsChangedByUser)

export default router;