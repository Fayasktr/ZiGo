import asyncHandler from "express-async-handler";
import * as userServises from "../services/uLoginService.js";

export const landingBeforeLogin = asyncHandler(async (req, res) => {
  res.render("user/landing");
});

export const forgotPasswordPage = asyncHandler(async (req, res) => {
  res.render("user/forgotPassword");
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
      profileImage:existUser.profileImage
    };
    res.redirect("/ZiGo.com");
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/login");
  }
});

export const logOut = asyncHandler(async (req, res, next) => {

  req.logout((err) => {
    if (err) {
      return next(err)
    }
    req.session.user = null;
    res.redirect("/");
  });
});

export const LoadHomePage = asyncHandler(async (req, res) => {
  res.render("user/userAfterLogin/ZiGo.com.ejs");
});

export const loadSignUp = asyncHandler(async (req, res) => {
  res.render("user/signUp");
});

export const signUp = asyncHandler(async (req, res) => {
  try {
    let { userName, email, password, confirmPassword } = req.body;

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
    let newUser = await userServises.userSignUp(userName, email, password);

    req.session.otpUserId = newUser._id;
    req.session.otpMode = "signUp"
    req.session.otpTime = Date.now() + 60 * 1000;
    res.redirect("/verifyOtp");
  }
  catch (error) {
    req.flash("error", "OTP not send to mail, please verify the mail..");
    res.redirect("/signUp");
  }
});

export const loadOtpPage = asyncHandler(async (req, res) => {
  const userId = req.session.otpUserId;
  if (!userId) {
    req.flash("error", "Session expired, please sign up again.");
    return res.redirect("/signUp");
  }
  let otpTime = req.session.otpTime;

  res.render("user/otp", { userId, otpTime });
});

export const otpVerify = asyncHandler(async (req, res) => {
  try {
    const entredOtp = req.body.otp;
    const userId = req.body.userId;
    console.log("entered otp" + entredOtp);

    const newUser = await userServises.verifyOtp(entredOtp, userId);
    if (req.session.otpMode == "forgetPass") {
      let tempMail = req.session.tempMail
      res.render("user/resetPassword", { email: tempMail });
    } else {
      delete req.session.otpUserId;
      delete req.session.otpMode;

      req.session.user = {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
      };
      res.redirect("/ZiGo.com");
    }
  }
  catch (error) {
    req.flash("error", error.message);
    res.redirect("/verifyOtp");
  }
});

export const resendOtp = asyncHandler(async (req, res) => {
  try {
    let userId = req.session.otpUserId
    const result = await userServises.resendOtp(userId)
    req.session.otpTime = Date.now() + 60 * 1000;
    res.redirect("/verifyOtp");
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/verifyOtp");
  }
})


export const sendOTPForForgotPass = asyncHandler(async (req, res) => {
  try {
    const email = req.body.email;
    let userId = await userServises.forgettPass(email);

    req.session.otpUserId = userId;
    req.session.tempMail = email;
    req.session.otpMode = "forgetPass";
    req.session.otpTime = Date.now() + 60 * 1000;
    res.redirect("/verifyOtp")
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/login")
  }
})



export const loadResetPassword = asyncHandler(async (req, res) => {
  const email = req.session.tempMail;
  if (!email) {
    return res.redirect("/forgotPassword");
  }
  res.render("user/resetPassword", { email });
});

export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { newPass, conformPass, email } = req.body
    if (newPass != conformPass) {
      req.flash("error", "new Password and conform password not match");
      res.redirect("/resetPassword");
      return 0;
    }
    const updatePass = await userServises.updatePassword(newPass, email);
    delete req.session.otpUserId;
    delete req.session.tempMail;
    delete req.session.otpMode;
    res.redirect("/login");
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/resetPassword");
  }

})

