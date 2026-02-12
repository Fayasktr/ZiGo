import crypto from "crypto"

let otp ="";
for(let i=0;i<6;i++){
    otp+=crypto.randomInt(0,10).toString();
}
console.log(otp)