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
        { _id: addressId },
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
    userId=new mongoose.Types.ObjectId(userId);
    productId=new mongoose.Types.ObjectId(productId);
    variantId=new mongoose.Types.ObjectId(variantId);
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
        return { ...item, isAvailable };
    });

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