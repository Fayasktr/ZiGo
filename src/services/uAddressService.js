import passport from "passport";
import addressModel from "../models/addressModel.js";
import User from '../models/userModel.js';
import checkPass from "../utils/checkPassword.js"
import { hashPassword } from "../utils/hashPassword.js";
import {GenerateOTP} from "../utils/otp.js"
import {otpSendToMail} from "../utils/nodemailer.js"
import OTPModel from "../models/otpModel.js";

export const showProfileData = async (email) => {
    const userId = await User.findOne({ email });
    const defaultAddres = await addressModel.findOne({ userId: userId._id, isDefault: true });
    return defaultAddres;
}

export const editProfilePage =async(email)=>{
    const user =await User.findOne({email:email});
    const address=await addressModel.findOne({userId:user._id,isDefault:true});
    return {userName:user.userName,email:user.email,phoneNumber:address?address.phoneNumber:"",password:user.password};
}

export const optSend= async (email)=>{
    const OTP =await GenerateOTP();
    const subject= "Change Password.!";
    await otpSendToMail(OTP,email,subject);
}

export const otpCheck =async(entredOtp,userId)=>{
    let otpFromDB = await OTPModel.findOne({ userId })
     console.log("generated otp  " + otpFromDB)

  if (!otpFromDB || otpFromDB.otp != entredOtp) {
    throw new Error("Invalid OTP or expired..")
  }

  await OTPModel.deleteOne({ userId });
}

export const editProfile = async (editData,userId)=>{
    if(editData.password){
        const currentPass=await User.findOne({_id:userId})
        const chekc =await checkPass(password,currentPass.password);
        if(!check){
            throw new Error("current password is not matching");
        }
        const hashedPass= await hashPassword(editData.password)
        await User.updateOne({_id:userId},{$set:{userName:editData.userName,email:editData.email,password:hashedPass}});
    }else if(editData.email){
                await User.updateOne({_id:userId},{$set:{userName:editData.userName,email:editData.email}});
    }else{
        await User.updateOne({_id:userId},{$set:{userName:editData.userName}});
    }
    await addressModel.findOneAndUpdate({userId:userId,isDefault:true},{$set:{phoneNumber:editData.phoneNumber}})
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
    const isDefault = !defaultAddres

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
        isDefault: isDefault
    })
}

export const editAddressPage = async (addressId) => await addressModel.findOne({ _id: addressId });


export const editAddress = async (addressId, addressData) => {
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
            }
        }
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
    if (result.deletedCount === 0) {
        throw new Error("address already deleted..");
    }
    return 0;
}