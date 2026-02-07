import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs"


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
    const isMatch = await bcrypt.compare(password, existUser.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }
    console.log(existUser)
    return existUser;

}


