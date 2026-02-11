import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { GenerateOTP } from "../utils/otp.js";
import { otpSendToMail } from "../utils/nodemailer.js";
import OTPModel from "../models/otpModel.js";
import {hashPassword} from "../utils/hashPassword.js"

export const userLogin = async (email, password) => {
  email = email.trim();
  password = password.trim();

  if (!email || !password) {
    throw new Error("Please fill all fields");
  }
  const existUser = await User.findOne({ email });

  if (!existUser) {
    throw new Error("User not found");
  }

  if (existUser.isBlocked == true) {
    throw new Error("User Blocked By Admin");
  }
  const isMatch = await bcrypt.compare(password, existUser.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return existUser;
};

export const userSignUp = async (userName, email, password) => {
  const existUser = await User.findOne({ email ,isVerified:true});
  if (existUser) {
    throw new Error("Email already taken...");
  }

  const OTP = await GenerateOTP();
  console.log(OTP);

  const hashedPassword= await hashPassword(password);
  console.log("hashpass"+hashedPassword)

  let newUser = await User.create({
    userName: userName,
    email: email,
    password: hashedPassword,
  });

  await OTPModel.create({
    userId: newUser._id,
    otp: OTP,
  });

  const subjectForMail = "SignUp OTP verification Code";
  let otpSend = await otpSendToMail(OTP, email, subjectForMail);

  return {success:otpSend, userId:newUser._id};
};

export const verifyOtp = async(entredOtp,userId)=>{

  let otpFromDB = await OTPModel.findOne({userId})
  console.log("generated otp  "+otpFromDB)
  
  if(!otpFromDB || otpFromDB.otp != entredOtp){
    return {success:false,message:"Invalid OTP or expired.."};
  }

  // await OTPModel.deleteOne({userId});

  return {success:true};
}