import express from "express";
import * as cateAndProdController from "../../controllers/admin/adminCategoryAndProductController.js";
import upload from "../../middlewares/uploadMiddleware.js"
import adminMiddleware from "../../middlewares/adminAuth.js"

const router = express.Router();

router.use("/admin", adminMiddleware.preventCache, adminMiddleware.protectAdmin);

router.get("/admin/category", cateAndProdController.getCategory);
router.get("/admin/category/add", cateAndProdController.addCategoryPage);
router.post("/admin/category/add", cateAndProdController.addNewCategory);
router.patch("/admin/category/:id/:action", cateAndProdController.listAndUnlistCategory);
router.get("/admin/category/edit/:id", cateAndProdController.getEditCategoryPage);
router.put("/admin/category/edit/:id", cateAndProdController.updateCategory);


router.get("/admin/products", cateAndProdController.productPage);
router.patch("/admin/products/:id/:isListed", cateAndProdController.listAndUnlistProduct);
router.get("/admin/addProducts", cateAndProdController.addProductPage);
router.post("/admin/addProducts/add", upload.any(), cateAndProdController.addProduct);

router.get("/admin/products/edit/:id", cateAndProdController.editProductPage);
router.put("/admin/products/update", upload.any(), cateAndProdController.updateProduct)

const categoryAndProductRoute = router;
export default categoryAndProductRoute;