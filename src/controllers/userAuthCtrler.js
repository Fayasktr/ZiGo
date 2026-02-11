import asyncHandler from "express-async-handler";
import * as userServises from "../services/uLoginService.js";

export const landingBeforeLogin = asyncHandler(async (req, res) => {
  res.render("user/landing");
});

export const loginPage = asyncHandler(async (req, res) => {
  res.render("user/login");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const existUser = await userServises.userLogin(email, password);
    req.session.user = {
      id: existUser._id,
      userName: existUser.userName,
      email: existUser.email,
    };
    res.redirect("ZiGo.com");
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/login");
  }
});

export const logOut = asyncHandler(async (req, res) => {
  req.session.destroy();
  res.redirect("user/landing");
});

export const LoadHomePage = asyncHandler(async (req, res) => {
  res.render("user/userAfterLogin/ZiGo.com.ejs");
});

export const loadSignUp = asyncHandler(async (req, res) => {
  res.render("user/signUp");
});

export const loadOtpPage = asyncHandler(async (req, res) => {
  const userId = req.session.tempUserId;
  if (!userId) {
    req.flash("error", "Session expired, please sign up again.");
    return res.redirect("/signUp");
  }
  res.render("user/otp", { userId });
});

export const signUp = asyncHandler(async (req, res) => {
  let { userName, email, password, confirmPassword } = req.body;
  console.log(userName, email, password);
  if (password != confirmPassword) {
    req.flash("error", "conform password is not equal");
    return res.redirect("signUp");
  }
  userName = userName.trim();
  email = email.trim().toLowerCase();
  password = password.trim();

  if (!userName || !email || !password) {
    req.flash("error", "invalid credentials");
    return res.redirect("signUp");
  }
  let signUpResult = await userServises.userSignUp(userName, email, password);
  console.log("resut print " + signUpResult.newUser);
  if (signUpResult.success) {
    req.session.tempUserId = signUpResult.userId;
    res.redirect("/verifyOtp");
  } else {
    req.flash("error", "OTP not send to mail, please verify the mail..");
    res.redirect("signUp");
  }
});

export const otpVerify = asyncHandler(async (req, res) => {
  delete req.session.tempUserId;
  
  const entredOtp = req.body.otp;
  const userId = req.body.userId;
  console.log(entredOtp);
  console.log(req.body.userId);

  let result = await userServises.verifyOtp(entredOtp, userId);
  console.log(result);

  if (result.success) {
    res.redirect("/login");
  } else {
    req.flash("error", "Invalid OTP");
    res.redirect("/verifyOtp");
  }
});
