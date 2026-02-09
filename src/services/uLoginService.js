import User from "../models/userModel.js";
import bcrypt from "bcryptjs"
import GenerateOTP from "../utils/otp.js"
import nodemailer from 'nodemailer';

export const userLogin = async (email, password) => {
    email = email.trim();
    password = password.trim()

    if (!email || !password) {
        throw new Error("Please fill all fields");
    }
    const existUser = await User.findOne({ email });

    if (!existUser) {
        throw new Error("User not found");
    }

    if(existUser.isBlocked== true){
        throw new Error("User Blocked By Admin")
    }
    const isMatch = await bcrypt.compare(password, existUser.password);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    return existUser;

}

const otpSendToMail =async (OTP, email)=>{
    
}

export const userSignUp = async(userName,email,password)=> {
    userName =userName.trim();
    email =email.trim().toLowerCase();
    password =password.trim();

    const existUser = await User.findOne({ email });
    if(existUser){
        throw new Error ("Email already taken...");
    }
    const OTP =await GenerateOTP()
    console.log(OTP);

    let otpSendToMail = await otpSendToMail(OTP,email);

    
}

