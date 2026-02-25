import bcrypt from "bcryptjs";


const passwordCheck = async(enteredPassword,currentPassword)=>{
    return await bcrypt.compare(enteredPassword, currentPassword);
}

export default passwordCheck;