import admin from "../../models/userModel.js";
import checkPass from "../../utils/checkPassword.js"
import userModel from "../../models/userModel.js"

export const accessToAdmin = async (adminMail, password) => {
    const adminData = await admin.findOne({ email: adminMail });
    if (!adminData) {
        throw new Error("can't find admin");
    }

    const isValid = await checkPass(password, adminData.password);

    if (!isValid) {
        throw new Error("Invalid credentials");
    }
    return adminData
}

export const usersList = async (page, limit ,search) => {
    const skip = (page - 1) * limit;
    const users = await userModel.find({ email: { $nin: "admin@gmail.com" },userName:{$regex:search,$options:"i"} })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    console.log("hello")
    const totalCountOfUsers = await userModel.countDocuments({ email: { $nin: "admin@gmail.com" } });
    return { users, totalCountOfUsers };
}

export const blockOrUnblock = async (userId, action) => {
    const isBlocked = action === "block"
    const update = await userModel.findOneAndUpdate({ _id: userId }, { $set: { isBlocked } });
}