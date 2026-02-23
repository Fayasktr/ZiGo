import User from "../models/userModel.js";
import { GenerateOTP } from "../utils/otp.js";
import checkPass from '../utils/checkPassword.js';
import { otpSendToMail } from "../utils/nodemailer.js";
import OTPModel from "../models/otpModel.js";
import { hashPassword } from "../utils/hashPassword.js"
import { hash } from "bcryptjs";

export const userLogin = async (email, password) => {
  email = email.trim().toLowerCase();
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
  const isMatch = await checkPass(password, existUser.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return existUser;
};

export const userSignUp = async (userName, email, password) => {
  const existUser = await User.findOne({ email, isVerified: true });
  if (existUser) {
    throw new Error("Email already taken...");
  }

  const OTP = await GenerateOTP();
  console.log(OTP);

  const hashedPassword = await hashPassword(password);
  console.log("hashpass" + hashedPassword)

  let newUser = await User.create({
    userName: userName,
    email: email,
    password: hashedPassword,
  });

  await OTPModel.findOneAndUpdate(
    { userId: newUser._id },
    { otp: OTP },
    { upsert: true }
  );

  const subjectForMail = "SignUp OTP verification Code";

  await otpSendToMail(OTP, email, subjectForMail);
  return newUser;
};

export const verifyOtp = async (entredOtp, userId) => {

  let otpFromDB = await OTPModel.findOne({ userId })
  console.log("generated otp  " + otpFromDB)

  if (!otpFromDB || otpFromDB.otp != entredOtp) {
    throw new Error("Invalid OTP or expired..")
  }

  await OTPModel.deleteOne({ userId });
  await User.findByIdAndUpdate(userId, { isVerified: true });
  return await User.findById(userId)
}

export const resendOtp = async (userId) => {
  const OTP = await GenerateOTP();
  const user = await User.findById(userId);
  const subjectForMail = "SignUp OTP verification Code";
  console.log(`latest otp is ${OTP}`)

  await OTPModel.findOneAndUpdate(
    { userId },
    { otp: OTP, createdAt: new Date(), isUsed: false },
    { upsert: true }
  )
  const mailSend = await otpSendToMail(OTP, user.email, subjectForMail);
}

export const forgettPass = async (email) => {
  let user = await User.findOne({ email });
  if (!user) {
    throw new Error("this user doesn't exist")
  }
  const OTP = await GenerateOTP()
  let userId = user._id;
  await OTPModel.findOneAndUpdate(
    { userId },
    { otp: OTP, createdAt: new Date(), isUsed: false },
    { upsert: true }
  )
  console.log(`forgetpass otp :${OTP}`);
  const subjectForMail = "Forget Password verification Code";
  await otpSendToMail(OTP, email, subjectForMail);
  return userId;
}

export const updatePassword = async (newPass, email) => {
  const hashedPassword = await hashPassword(newPass);
  const savePass = await User.findOneAndUpdate({ email }, { password: hashedPassword });

  console.log("password saved" + hashedPassword);

}