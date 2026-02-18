import addressModel from "../models/addressModel.js";
import User from '../models/userModel.js';

export const showProfileData =async (email)=>{
    const userId =await User.findOne({email});
    console.log("userId..:"+userId._id)
    const defaultAddres= await addressModel.findOne({userId:userId._id,isDefault:true});
    console.log("address Data :"+defaultAddres);
    return defaultAddres;
}

export const allAddresses= async(user)=>{
    const userId= await User.findOne({email:user.email});
    const allAddresses =await addressModel.find({userId});
    return allAddresses;
}

export const addAddress = async (userEmail,addressData)=>{
    const user= await User.findOne({email:userEmail});
    if(!user){
        throw new Error("there is now user found ");
    }
    const defaultAddres =await addressModel.findOne({userId:user._id,isDefault:true});
    const isDefault= !defaultAddres
    
    return await addressModel.create({
        userId:user._id,
        userName:addressData.userName,
        addressType:addressData.type,
        detailedAddress:addressData.detailedAddress,
        country:addressData.country,
        city:addressData.city,
        pincode:addressData.pincode,
        phoneNumber:addressData.phoneNumber,
        email:addressData.email,
        isDefault:isDefault
    })
}

export const setDefaultService =async(userId,addressId)=>{
    await addressModel.updateMany({userId},{isDefault:false});
    return await addressModel.findByIdAndUpdate({addressId},{isDefault:true});
}

