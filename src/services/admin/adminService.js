import admin from "../../models/userModel.js";
import checkPass from "../../utils/checkPassword.js"

export const accessToAdmin = async(adminMail,password)=>{
    const adminData= await admin.findOne({email:adminMail});
    if(!adminData){
        throw new Error("can't find admin");
    }

    const isValid = await checkPass(password, adminData.password);
    
    if(!isValid){
        throw new Error("Invalid credentials");
    }
    return adminData
}