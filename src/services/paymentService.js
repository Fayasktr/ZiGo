import razorpay from '../config/razorpay.js';
import crypto from 'crypto';
import walletModel from '../models/walletModel.js';

// Called first — creates Razorpay order, returns order_id to browser
export const createRazorpayOrder = async (amount) => {
  if (isNaN(amount) || amount <= 0) {
    console.error('Invalid amount for Razorpay:', amount);
    throw new Error('Invalid payment amount. Please refresh and try again.');
  }

  console.log(`Creating Razorpay Order for amount: ₹${amount}`);

  const options = {
    amount: Math.round(amount * 100), // rupees → paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };
  const order = await razorpay.orders.create(options);
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
};

// Called after user pays — verifies signature
// Returns true/false — controller decides what to do
export const verifyRazorpaySignature = (
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) => {
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === razorpay_signature;
};

// Check if user has enough balance
export const checkWalletBalance = async (userId, amount) => {
  const wallet = await walletModel.findOne({ userId });
  if (!wallet || wallet.balance < amount) {
    throw new Error(
      `Insufficient wallet balance. Available: ₹${wallet?.balance || 0}`
    );
  }
  return wallet;
};

// Deduct from wallet — called ONLY after order is confirmed to save
export const deductWalletBalance = async (userId, amount, orderId) => {
  await walletModel.findOneAndUpdate(
    { userId },
    {
      $inc: { balance: -amount },
      $push: {
        transactions: {
          type: 'debit',
          amount,
          description: 'Order payment',
          orderId,
        },
      },
    }
  );
};
