import express from "express";
import * as shopCntrl from "../controllers/shopController.js"
import wishlistAndCart from "../middlewares/wishlistAndCartMiddlware.js";

const router = express.Router();

router.get("/shop", shopCntrl.loadShop);

router.get("/productDetailse/:productId", shopCntrl.loadProductDetailsePage);

router.patch("/shop/wishlist/:id", wishlistAndCart.isThereUser, shopCntrl.wishlistUpdate);
// router.patch("/shop/cart/:id")

const shopRoute = router;

export default shopRoute;