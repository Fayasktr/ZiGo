import express from "express";
import * as adminControl from "../controllers/adminController.js"
const router = express.Router();

router.route("/admin")
    .get(adminControl.adminLoginPage)
    .post(adminControl.adminAccess)

router.get("/admin/logout", adminControl.adminLogout);

router.get("/admin/users", adminControl.userManagementPage);
router.patch("/admin/users/:id/:action", adminControl.blockAndUnblock);



const adminRoute = router;

export default adminRoute;