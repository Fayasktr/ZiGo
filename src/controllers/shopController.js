import asyncHandler from "express-async-handler";
import * as shopService from "../services/shopService.js";
import cartModel from "../models/cartModel.js";
import mongoose from "mongoose";

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
        const update = await shopService.wishlistUpdate(productId, userId, variantId);
        res.status(200).json({ 
            success: true, 
            message: "wishlist updated", 
            action: update.action,
            wishlistCount: update.wishlistCount 
        });
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
        const cartCount = await shopService.addToCart(userId, productId, variantId, quantity);
        
        res.status(200).json({ success: true, message: "Added to cart successfully", cartCount:cartCount });
    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message });
    }
})

export const proceedToCheckout=asyncHandler(async(req,res)=>{
    try {
        const userId=req.session?.user.id||req.user?.id;
        const isBuyNow=req.query.type == "buynow";
        let checkout;

        if(isBuyNow && req.session.buyNowItem){
            const quantity=req.query.quantity||1;
            checkout= await shopService.checkoutBuyNowOrder(userId,req.session.buyNowItem,quantity);
        }else{
            checkout=await shopService.checkoutPage(userId);
        }

        res.render("user/userAfterLogin/checkout", { 
            checkout, 
            isBuyNow: isBuyNow && !!req.session.buyNowItem 
        });
    } catch (error) {
        req.flash("error",error.message)
        res.redirect("/user/cart");
    }
})

export const placeOrder=asyncHandler(async(req,res)=>{
    try {
        const userId=req.session.user.id||req.user.id;
        const {addressId, paymentMethod,productId,variantId} =req.body;
        if (!addressId) {
            req.flash("error", "Please select a shipping address");
            return res.redirect("/user/checkout");
        }
        if (!paymentMethod) {
            req.flash("error", "Please select a payment method");
            return res.redirect("/user/checkout");
        }
        
        if(productId&&variantId){
            const placeOrder=await shopService.placeBuyNowOrder(userId,addressId,paymentMethod,req.session.buyNowItem);
            delete req.session.buyNowItem;
            res.redirect(`/order/success/${placeOrder.orderNumber}`);
        }else{
            const cartItems = await cartModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                { $lookup: { from: "productmodels", localField: "productId", foreignField: "_id", as: "product" } },
                { $unwind: "$product" },
                { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "product.category" } },
                { $unwind: "$product.category" },
                { $unwind: "$product.variants" },
                { $match: { $expr: { $eq: ["$product.variants._id", "$variantId"] } } },
                { $match: {"product.isListed":true}},
                { $project: {
                    quantity: 1,
                    productId: "$product._id",
                    productName: "$product.productName",
                    brand: "$product.brand",
                    categoryName: "$product.category.categoryName",
                    variant: "$product.variants"
                }}
            ]);
    
            const placeOrder=await shopService.placeOrder(userId,addressId,paymentMethod,cartItems);
            res.redirect(`/order/success/${placeOrder.orderNumber}`);
        }

    } catch (error) {
        console.log(error);
        req.flash("error",error.message);
        res.redirect("/user/checkout");
    }
})

export const successPage=asyncHandler(async(req,res)=>{
    try {
        const userId=req.session?.user?.id||req.user?.id;
        const orderNumber=req.params.orderNumber;
        if(!userId )throw new Error("Login required");
        if(!orderNumber)throw new Error("order Number not found");
        const successPageData=await shopService.successPage(userId,orderNumber);
        res.render("user/userAfterLogin/orderSuccess",{order:successPageData});
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/shop");
    }
})

export const buyNow=asyncHandler(async(req,res)=>{
    try {
        const {productId,variantId,quantity} =req.body;
        console.log(1)
        const buy=await shopService.buynow(productId,variantId,quantity)
        req.session.buyNowItem={productId,variantId,quantity};
        res.status(200).json({
            success:true,
            redirectUrl:"/user/checkout?type=buyNow"
        })
    } catch (error) {
            res.status(400).json({ success: false, message: error.message });
    }
})

