import express from "express";
import * as adminControl from "../../controllers/adminController.js"
import adminAuth from "../../middlewares/adminAuth.js"
const router = express.Router();

router.route("/admin")
    .get(adminAuth.redirectIfLoggedIn, adminControl.adminLoginPage)
    .post(adminControl.adminAccess)

router.use(adminAuth.preventCache);

router.use("/admin", adminAuth.protectAdmin);

router.get("/admin/dashbord", adminControl.adminDashbord);
router.get("/admin/logout", adminControl.adminLogout);

router.get("/admin/users", adminControl.userManagementPage);
router.patch("/admin/users/:id/:action", adminControl.blockAndUnblock);

router.get("/admin/orders",adminControl.adminOrderList);
router.get("/admin/orderDetails/:id",adminControl.orderDetailsePage);
router.patch("/admin/orderDetails/:id/update",adminControl.orderStatusUpdate);

router.patch("/admin/orders/:orderId/item/:itemId/return",adminControl.handleReturnRequest);

const adminRoute = router;

export default adminRoute;