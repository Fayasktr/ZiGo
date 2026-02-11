import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

export const otpSendToMail = async (OTP, userEmail, subjectForMail) => {
  try {
        const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: subjectForMail,
      html: `
        <div style="background:#f4f6f8;padding:30px;font-family:Arial,Helvetica,sans-serif;">
          
          <div style="max-width:500px;background:#ffffff;margin:auto;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:30px;text-align:center;">

            <h2 style="color:#333;margin-bottom:10px;">🔐 OTP Verification</h2>

            <p style="color:#555;font-size:15px;">
              Use the following One Time Password to complete your verification
            </p>

            <div style="
              background:#f1f5ff;
              padding:15px;
              border-radius:8px;
              margin:20px 0;
              font-size:32px;
              letter-spacing:6px;
              font-weight:bold;
              color:#2b4eff;">
              ${OTP}
            </div>

            <p style="color:#444;font-size:14px;">
              ⏳ This OTP will expire in <b>5 minutes</b>
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:20px 0">

            <p style="font-size:13px;color:#777;">
              If you didn't request this OTP, you can safely ignore this email.
            </p>

            <p style="font-size:12px;color:#aaa;margin-top:15px;">
              © ${new Date().getFullYear()} Your App Name 
            </p>

          </div>
        </div>
        `
    };


    const returInfo = await transporter.sendMail(mailOptions);
    console.log(returInfo.response);

    return true;
  } catch (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
};
