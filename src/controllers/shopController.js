import asyncHandler from "express-async-handler";
import * as shopService from "../services/shopService.js";

export const loadShop = asyncHandler(async (req, res) => {
    try {
        const userId = req.session?.user?.id || req?.user?.id || ""
        const shopData = await shopService.getShopData(req.query, userId);
        res.render("user/shop", shopData);
    } catch (error) {
        console.error("Shop Load Error:", error);
        res.status(500).render("user/404", { message: "Error loading shop" });
    }
});

export const loadProductDetailsePage = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId=req?.session?.user?.id||req?.user?.id||"";
        const { product, relatedProducts ,wishlist} = await shopService.productDetailsePage(productId,userId);
        console.log("product detailse:",product)
        res.render("user/productDetailse", { product, relatedProducts ,wishlist});
    } catch (error) {
        console.log(error)
        req.flash("error", error.message);
        res.redirect("/shop")
    }
})


export const wishlistUpdate = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user.id || req.user.id
        const variantId=req.query.variantId;
        console.log(`wishlist =product id:${productId}, and variant id:${variantId}, userId:${userId}`)
        const update = await shopService.wishlistUpdate(productId, userId,variantId);
        res.status(200).json({ success: true, message: "wishlist updated", action: update.action });
    } catch (error) {
        res.status(400).json({ success: false, message: "action failed" });
    }
})

export const addToCart = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        let userId = req?.session?.user?.id || req?.user?.id;
        let variantId = req.query.variantId;
        let quantity = req.query.quantity || 1;
        console.log(`add to cart =product id:${productId}, and variant id:${variantId}, userId:${userId}, quantity:${quantity}`)
        const updateCart = await shopService.addToCart(productId, userId, variantId, quantity);
        res.status(200).json({ success: true, message: "Added to cart successfully" });
    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message });
    }
})
