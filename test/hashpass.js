import bcrypt from "bcryptjs";

const hashPassword=async(password)=>{

    const hashedPassword= await bcrypt.hash(password,10);
    console.log(hashedPassword)
    return 0;
}


hashPassword("123456")