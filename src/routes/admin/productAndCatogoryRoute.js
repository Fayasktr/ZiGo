import express from "express";
import * as cateAndProdController from "../../controllers/admin/adminCategoryAndProductController.js";

const router =express.Router();

router.get("/admin/category",cateAndProdController.getCategory);
router.get("/admin/category/add",cateAndProdController.addCategoryPage);
router.post("/admin/category/add",cateAndProdController.addNewCategory);

router.patch("/admin/category/:id/:action",cateAndProdController.listAndUnlistCategory);
router.get("/admin/category/edit/:id",cateAndProdController.getEditCategoryPage);
router.put("/admin/category/edit/:id",cateAndProdController.updateCategory);

const categoryAndProductRoute = router;
export default categoryAndProductRoute;