import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import * as userServises from "../services/uLoginService.js";
import { error } from "console";

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
});

export const LoadHomePage = asyncHandler(async (req, res) => {
  res.render("user/userAfterLogin/ZiGo.com.ejs");
});

export const loadSignUp = asyncHandler(async (req, res) => {
  res.render("user/signup");
});

export const signup = asyncHandler(async (req, res) => {
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
  let userResult = await userServises.userSignUp(userName, email, password);
  console.log(userResult);
  res.send("done");
});
