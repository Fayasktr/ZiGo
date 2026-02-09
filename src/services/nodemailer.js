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
            <div style="font-family: Arial; padding: 20px;">
                <h2>OTP Verification</h2>
                <p>Your One Time Password is:</p>

                <h1 style="letter-spacing: 5px;">${OTP}</h1>

                <p>This OTP will expire in <b>5 minutes</b>.</p>

                <p>If you didn’t request this, please ignore.</p>
            </div>
            `,
    };

    const returInfo = await transporter.sendMail(mailOptions);
    console.log(returInfo.response);

    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};
