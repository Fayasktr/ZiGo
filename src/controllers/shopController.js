import asyncHandler from "express-async-handler";
import * as shopService from "../services/shopService.js";
import cartModel from "../models/cartModel.js";
import mongoose from "mongoose";
import walletModel from "../models/walletModel.js";
import orderModel from "../models/orderModel.js";
import * as paymentService from "../services/paymentService.js"

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
        const userId = req?.session?.user?.id || req?.user?.id || "";
        const { product, relatedProducts, wishlist } = await shopService.productDetailsePage(productId, userId);
        res.render("user/productDetailse", { product, relatedProducts, wishlist });
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
        const variantId = req.query.variantId;
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

        res.status(200).json({ success: true, message: "Added to cart successfully", cartCount: cartCount });
    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message });
    }
})

export const proceedToCheckout = asyncHandler(async (req, res) => {
    try {
        const userId = req.session?.user.id || req.user?.id;
        const isBuyNow = req.query.type == "buynow";
        let checkout;
        const wallet = await walletModel.findOne({ userId });

        if (isBuyNow && req.session.buyNowItem) {
            const quantity = req.query.quantity || 1;
            checkout = await shopService.checkoutBuyNowOrder(userId, req.session.buyNowItem, quantity);
        } else {
            checkout = await shopService.checkoutPage(userId);
        }

        res.render("user/userAfterLogin/checkout", {
            checkout,
            wallet,
            isBuyNow: isBuyNow && !!req.session.buyNowItem
        });
    } catch (error) {
        req.flash("error", error.message)
        res.redirect("/user/cart");
    }
})

export const placeOrder = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.id || req.user.id;
        const { addressId, paymentMethod, productId, variantId } = req.body;

        const sendError = (message, path = "/user/checkout") => {
            if (paymentMethod === "razorpay") {
                return res.status(400).json({ success: false, message });
            }
            req.flash("error", message);
            return res.redirect(path);
        };

        if (!addressId) return sendError("Please select a shipping address");
        if (!paymentMethod) return sendError("Please select a payment method");

        let cartItems;
        let subTotal = 0;
        let total = 0;

        if (paymentMethod !== "cash") {
            if (productId && variantId) {
                const buyNowData = await shopService.checkoutBuyNowOrder(userId, req.session.buyNowItem);
                total = Number(buyNowData.totals.total);
            } else {
                cartItems = await getCartData(userId);
                if (!cartItems || cartItems.length === 0) {
                    return sendError("Your cart is empty", "/user/cart");
                }
                subTotal = cartItems.reduce((s, i) => s + (Number(i.variant?.price) || 0) * i.quantity, 0);
                const shipping = subTotal < 1000 ? 40 : 0;
                const tax = Math.round(subTotal * 0.18);
                total = Number(subTotal) + Number(shipping) + Number(tax);
            }

            if (total <= 0 || isNaN(total)) {
                return sendError("Invalid order amount");
            }

            if (paymentMethod === "razorpay") {
                let order;
                if (productId && variantId) {
                    order = await shopService.placeBuyNowOrder(userId, addressId, paymentMethod, req.session.buyNowItem);
                    delete req.session.buyNowItem;
                } else {
                    const cart = await getCartData(userId);
                    order = await shopService.placeOrder(userId, addressId, paymentMethod, cart);
                }

                const data = await paymentService.createRazorpayOrder(total);
                
                order.razorpayOrderId = data.orderId;
                await order.save();

                return res.status(200).json({ 
                    success: true, 
                    ...data, 
                    dbOrderId: order._id,
                    orderNumber: order.orderNumber 
                });
            } else if (paymentMethod === "wallet") {
                await paymentService.checkWalletBalance(userId, total);
            }
        }

        if (paymentMethod !== "razorpay") {
            if (productId && variantId) {
                const order = await shopService.placeBuyNowOrder(userId, addressId, paymentMethod, req.session.buyNowItem);
                delete req.session.buyNowItem;
                return res.redirect(`/order/success/${order.orderNumber}`);
            } else {
                const cart = await getCartData(userId);
                const order = await shopService.placeOrder(userId, addressId, paymentMethod, cart);
                return res.redirect(`/order/success/${order.orderNumber}`);
            }
        }

    } catch (error) {
        console.error("Place Order Error:", error);
        if (req.body.paymentMethod === "razorpay") {
            return res.status(500).json({ success: false, message: error.message });
        }
        req.flash("error", error.message);
        res.redirect("/user/checkout");
    }
});

const getCartData = async (userId, variantId) => {
    const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
    if (variantId) {
        matchStage.variantId = variantId; 
    }

    const cartItems = await cartModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $lookup: { from: "productmodels", localField: "productId", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "product.category" } },
        { $unwind: "$product.category" },
        { $unwind: "$product.variants" },
        { $match: { $expr: { $eq: ["$product.variants._id", { $toObjectId: "$variantId" }] } } },
        { $match: { "product.isListed": true } },
        {
            $project: {
                quantity: 1,
                productId: "$product._id",
                productName: "$product.productName",
                brand: "$product.brand",
                categoryName: "$product.category.categoryName",
                variant: "$product.variants"
            }
        }
    ]);
    return cartItems;
}

export const verifyPayment = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.id || req.user.id;
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            addressId, 
            productId, 
            variantId,
            orderId
        } = req.body;

        const isVerified = paymentService.verifyRazorpaySignature(
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature
        );

        if (!isVerified) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        let order;
        if (orderId) {
            order = await orderModel.findById(orderId);
        } else {
            order = await orderModel.findOne({ razorpayOrderId: razorpay_order_id });
        }

        if (!order) {

            if (productId && variantId) {
                const buyNowItem = req.session.buyNowItem || { productId, variantId, quantity: 1 };
                order = await shopService.placeBuyNowOrder(userId, addressId, "razorpay", buyNowItem);
                delete req.session.buyNowItem;
            } else {
                const cartItems = await getCartData(userId);
                order = await shopService.placeOrder(userId, addressId, "razorpay", cartItems);
            }
        }

        order.paymentStatus = "paid";
        order.orderStatus = "pending";
        order.paymentId = razorpay_payment_id;
        await order.save();

        res.status(200).json({ 
            success: true, 
            redirectUrl: `/order/success/${order.orderNumber}` 
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


export const successPage = asyncHandler(async (req, res) => {
    try {
        const userId = req.session?.user?.id || req.user?.id;
        const orderNumber = req.params.orderNumber;
        if (!userId) throw new Error("Login required");
        if (!orderNumber) throw new Error("order Number not found");
        const successPageData = await shopService.successPage(userId, orderNumber);
        res.render("user/userAfterLogin/orderSuccess", { order: successPageData });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/shop");
    }
})

export const paymentFailed = asyncHandler(async (req, res) => {
    const { orderId } = req.query;
    let order = null;
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        order = await orderModel.findById(orderId);
    }
    res.render("user/userAfterLogin/paymentFail", { 
        user: req.session?.user || req?.user,
        order
    });
});

export const buyNow = asyncHandler(async (req, res) => {
    try {
        const { productId, variantId, quantity } = req.body;
        console.log(1)
        const buy = await shopService.buynow(productId, variantId, quantity)
        req.session.buyNowItem = { productId, variantId, quantity };
        res.status(200).json({
            success: true,
            redirectUrl: "/user/checkout?type=buyNow"
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
})

export const retryPayment = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await orderModel.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: "Order is already paid" });
        }

        const data = await paymentService.createRazorpayOrder(order.pricing.total);
        
        order.razorpayOrderId = data.orderId;
        await order.save();

        res.status(200).json({ 
            success: true, 
            ...data, 
            dbOrderId: order._id,
            orderNumber: order.orderNumber
        });
    } catch (error) {
        console.error("Retry Payment Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

