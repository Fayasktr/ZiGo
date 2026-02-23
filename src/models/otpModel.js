import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  otp: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    requred: true
  },

  isUsed: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true
  });

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const OTPModel = mongoose.model("OTP", otpSchema);
export default OTPModel;