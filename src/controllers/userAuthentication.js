import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import * as userServises from "../services/uLoginService.js"

export const landingBeforeLogin = asyncHandler(async (req, res) => {
    res.render("user/landing")
})

export const loginPage = asyncHandler(async (req, res) => {
    const error = req.session.error || "";
    req.session.error = "";
    res.render("user/login", { error });
})

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        const existUser = await userServises.userLogin(email, password);
        req.session.error =existUser.message;
        req.session.user = {
            id: existUser._id,
            userName: existUser.userName,
            email: existUser.email
        }
        res.render('/user/userAfterLogin/home');
    } catch (e) {
        req.session.error = e.message;
        console.log(e.message)
        res.redirect("/login");
    }

});

export const logOut =asyncHandler(async (req,res)=>{
    req.session.destroy();
})
