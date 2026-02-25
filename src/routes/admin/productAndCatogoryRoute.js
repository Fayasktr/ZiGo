import express from "express";
import * as cateAndProdController from "../../controllers/admin/adminCategoryAndProductController.js";

const router =express.Router();

router.get("/admin/category",cateAndProdController.getCategory);
router.get("/admin/category/add",cateAndProdController.addCategoryPage);
router.post("/admin/category/add",cateAndProdController.addNewCategory);

// router.get("/admin/category/edit/:id");
// router.put("/admin/category/edit/:id");

const categoryAndProductRoute = router;
export default categoryAndProductRoute;