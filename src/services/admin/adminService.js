import admin from '../../models/userModel.js';
import checkPass from '../../utils/checkPassword.js';
import userModel from '../../models/userModel.js';
import orderModel from '../../models/orderModel.js';
import productModel from '../../models/productModel.js';
import categoryModel from '../../models/categoryModel.js';
import walletModel from '../../models/walletModel.js';
import { couponModel } from '../../models/couponModel.js';
import offerModel from '../../models/offerModel.js';
import bannerModel from '../../models/bannerModel.js';

export const accessToAdmin = async (adminMail, password) => {
  const adminData = await admin.findOne({ email: adminMail });
  if (!adminData) {
    throw new Error("can't find admin");
  }

  if (adminData.role !== 'admin') {
    throw new Error('Access denied: Not an administrator.');
  }

  const isValid = await checkPass(password, adminData.password);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  return adminData;
};

export const usersList = async (page, limit, search) => {
  const skip = (page - 1) * limit;
  const users = await userModel
    .find({
      role: { $ne: 'admin' },
      $or: [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalCountOfUsers = await userModel.countDocuments({
    role: { $ne: 'admin' },
    $or: [
      { userName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  });
  return { users, totalCountOfUsers };
};

export const blockOrUnblock = async (userId, action) => {
  const isBlocked = action === 'block';
  const user = await userModel.findOne({ _id: userId });
  if (user.role == 'admin') {
    throw new Error('you are try to block admin');
  }
  await userModel.updateOne(
    { _id: userId },
    { $set: { isBlocked: isBlocked } }
  );
};

export const adminOrderList = async (page, limit, search, status) => {
  const skip = (page - 1) * limit;
  let filter = {};
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
    ];
  }
  if (status && status !== 'all') {
    filter.orderStatus = status.toLowerCase();
  }

  const [orders, returnRequested, totalCount] = await Promise.all([
    orderModel
      .find(filter)
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    orderModel.find({ returnRequested: true }),
    orderModel.countDocuments(filter),
  ]);

  return { orders, totalCount, returnRequested };
};

export const orderDetailsePage = async (orderId) => {
  const orderData = await orderModel.findById(orderId).populate('userId');
  if (!orderData) throw new Error('order not found');
  return orderData;
};

export const orderStatusUpdate = async (orderId, newStatus, paymentStatus) => {
  const allowed = {
    pending: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    processing: ['processing', 'shipped', 'delivered', 'cancelled'],
    shipped: ['shipped', 'delivered', 'cancelled'],
    cancelled: ['cancelled'],
    delivered: ['delivered', 'returned'],
    returned: ['returned'],
  };
  const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error('Order not found');

  const validNext = allowed[order.orderStatus] || [];
  if (!validNext.includes(newStatus)) {
    throw new Error(
      `Cannot change status from "${order.orderStatus}" to "${newStatus}"`
    );
  }
  if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
    throw new Error(`Invalid payment status: ${paymentStatus}`);
  }

  if (newStatus === 'returned') {
    order.returnRequested = false;
    order.paymentStatus = 'refunded';
    order.items.forEach((item) => {
      if (item.itemStatus !== 'cancelled') {
        item.itemStatus = 'returned';
        item.returnStatus = 'approved';
        item.returnedQuantity = item.quantity;
        item.pendingReturnQuantity = 0;
      }
    });
  }

  if (newStatus === 'cancelled') {
    for (const item of order.items) {
      if (item.itemStatus === 'active') {
        await productModel.updateOne(
          { _id: item.productId, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
        item.itemStatus = 'cancelled';
      }
    }
    let totalRefundAmt = 0;
    if (order.paymentStatus == 'paid') {
      totalRefundAmt = order.pricing.total - order.pricing.shipping;

      await walletModel.updateOne(
        { userId: order.userId },
        {
          $inc: { balance: totalRefundAmt },
          $push: {
            transactions: {
              amount: totalRefundAmt,
              type: 'credit',
              description: `Refund for cancellation: ${order.orderNumber}`,
              orderId: order._id,
              date: new Date(),
            },
          },
        },
        { upsert: true }
      );
    }
  }

  if (newStatus == 'delivered') {
    order.paymentStatus = 'paid';
    order.items.forEach((item) => {
      if (item.itemStatus == 'active') {
        item.itemStatus = 'delivered';
        item.deliveredDate = new Date();
      }
    });
    if (!paymentStatus) {
      order.paymentStatus = 'paid';
    }
  }
  order.orderStatus = newStatus;
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }
  await order.save();
  return order;
};

export const handleReturnRequest = async (orderId, itemId, action) => {
  if (!['approved', 'rejected'].includes(action)) {
    throw new Error('Action must be approved or rejected');
  }

  const order = await orderModel.findById(orderId);
  if (!order) throw new Error('Order not found');

  const item = order.items.id(itemId);
  if (!item) throw new Error('Item not found');
  if (item.returnStatus !== 'requested') {
    throw new Error('No pending return request for this item');
  }

  const pendingQty = item.pendingReturnQuantity || 0;

  if (action === 'approved') {
    await productModel.updateOne(
      { _id: item.productId, 'variants._id': item.variantId },
      { $inc: { 'variants.$.stock': pendingQty } }
    );

    const itemGrossValue = item.price * pendingQty;
    const orderOriginalSubtotal = order.pricing.subTotal;
    const itemWeight = itemGrossValue / orderOriginalSubtotal;
    const totalOrderDiscounts =
      order.pricing.discound + order.pricing.couponDiscount;
    const itemDiscountShare = itemWeight * totalOrderDiscounts;
    const netAmount = itemGrossValue - itemDiscountShare;
    const itemTaxShare = itemWeight * order.pricing.tax;
    const refundAmount = Math.round(netAmount + itemTaxShare);

    await walletModel.updateOne(
      { userId: order.userId },
      {
        $inc: { balance: refundAmount },
        $push: {
          transactions: {
            type: 'credit',
            amount: refundAmount,
            description: `Refund: ${pendingQty} unit(s) of ${item.productName} returned`,
            orderId: order._id,
            date: new Date(),
          },
        },
      },
      { upsert: true }
    );

    item.returnedQuantity = (item.returnedQuantity || 0) + pendingQty;
    item.pendingReturnQuantity = 0;
    const totalAccountedFor =
      item.returnedQuantity + (item.cancelledQuantity || 0);
    if (totalAccountedFor >= item.quantity) {
      item.itemStatus = 'returned';
      item.returnStatus = 'approved';
    } else {
      item.returnStatus = 'none';
    }
    const allDone = order.items.every((i) => {
      const accounted = (i.returnedQuantity || 0) + (i.cancelledQuantity || 0);
      return accounted >= i.quantity;
    });

    if (allDone) {
      order.orderStatus = 'returned';
      order.paymentStatus = 'refunded';
    }
  } else {
    item.returnStatus = 'rejected';
    item.pendingReturnQuantity = 0;
  }

  const anyPending = order.items.some((i) => i.returnStatus === 'requested');
  if (!anyPending) order.returnRequested = false;

  await order.save();
  return order;
};

export const couponPage = async (search, page) => {
  const limit = 12;
  const skip = limit * (page - 1);
  let filter = {};
  if (search) {
    filter.$or = [{ code: { $regex: search, $options: 'i' } }];
  }
  const [couponData, totalCount] = await Promise.all([
    couponModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    couponModel.countDocuments(filter),
  ]);
  return [couponData, totalCount];
};

export const addCoupon = async (couponData) => {
  console.log('coupon data: ', couponData);
  if (couponData.discountValue > couponData.minOrderAmount) {
    throw new Error("can't max discount grater than minimum order amount");
  }
  const existCoupon = await couponModel.findOne({
    code: { $regex: `^${couponData.code}$`, $options: 'i' },
  });
  if (existCoupon) throw new Error('this code coupon already exist');

  const coupon = await couponModel.create({
    code: couponData.code,
    description: couponData.description,
    discountType: couponData.discountType,
    discountValue: Number(couponData.discountValue),
    maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : null,
    minOrderAmount: Number(couponData.minOrderAmount) || 0,
    expiresAt: new Date(couponData.expiresAt),
    usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : null,
    userUsageLimit: Number(couponData.userUsageLimit) || 1,
    isActive: couponData.isActive === 'on' || couponData.isActive === true,
  });
};

export const editCouponPage = async (couponId) => {
  const coupon = await couponModel.findById(couponId);
  if (!coupon) throw new Error('no coupon on this id');
  return coupon;
};

export const editCoupon = async (couponId, couponData) => {
  const existCoupon = await couponModel.findOne({
    code: { $regex: new RegExp(`^${couponData.code}$`, 'i') },
    _id: { $ne: couponId },
  });

  console.log(`exist coupon :${existCoupon}`);

  if (existCoupon) {
    throw new Error('This coupon code is already used by another coupon');
  }

  const updatedCoupon = await couponModel.findByIdAndUpdate(
    couponId,
    {
      code: couponData.code.toUpperCase().trim(),
      description: couponData.description?.trim(),
      discountType: couponData.discountType,
      discountValue: Number(couponData.discountValue),
      maxDiscount: couponData.maxDiscount
        ? Number(couponData.maxDiscount)
        : undefined,
      minOrderAmount: Number(couponData.minOrderAmount) || 0,
      expiresAt: couponData.expiresAt
        ? new Date(couponData.expiresAt)
        : undefined,
      usageLimit: couponData.usageLimit
        ? Number(couponData.usageLimit)
        : undefined,
      userUsageLimit: Number(couponData.userUsageLimit) || 1,
      isActive: couponData.isActive === 'on' || couponData.isActive === true,
    },
    { new: true, runValidators: true }
  );

  return updatedCoupon;
};

export const deleteCoupon = async (couponId) => {
  await couponModel.findOneAndDelete({ _id: couponId });
};

//offer section

export const getOffersPage = async (search, page, offerType) => {
  const limit = 12;
  const skip = limit * (page - 1);

  let filter = { type: offerType || 'category' };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [offerData, totalCount] = await Promise.all([
    offerModel
      .find(filter)
      .populate(offerType === 'product' ? 'productId' : 'categoryId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    offerModel.countDocuments(filter),
  ]);

  return { offerData, totalCount };
};

export const getAddEditOfferPageData = async (offerId) => {
  const [categories, products] = await Promise.all([
    categoryModel.find({ isListed: true }).select('categoryName'),
    productModel.find({ isListed: true }).select('productName'),
  ]);
  let offer = null;
  if (offerId) {
    offer = await offerModel.findById(offerId);
    if (!offer) throw new Error('Offer not found');
  }

  return { offer, categories, products };
};

export const addOffer = async (offerData) => {
  const duplicateFilter = {
    type: offerData.type,
    isActive: true,
  };

  if (offerData.type === 'category') {
    duplicateFilter.categoryId = offerData.categoryId;
  } else {
    duplicateFilter.productId = offerData.productId;
  }

  const existingOffer = await offerModel.findOne(duplicateFilter);
  if (existingOffer) {
    throw new Error(
      `An active offer already exists for this ${offerData.type}`
    );
  }

  const newOffer = await offerModel.create({
    name: offerData.name.trim(),
    type: offerData.type,
    discountType: 'percentage',
    discountValue: Number(offerData.discountValue),
    categoryId:
      offerData.type === 'category' ? offerData.categoryId : undefined,
    productId: offerData.type === 'product' ? offerData.productId : undefined,
    expireAt: new Date(offerData.expireAt),
    isActive: offerData.isActive === true || offerData.isActive === 'on',
  });

  return newOffer;
};

export const editOffer = async (offerId, offerData) => {
  const duplicateFilter = {
    type: offerData.type,
    isActive: true,
    _id: { $ne: offerId },
  };

  if (offerData.type === 'category') {
    duplicateFilter.categoryId = offerData.categoryId;
  } else {
    duplicateFilter.productId = offerData.productId;
  }

  const existingOffer = await offerModel.findOne(duplicateFilter);
  if (existingOffer) {
    throw new Error(
      `Another active offer already exists for this ${offerData.type}`
    );
  }

  const updatedOffer = await offerModel.findByIdAndUpdate(
    offerId,
    {
      name: offerData.name.trim(),
      type: offerData.type,
      discountValue: Number(offerData.discountValue),
      categoryId:
        offerData.type === 'category' ? offerData.categoryId : undefined,
      productId: offerData.type === 'product' ? offerData.productId : undefined,
      expireAt: new Date(offerData.expireAt),
      isActive: offerData.isActive === true || offerData.isActive === 'on',
    },
    { new: true, runValidators: true }
  );

  if (!updatedOffer) throw new Error('Offer not found');
  return updatedOffer;
};

export const deleteOffer = async (offerId) => {
  const deletedOffer = await offerModel.findByIdAndDelete(offerId);
  if (!deletedOffer) throw new Error('Offer not found');
  return deletedOffer;
};

export const bannerPage = async () => {
  return bannerModel.find().sort({ createdAt: -1 });
};

export const getBannerForEdit = async (id) => {
  const banner = await bannerModel.findById(id);
  if (!banner) throw new Error('Banner not found');
  return banner;
};

export const addBanner = async (bannerData) => {
  const isActive =
    bannerData.isActive === 'true' || bannerData.isActive === true;

  if (isActive) {
    await bannerModel.updateMany({}, { isActive: false });
  }

  const newBanner = await bannerModel.create({
    name: bannerData.name,
    description: bannerData.description,
    image: bannerData.image,
    slot: bannerData.slot,
    isActive: isActive,
  });
  return newBanner;
};

export const editBanner = async (id, bannerData) => {
  const isActive =
    bannerData.isActive === 'true' || bannerData.isActive === true;

  if (isActive) {
    await bannerModel.updateMany({ _id: { $ne: id } }, { isActive: false });
  }

  const updateData = {
    name: bannerData.name,
    description: bannerData.description,
    slot: bannerData.slot,
    isActive: isActive,
  };
  if (bannerData.image) {
    updateData.image = bannerData.image;
  }

  const updatedBanner = await bannerModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!updatedBanner) throw new Error('Banner not found');
  return updatedBanner;
};

export const deleteBanner = async (id) => {
  const deleted = await bannerModel.findByIdAndDelete(id);
  if (!deleted) throw new Error('Banner not found');
  return deleted;
};

export const bannerStatus = async (bannerId) => {
  const banner = await bannerModel.findById(bannerId);
  if (!banner) {
    throw new Error('banner not found');
  }
  const newStatus = !banner.isActive;
  if (newStatus) {
    await bannerModel.updateMany(
      { _id: { $ne: bannerId } },
      { isActive: false }
    );
  }
  banner.isActive = newStatus;
  await banner.save();
  return banner;
};
