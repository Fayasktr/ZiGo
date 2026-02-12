import bcrypt from "bcryptjs";


const passwordCheck = async(enteredPassword,currentPassword)=>{
    console.log("reach check pass. :"+enteredPassword +"and current pass: "+currentPassword)
    return await bcrypt.compare(enteredPassword, currentPassword);
}

export default passwordCheck;