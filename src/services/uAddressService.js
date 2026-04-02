import addressModel from "../models/addressModel.js";
import mongoose from "mongoose";
import User from '../models/userModel.js';
import checkPass from "../utils/checkPassword.js"
import { hashPassword } from "../utils/hashPassword.js";
import { GenerateOTP } from "../utils/otp.js"
import { otpSendToMail } from "../utils/nodemailer.js"
import OTPModel from "../models/otpModel.js";
import wishlistModel from "../models/wishlistModel.js";
import cartModel from "../models/cartModel.js";
import productModel from "../models/productModel.js"
import orderModel from "../models/orderModel.js";
import walletModel from "../models/walletModel.js";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";

export const showProfileData = async (email) => {
    const userId = await User.findOne({ email });
    const defaultAddres = await addressModel.findOne({ userId: userId._id, isDefault: true });
    return defaultAddres;
}

export const editProfilePage = async (email) => {
    const user = await User.findOne({ email });
    const address = await addressModel.findOne({ userId: user._id, isDefault: true });
    return { userName: user.userName, email: user.email, phoneNumber: address ? address.phoneNumber : "", password: user.password, googleId: user.googleId };
}

export const updatedProfileBasic = async (userId, userName, phoneNumber) => {
    await User.findByIdAndUpdate(userId, { $set: { userName } });

    if (phoneNumber) {
        await addressModel.findOneAndUpdate(
            { userId: userId, isDefault: true },
            { $set: { phoneNumber } },
            { upsert: true }
        );
    }
}

export const updatePassword = async (userId, currentPassword, newpassword) => {
    const user = await User.findById(userId);
    const isMatchPassword = await checkPass(currentPassword, user.password);
    if (!isMatchPassword) {
        throw new Error("Current password is not match..!");
    }
    const hashedPassword = await hashPassword(newpassword);
    user.password = hashedPassword;
    await user.save();
}

export const updateProfileImage = async (userId, imageUrl) => {
    return await User.findByIdAndUpdate(userId, { profileImage: imageUrl }, { new: true })
}

export const otpSendForEmailChange = async (userId, newEmail) => {
    const OTP = await GenerateOTP();
    console.log("otp :", OTP)
    const subject = "Verification OTP - ZiGo Email Change";
    await otpSendToMail(OTP, newEmail, subject);

    await OTPModel.findOneAndUpdate(
        { userId },
        { otp: OTP, createdAt: new Date() },
        { upsert: true }
    );
}

export const verifyAndChangeEmail = async (userId, enteredOtp, newEmail) => {
    const otpFromDB = await OTPModel.findOne({ userId });

    if (!otpFromDB || otpFromDB.otp !== enteredOtp) {
        throw new Error("Invalid or expired OTP");
    }

    await User.findByIdAndUpdate(userId, { $set: { email: newEmail } });
    await OTPModel.deleteOne({ userId });
}

export const allAddresses = async (user) => {
    const userId = await User.findOne({ email: user.email });
    const allAddresses = await addressModel.find({ userId }).sort({ isDefault: -1 });
    return allAddresses;
}

export const addAddress = async (userEmail, addressData) => {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
        throw new Error("there is now user found ");
    }
    const defaultAddres = await addressModel.findOne({ userId: user._id, isDefault: true });

    let shouldBeDefault = addressData.isDefault || !defaultAddres;
    if (shouldBeDefault && defaultAddres) {
        await addressModel.updateMany({ userId: user._id }, { $set: { isDefault: false } });
    }


    return await addressModel.create({
        userId: user._id,
        userName: addressData.userName,
        addressType: addressData.type,
        detailedAddress: addressData.detailedAddress,
        country: addressData.country,
        city: addressData.city,
        pincode: addressData.pincode,
        phoneNumber: addressData.phoneNumber,
        email: addressData.email,
        isDefault: shouldBeDefault
    })
}

export const editAddressPage = async (addressId) => await addressModel.findOne({ _id: addressId });


export const editAddress = async (userId, addressId, addressData) => {
    if (addressData.isDefault) {
        await addressModel.updateMany(
            { userId: userId },
            { $set: { isDefault: false } }
        );
    }

    return await addressModel.findByIdAndUpdate(
        addressId,
        {
            $set: {
                userName: addressData.userName,
                addressType: addressData.type,
                detailedAddress: addressData.detailedAddress,
                country: addressData.country,
                city: addressData.city,
                pincode: addressData.pincode,
                phoneNumber: addressData.phoneNumber,
                isDefault: addressData.isDefault === true || addressData.isDefault === 'on'
            }
        },
        { new: true }
    )
}

export const setDefaultService = async (userId, addressId) => {
    await addressModel.updateMany(
        { userId: userId },
        { $set: { isDefault: false } }
    );
    return await addressModel.findByIdAndUpdate(
        addressId,
        { $set: { isDefault: true } }
    );
}

export const deleteAddress = async (userId, addressId) => {
    const isDefault = await addressModel.findOne({ userId: userId, _id: addressId, isDefault: true });
    if (isDefault) {
        throw new Error("default address can't delete");
    }
    const result = await addressModel.deleteOne({ _id: addressId, userId: userId });

    if (result.deletedCount === 0) {
        throw new Error("address already deleted..");
    }
    return 0;
}

export const wishlistPage = async (userId) => {
    if (!userId) return [];
    userId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const wishlistItems = await wishlistModel.aggregate([
        { $match: { userId: userId } },
        {
            $lookup: {
                from: "productmodels",
                localField: "productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                matchedVariant: {
                    $first: {
                        $filter: {
                            input: { $ifNull: ["$product.variants", []] },
                            as: "v",
                            cond: { $eq: [{ $toString: "$$v._id" }, { $toString: "$variantId" }] }
                        }
                    }
                }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const itemsWithStatus = wishlistItems.map(item => {
        const v = item.matchedVariant;
        const isAvailable = !!(
            item.product &&
            item.product.isListed &&
            item.category &&
            item.category.isListed &&
            v &&
            v.isListed &&
            v.stock > 0
        );
        return { ...item, isAvailable };
    });

    return itemsWithStatus;
};


export const deleteWishlistItem = async (userId, productId, variantId) => {
    const item = await wishlistModel.findOneAndDelete({ userId, productId, variantId });
    return true;
}

export const addToCart = async (userId, productId, variantId) => {
    // userId=new mongoose.Types.ObjectId(userId);
    // productId=new mongoose.Types.ObjectId(productId);
    // variantId=new mongoose.Types.ObjectId(variantId);
    const existCart = await cartModel.findOne({ userId, productId, variantId });
    const theProduct=await productModel.findById(productId);
    const variant=theProduct.variants.find((v)=>v._id==variantId);
    console.log(`the variant to add to cart :${variant}`)
    if(existCart&&existCart.quantity>=variant.stock){
        throw new Error(`Stock limit exceed for the ${theProduct.productName}'s this variant,(only ${variant.stock} stock available)`);
    }
    if (existCart) {
        if (existCart.quantity < 10) {
            await cartModel.findOneAndUpdate({ userId, productId, variantId }, { $inc: { quantity: 1 } },{upsert:true,new:true,setDefaultsOnInsert:true})
        } else {
            throw new Error("Maximum cart limit reached (10 per item)");
        }
    } else {
        if (variant.stock <= 0) {
            throw new Error(`${theProduct.productName} is currently out of stock`);
        }
        await cartModel.create({
            userId: userId,
            productId: productId,
            variantId: variantId,
            quantity: 1
        })
    }
    const deleteItem = await wishlistModel.findOneAndDelete({ userId, productId, variantId });
    return true;
}


export const getCartPage = async (userId) => {
    userId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const cartItems = await cartModel.aggregate([
        { $match: { userId: userId } },
        {
            $lookup: {
                from: "productmodels",
                localField: "productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                matchedVariant: {
                    $first: {
                        $filter: {
                            input: { $ifNull: ["$product.variants", []] },
                            as: "v",
                            cond: {
                                $eq: [{ $toString: "$$v._id" }, { $toString: "$variantId" }]
                            }
                        }
                    }
                }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const quantityUpdateOps = [];

    const itemsWithStatus = cartItems.map(item => {
        const v = item.matchedVariant;
        const isAvailable = !!(
            item.product &&
            item.product.isListed &&
            item.category &&
            item.category.isListed &&
            v &&
            v.isListed &&
            v.stock > 0
        );

        let quantity = item.quantity;
        let quantityReduced = false;

        if (isAvailable && v.stock < item.quantity) {
            quantity = v.stock;
            quantityReduced = true;

            quantityUpdateOps.push({
                updateOne: {
                    filter: { _id: item._id },
                    update: { $set: { quantity: v.stock } }
                }
            });
        }

        return { ...item, quantity, isAvailable, quantityReduced };
    });

    if (quantityUpdateOps.length > 0) {
        await cartModel.bulkWrite(quantityUpdateOps);
    }

    const totalPrice = itemsWithStatus.reduce((acc, item) => {
        if (!item.isAvailable) return acc;
        return acc + ((item.matchedVariant?.price || 0) * item.quantity);
    }, 0);

    return { items: itemsWithStatus, totalPrice };
};

export const deleteCart = async (userId, productId, variantId) => {
    return cartModel.findOneAndDelete({ userId, productId, variantId });
}

export const changeCartQuantity = async (userId, change, productId, variantId,currentQty) => {
    const product = await productModel.findById(productId);
    const variant = product.variants.find(v => v._id.toString() === variantId)
    if(!variant){
        throw new Error("this variant not found")
    }
    const existCart = await cartModel.findOne({ userId, productId, variantId });
    if (change == 1) {
        if (variant.stock <= 0) {
            throw new Error("item Stock out");
        }
        if(variant.stock<=currentQty){
            throw new Error(`Stock limit exceed (only ${variant.stock} stock available)`)
        }
        if (existCart && existCart.quantity >= 10) {
            throw new Error("cart maximum limit reached");
        } else {
            return await cartModel.findOneAndUpdate({ userId, productId, variantId }, { $inc: { quantity: 1 } }, { new: true });
        }
    } else {
        if (existCart && existCart.quantity <= 1) {
            throw new Error("minimum cart Qautity is 1");
        } else {
            return await cartModel.findOneAndUpdate({ userId, productId, variantId }, { $inc: { quantity: -1 } }, { new: true });
        }
    }
}


export const orderHistory = async (userId,query) => {
    if (!userId) {
        throw new Error("need to login");
    }
    let { page = 1, search =""}=query;
    let limit = 5;
    let skip = (page-1)*limit;

    let filter = {userId:userId};
    if (search) {
        filter.$or = [
            { orderNumber: { $regex: search, $options: "i" } },
            { "items.productName": { $regex: search, $options: "i" } }
        ];
    }
    const [orders, totalCount] = await Promise.all([
        orderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        orderModel.countDocuments(filter)
    ]);

    return {
        orders,
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        search
    };
}

export const orderDetailse=async(userId,orderId)=>{
    if(!orderId)throw new Error("order id needed");
    const orderData=await orderModel.findOne({_id:orderId,userId:userId});
    if(!orderData)throw new Error("cannot find this order");
    return orderData;
}

export const orderCancel=async(userId,orderId,reason="",comments="")=>{
    const order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) throw new Error("Order not found");

    if (!["pending", "processing"].includes(order.orderStatus)) {
        throw new Error("This order cannot be cancelled");
    }

    for(let item of order.items){
        if(item.itemStatus=='active'){
            await productModel.updateOne(
                {_id:item.productId,"variants._id":item.variantId},
                {$inc:{"variants.$.stock":item.quantity}}
            );
            item.itemStatus="cancelled";
            item.cancelReason = reason; 
            item.comments = comments;   
            console.log(`item comment saved: ${item.comments}`);
        }
    }
    order.orderStatus ="cancelled";
    order.cancelReason = reason;
    await order.save();
    return order;

}

export const itemCancel = async (userId, orderId, itemId, reason, comments, quantity) => {
    const qty = parseInt(quantity) || 1;

    const order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) throw new Error("Order not found");

    if (!["pending", "processing"].includes(order.orderStatus)) {
        throw new Error("This order cannot be cancelled at this stage");
    }

    const item = order.items.id(itemId);
    if (!item) throw new Error("Item not found in order");

    if (item.itemStatus === "cancelled" || item.itemStatus === "returned") {
        throw new Error("This item is already cancelled or returned");
    }

    const alreadyCancelled = item.cancelledQuantity || 0;
    const alreadyReturned  = item.returnedQuantity  || 0;
    const cancellable = item.quantity - alreadyCancelled - alreadyReturned;

    if (cancellable <= 0) {
        throw new Error("All units of this item have already been cancelled or returned");
    }
    if (qty > cancellable) {
        throw new Error(`You can only cancel ${cancellable} unit(s). ${alreadyCancelled} already cancelled`);
    }

    await productModel.updateOne(
        { _id: item.productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": qty } }
    );

    item.cancelledQuantity = alreadyCancelled + qty;
    item.cancelReason = reason;
    item.comments = comments;

    const totalAccountedFor = item.cancelledQuantity + alreadyReturned;
    if (totalAccountedFor >= item.quantity) {
        item.itemStatus = "cancelled"; 
    }

    order.pricing.subTotal = order.items.reduce((sum, i) => {
        const activQty = i.quantity - (i.cancelledQuantity || 0) - (i.returnedQuantity || 0);
        return sum + (i.price * Math.max(activQty, 0));
    }, 0);

    order.pricing.tax = parseFloat((order.pricing.subTotal * 0.18).toFixed(2));
    order.pricing.total = parseFloat(
        (order.pricing.subTotal + order.pricing.tax + (order.pricing.shipping || 0)).toFixed(2)
    );

    const allCancelled = order.items.every(i => {
        const accounted = (i.cancelledQuantity || 0) + (i.returnedQuantity || 0);
        return accounted >= i.quantity;
    });
    if (allCancelled) order.orderStatus = "cancelled";

    await order.save();
    return order;
};

export const itemReturn = async (userId, orderId, itemId, reason, quantity, comments) => {
    if (!userId) throw new Error("Login required");
    if (!reason || !reason.trim()) throw new Error("Return reason is required");

    const qty = parseInt(quantity) || 1; 

    const order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) throw new Error("Order not found");

    if (order.userId.toString() !== userId.toString()) {
        throw new Error("Unauthorized");
    }
    if (order.orderStatus !== "delivered") {
        throw new Error("Can only return delivered orders");
    }

    const item = order.items.id(itemId);
    if (!item) throw new Error("Item not found");

    if (item.itemStatus !== "delivered") {
        throw new Error("Only delivered items can be returned");
    }

    if (item.returnStatus === "requested") {
        throw new Error("A return is already pending for this item. Wait for admin to process it first");
    }

    const alreadyReturned = item.returnedQuantity || 0;
    const cancellable = item.cancelledQuantity || 0;
    const returnable = item.quantity - alreadyReturned - cancellable;

    if (returnable <= 0) {
        throw new Error("All units of this item have already been returned or cancelled");
    }
    if (qty > returnable) {
        throw new Error(`You can only return ${returnable} unit(s). You already returned ${alreadyReturned}`);
    }

    item.returnStatus = "requested";
    item.returnReason = reason;
    item.returnRequestedAt = new Date();
    item.pendingReturnQuantity = qty;  
    item.returnComments = comments;

    order.returnRequested = true;

    await order.save();
    return order;
};

export const getWalletData = async (userId) => {
    let wallet = await walletModel.findOne({ userId });
    if (!wallet) {
        wallet = await walletModel.create({
            userId,
            balance: 0,
            transactions: []
        });
    }
    wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    return wallet;
}


export const setupInvoice=async(orderId,userId)=>{
    const order=await orderModel.findById(orderId);
    if(!order)throw new Error("no order found");

    if(order.userId.toString()!==userId.toString())throw new Error("Unauthorized user");

    // Convert logos to Base64 for PDF rendering
    const logoIconPath = path.join(process.cwd(), 'public/public/logo-icon.png');
    const logoNamePath = path.join(process.cwd(), 'public/public/logo-name.png');
    
    let logoIconBase64 = "";
    let logoNameBase64 = "";
    
    try {
        if (fs.existsSync(logoIconPath)) {
            logoIconBase64 = `data:image/png;base64,${fs.readFileSync(logoIconPath).toString('base64')}`;
        }
        if (fs.existsSync(logoNamePath)) {
            logoNameBase64 = `data:image/png;base64,${fs.readFileSync(logoNamePath).toString('base64')}`;
        }
    } catch (err) {
        console.error("Error reading logo files for invoice:", err);
    }

    const html = await ejs.renderFile(
        path.join(process.cwd(), 'views/user/userAfterLogin/invoice.ejs'),
        { order, logoIcon: logoIconBase64, logoName: logoNameBase64 }
    );

    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox']
    });
    let pdf;
    try{
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
            displayHeaderFooter: true,
            // headerTemplate: '<div style="font-size:8px">ZiGo Invoice</div>',
            // footerTemplate: '<div style="font-size:8px">Page <span class="pageNumber"></span></div>'
        });
    }finally{
        await browser.close();
    }
    return {order,pdf};
    
}