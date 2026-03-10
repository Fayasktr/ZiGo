import asyncHandler from "express-async-handler";
import * as shopService from "../services/shopService.js";

export const loadShop = asyncHandler(async (req, res) => {
    try {
        const shopData = await shopService.getShopData(req.query);
        res.render("user/shop", shopData);
    } catch (error) {
        console.error("Shop Load Error:", error);
        res.status(500).render("user/404", { message: "Error loading shop" });
    }
});

export const loadProductDetailsePage = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.productId;
        const { product, relatedProducts } = await shopService.productDetailsePage(productId);
        console.log("kdjnfkdj")
        res.render("user/productDetailse", { product, relatedProducts });
    } catch (error) {
        console.log(error)
        req.flash("error", error.message);
        res.redirect("/shop")
    }
})

export const wishlistUpdate = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user._id || req.user._id;
        const update = await shopService.wishlistUpdate(productId, userId);
        res.status(200).json({ success: true, message: "wishlist updated", action: update.action });
    } catch (error) {
        res.status(400).json({ success: false, message: "action failed" });
    }
})

export const addToCart = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})