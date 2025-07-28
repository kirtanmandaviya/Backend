import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { createDepartment,
         getAllDepartment,
         getDepartmentById,
         updateDepartment,
         deleteDepartment
 } from '../controllers/department.contollers.js';

const router = Router();
router.use(verifyJWT);

router.route("/create-department").post(createDepartment);
router.route("/get-all-departments").get(getAllDepartment);
router.route("/get-departmentById/o/:departmentId").get(getDepartmentById);
router.route("/update-department/o/:departmentId").patch(updateDepartment);
router.route("/delete-department/o/:departmentId").delete(deleteDepartment)

export default router;