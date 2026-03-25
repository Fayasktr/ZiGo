import express from "express";
import * as shopCntrl from "../controllers/shopController.js"
import wishlistAndCart from "../middlewares/wishlistAndCartMiddlware.js";
import userAuth from "../middlewares/userAuthMiddlware.js"
import { showProfile } from "../controllers/userProfileController.js";
const router = express.Router();
router.use(userAuth.preventCache,userAuth.checkBlocked);

router.get("/shop", shopCntrl.loadShop);

router.get("/productDetailse/:productId", shopCntrl.loadProductDetailsePage);

router.patch("/shop/wishlist/:id", wishlistAndCart.isThereUser, shopCntrl.wishlistUpdate);
router.post("/shop/cart/:id",wishlistAndCart.isThereUser,shopCntrl.addToCart);
router.get("/user/checkout",wishlistAndCart.isThereUser,shopCntrl.proceedToCheckout);
router.post("/user/checkout/place",wishlistAndCart.isThereUser,shopCntrl.placeOrder);
router.get("/order/success/:orderNumber",wishlistAndCart.isThereUser,shopCntrl.successPage);

const shopRoute = router;

export default shopRoute;