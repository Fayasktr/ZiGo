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
    const allAddresses =await addressModel.find({userId:user._id});
    return allAddresses;
}

export const addAddress = async (addressData)=>{
    if(!addressData.userId){
        throw new Error("Address not have user");
    }
    if(!addressData.pincode){
        throw new Error ("pincode must required");
    }

    const newAddress = await addressModel.create({
        userId:addressData.userId,
        userName:addressData.userName,
        addressType:addressData.addressType,
        detailedAddress:addressData.detailedAddress,
        country:addressData.country,
        city:addressData.city,
        pincode:addressData.pincode,
        phoneNumber:addressData.phoneNumber,
        email:addressData.email,
    })
    return newAddress;
}