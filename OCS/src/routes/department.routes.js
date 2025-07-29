import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { createDepartment,
         getAllDepartment,
         getDepartmentById,
         updateDepartment,
         deleteDepartment,
         getDepartmentByHeadAdmin,
         getHeadSupervisor,
         getHeadAdmin
 } from '../controllers/department.contollers.js';

const router = Router();
router.use(verifyJWT);

router.route("/create-department").post(createDepartment);
router.route("/get-all-departments").get(getAllDepartment);
router.route("/get-departmentById/o/:departmentId").get(getDepartmentById);
router.route("/update-department/o/:departmentId").patch(updateDepartment);
router.route("/delete-department/o/:departmentId").delete(deleteDepartment);
router.route("/get-departmentByHeadAdmin/o/:headAdminId").get(getDepartmentByHeadAdmin);
router.route("/get-headSupervisor/o/:departmentId").get(getHeadSupervisor);
router.route("/get-headAdmin/o/:departmentId").get(getHeadAdmin);

export default router;