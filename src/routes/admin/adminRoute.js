import express from "express";
import * as adminControl from "../../controllers/admin/adminController.js"
import adminAuth from "../../middlewares/adminAuth.js"
import * as adminDashboard from "../../controllers/admin/dashboradAndSalseContl.js";
import upload from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

router.route("/admin")
    .get(adminAuth.redirectIfLoggedIn, adminControl.adminLoginPage)
    .post(adminControl.adminAccess)

router.use(adminAuth.preventCache);

router.use("/admin", adminAuth.protectAdmin);

router.get("/admin/dashboard", adminDashboard.adminDashboard);
router.get("/admin/api/dashboardData",adminDashboard.getDashboardData);
router.get("/admin/reports",adminDashboard.salsePage);
router.get("/admin/api/reportData",adminDashboard.reportData);

router.get("/export/pdf", adminDashboard.exportSalesPDF);
router.get("/export/excel", adminDashboard.exportSalesExcel);

router.get("/admin/logout", adminControl.adminLogout);

router.get("/admin/users", adminControl.userManagementPage);
router.patch("/admin/users/:id/:action", adminControl.blockAndUnblock);

router.get("/admin/orders",adminControl.adminOrderList);
router.get("/admin/orderDetails/:id",adminControl.orderDetailsePage);
router.patch("/admin/orderDetails/:id/update",adminControl.orderStatusUpdate);

router.patch("/admin/orders/:orderId/item/:itemId/return",adminControl.handleReturnRequest);

router.get("/admin/coupons",adminControl.couponPage);
router.get("/admin/coupon/addEditPage",adminControl.addEditCouponPage);
router.post("/admin/coupon/add",adminControl.addCoupon,()=>console.log("ethyo"));
router.put("/admin/editCoupon/:id",adminControl.editCoupon);
router.delete("/admin/coupon/delete/:id",adminControl.deleteCoupon);

router.get("/admin/offers", adminControl.offersPage);
router.get("/admin/offer/addEditPage", adminControl.addEditOfferPage);
router.post("/admin/offer/add", adminControl.addOffer);
router.put("/admin/offer/edit/:id", adminControl.editOffer);
router.delete("/admin/offer/delete/:id", adminControl.deleteOffer);

router.get("/admin/banners",adminControl.bannerPage);
router.get("/admin/banners/addEditPage", adminControl.addEditBannerPage);
router.post("/admin/addBanner", upload.single('image'), adminControl.addBanner);
router.put("/admin/editBanner/:id", upload.single('image'), adminControl.editBanner);
router.delete("/admin/deleteBanner",adminControl.deleteBanner);
router.patch("/admin/banner/changeStatus/:id",adminControl.bannerStatus);

const adminRoute = router;

export default adminRoute;