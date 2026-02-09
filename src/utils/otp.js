import crypto from "crypto";

export const GenerateOTP =async()=>{
    let OTP = "";
    let otpLength=6;
    for(let i=0;i<otpLength;i++){
        OTP += crypto.randomInt(0,10).toString();
    }
    return OTP;
}