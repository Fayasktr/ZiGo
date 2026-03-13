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
    console.log("is default: " + isDefault)
    if (isDefault) {
        throw new Error("default address can't delete");
    }
    const result = await addressModel.deleteOne({ _id: addressId, userId: userId });
    console.log("Deleted address:", addressId);
    console.log("Deleted address:", result);
    if (result.deletedCount === 0) {
        throw new Error("address already deleted..");
    }
    return 0;
}

export const wishlistPage = async (userId) => {
    if (!userId) return [];
    const queryId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    return await wishlistModel.find({ userId: queryId }).populate({
        path: 'productId',
        populate: { path: 'category' }
    });
}

export const deleteWishlistItem=async(userId,productId,variantId)=>{
    const item=await wishlistModel.findOneAndDelete({userId,productId,variantId});
    return true;
}

export const addToCart=async(userId,productId,variantId)=>{
    const existCart=await cartModel.findOne({userId,productId,variantId});
    
    if(existCart){
        if(existCart.quantity<10){
            await cartModel.findOneAndUpdate({userId,productId,variantId},{$inc:{quantity:1}})
        }else{
            throw new Error("Maximum cart limit reached (10 per item)");
        }
    }else {
        await cartModel.create({
            userId:userId,
            productId:productId,
            variantId:variantId,
            quantity:1
        })
    }
    const deleteItem=await wishlistModel.findOneAndDelete({userId,productId,variantId});
    return true;
}

export const getCartPage = async (userId) => {
    const cartItems = await cartModel.find({ userId }).populate({
        path: 'productId',
        populate: { path: 'category' }
    });

    const totalPrice = cartItems.reduce((acc, item) => {
        if (!item.productId || !item.productId.variants) return acc;
        let cPrice = 0;
        let targetVid = item.variantId ? item.variantId.toString() : null;

        let selectedVariant = item.productId.variants.find(v => v._id && targetVid && v._id.toString() === targetVid);
        if (!selectedVariant) selectedVariant = item.productId.variants[0];
        if (selectedVariant) cPrice = selectedVariant.price;

        return acc + (cPrice * item.quantity);
    }, 0);
    return { items: cartItems, totalPrice };
}