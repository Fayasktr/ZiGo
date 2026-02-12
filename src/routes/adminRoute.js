import express from "express";
import * as adminControl from "../controllers/adminController.js"
const router =express.Router();

router.route("/admin")
.get(adminControl.adminLoginPage)
.post(adminControl.adminAccess)

router.get("/admin/logout",adminControl.adminLogout);

const adminRoute =router;

export default adminRoute;