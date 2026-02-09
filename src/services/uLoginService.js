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

    if(existUser.isBlocked== true){
        throw new Error("User Blocked By Admin")
    }
    const isMatch = await bcrypt.compare(password, existUser.password);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }
    console.log(existUser)
    return existUser;

}


