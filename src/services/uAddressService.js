import addressModel from "../models/addressModel.js";

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