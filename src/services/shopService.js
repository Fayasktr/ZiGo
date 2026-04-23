import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import wishlistModel from '../models/wishlistModel.js';
import cartModel from '../models/cartModel.js';
import addressModel from '../models/addressModel.js';
import userModel from '../models/userModel.js';
import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import { getBestOffer } from '../utils/getBestOffer.js';
import { couponModel } from '../models/couponModel.js';

export const getShopData = async (quary, userId) => {
  let { page = 1, search = '', category = '', price = '' } = quary;
  let limit = 9;
  let skip = (page - 1) * limit;
  let filter = { isListed: true };

  if (search) {
    filter.productName = { $regex: search, $options: 'i' };
  }
  if (price) {
    let [min, max] = price.split('-');
    const priceFilter = {};
    
    if (max === 'plus') {
        priceFilter.$gte = parseInt(min);
    } else {
        priceFilter.$gte = parseInt(min);
        priceFilter.$lte = parseInt(max);
    }
    filter.variants = { 
        $elemMatch: { 
            price: priceFilter,
            isListed: true
        } 
    };
}
  let categories = await categoryModel
    .find({ isListed: true })
    .sort({ createdAt: -1 });

  let categoryArray = [];
  if (category) {
    categoryArray = Array.isArray(category) ? category : [category];
  }

  if (categoryArray.length > 0) {
    let categoryData = await categoryModel.find({
      categoryName: { $in: categoryArray.map(c => new RegExp(`^${c}$`, 'i')) },
      isListed: true,
    });
    if (categoryData && categoryData.length > 0) {
      filter.category = { $in: categoryData.map((c) => c._id) };
    }
  } else {
    const categoryIds = categories.map((item) => item._id);
    filter.category = { $in: categoryIds };
  }

  let userWishlist = [];
  if (userId) {
    const wishlistItems = await wishlistModel
      .find({ userId: userId })
      .distinct('variantId');
    userWishlist = wishlistItems.filter(Boolean).map((id) => id.toString());
  }
  const [products, totalCount] = await Promise.all([
    productModel
      .find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    productModel.countDocuments(filter),
  ]);

  const productsWithOffers = await Promise.all(
    products.map(async (product) => {
      const basePrice = product.variants?.[0]?.price || 0;

      const bestOffer = await getBestOffer({
        productId: product._id,
        categoryId: product.category?._id,
        price: basePrice,
      });
      let offerDiscount = bestOffer?.discount || 0;
      let finalPrice = basePrice - offerDiscount;
      return {
        ...product.toObject(),
        offer: bestOffer?.offer || null,
        offerDiscount,
        finalPrice,
      };
    })
  );

  return {
    userWishlist,
    products: productsWithOffers,
    categories,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    limit,
    search,
    selectedCategory: category,
    selectedPrice: price,
    userWishlist,
  };
};

export const productDetailsePage = async (productId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return null;
  }
  const product = await productModel.findById(productId).populate('category');
  if (!product) {
    throw new Error('The product unlisted or not not available');
  }
  const category = product.category;
  let relatedProducts = [];
  if (category) {
    relatedProducts = await productModel
      .find({
        _id: { $ne: productId },
        category: category._id,
        isListed: true,
      })
      .limit(4);
  }
  const basePrice = product.variants?.[0]?.price || 0;
  const bestOffer = await getBestOffer({
    productId: product._id,
    categoryId: product.category?._id,
    price: basePrice,
  });
  const offerDiscount = bestOffer?.discount || 0;
  const finalPrice = basePrice - offerDiscount;

  product.offer = bestOffer?.offer || null;
  product.offerDiscount = offerDiscount;
  product.finalPrice = finalPrice;

  const relatedProductsWithOffers = await Promise.all(
    relatedProducts.map(async (rel) => {
      const relBasePrice = rel.variants?.[0]?.price || 0;
      const relBestOffer = await getBestOffer({
        productId: rel._id,
        categoryId: rel.category?._id,
        price: relBasePrice,
      });
      const relOfferDiscount = relBestOffer?.discount || 0;
      const relFinalPrice = relBasePrice - relOfferDiscount;

      const relDoc = rel;
      relDoc.offer = relBestOffer?.offer || null;
      relDoc.offerDiscount = relOfferDiscount;
      relDoc.finalPrice = relFinalPrice;
      return relDoc;
    })
  );

  let wishlist = [];
  if (userId) {
    const wishlistData = await wishlistModel
      .find({ userId: userId })
      .distinct('variantId');
    wishlist = wishlistData.filter(Boolean).map((id) => id.toString());
  }
  const variantAttributes = product.category?.variantAttributes || [];

  return {
    product,
    relatedProducts: relatedProductsWithOffers,
    wishlist,
    variantAttributes,
  };
};

export const wishlistUpdate = async (productId, userId, variantId) => {
  if (!userId) {
    throw new Error('no user found');
  }
  const existWislist = await wishlistModel.findOne({
    userId,
    productId,
    variantId,
  });
  if (existWislist) {
    await wishlistModel.deleteOne({ userId, productId, variantId });
    const wishlistCount = await wishlistModel.countDocuments({ userId });
    return { action: 'removed', wishlistCount };
  } else {
    await wishlistModel.create({
      userId: userId,
      productId: productId,
      variantId: variantId,
    });
    const wishlistCount = await wishlistModel.countDocuments({ userId });
    return { action: 'added', wishlistCount };
  }
};

export const addToCart = async (userId, productId, variantId, quantity = 1) => {
  if (!userId) {
    throw new Error('Login required to add items to cart');
  }
  if (quantity > 10)
    throw new Error('select maximum 10 quantity for a single product');
  const qty = parseInt(quantity) || 1;
  const existCart = await cartModel.findOne({ userId, productId, variantId });
  const product = await productModel.findById(productId);
  const variant = product.variants.find((v) => v._id.toString() === variantId);
  const cartItems = await cartModel.find({ userId });
  const cartCount = cartItems.reduce(
    (acc, item) => acc + (item.quantity || 0),
    0
  );
  if (!variant) {
    throw new Error('this variant currently not available');
  }
  if (existCart && existCart.quantity >= variant.stock) {
    throw new Error(
      `Stock limit exceed (only ${variant.stock} stock available)`
    );
  }

  if (existCart) {
    const newQuantity = existCart.quantity + qty;
    if (newQuantity > 10) {
      throw new Error('Maximum cart limit reached (10 per item)');
    }
    await cartModel.updateOne(
      { userId, productId, variantId },
      { $inc: { quantity: qty } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else {
    if (!product) throw new Error('Product not found');
    if (!variant) throw new Error('Variant not found');
    if (variant.stock < qty) {
      throw new Error(
        `Insufficient stock available, only ${variant.stock} stock available`
      );
    }

    await cartModel.create({
      userId: userId,
      productId: productId,
      variantId: variantId,
      quantity: qty,
      price: variant.price,
    });
  }

  const carts = await cartModel.find({ userId });
  return carts.reduce((acc, item) => acc + (item.quantity || 0), 0);
};

export const checkoutPage = async (userId) => {
  try {
    const cartData = await cartModel.find({ userId: userId }).populate({
      path: 'productId',
      populate: { path: 'category' },
    });

    const checkoutData = await Promise.all(
      cartData.map(async (item) => {
        const product = item.productId;
        if (!product) return null;

        const variant = product.variants.find(
          (v) => v._id.toString() === item.variantId.toString()
        );
        const basePrice = variant ? variant.price : 0;

        const bestOffer = await getBestOffer({
          productId: product._id,
          categoryId: product.category?._id,
          price: basePrice,
        });

        const offerDiscount = bestOffer?.discount || 0;
        const finalPrice = basePrice - offerDiscount;

        return {
          _id: item._id,
          productId: product._id,
          productName: product.productName,
          variantId: item.variantId,
          quantity: item.quantity,
          price: basePrice,
          finalPrice: finalPrice,
          offerDiscount: offerDiscount,
          images: variant ? variant.images : [],
          attributes: variant ? variant.attributes : {},
          stock: variant ? variant.stock : 0,
          totalPrice: finalPrice * item.quantity,
          isAvailable: variant
            ? variant.stock >= item.quantity &&
              variant.isListed &&
              product.isListed
            : false,
        };
      })
    );

    const filteredCheckoutData = checkoutData.filter((item) => item !== null);

    const addresses = await addressModel
      .find({ userId: userId })
      .sort({ isDefault: -1, createdAt: -1 });
    const defaultAddress =
      addresses.find((addr) => addr.isDefault) || addresses[0] || null;

    const mrpSubTotal = filteredCheckoutData.reduce(
      (sum, item) => sum + (item.isAvailable ? item.price * item.quantity : 0),
      0
    );
    const totalSavings = filteredCheckoutData.reduce(
      (sum, item) =>
        sum + (item.isAvailable ? item.offerDiscount * item.quantity : 0),
      0
    );

    const couponsAvailable = await couponModel.find({
      $and:[{minOrderAmount:{ $lte: mrpSubTotal }},{expiresAt:{$gte:new Date()}}]
    });

    const taxableAmount = mrpSubTotal - totalSavings;
    const shipping = taxableAmount > 1000 || taxableAmount === 0 ? 0 : 40;
    const tax = taxableAmount * 0.18;
    const total = taxableAmount + shipping + tax;

    console.log(
      `Checkout page loaded for user ${userId}. Items: ${filteredCheckoutData.length}`
    );

    return {
      checkoutData: filteredCheckoutData,
      defaultAddress,
      addresses,
      couponsAvailable,
      totals: {
        subTotal: mrpSubTotal,
        totalSavings,
        shipping,
        tax,
        total,
      },
    };
  } catch (error) {
    console.error('Checkout Service Error:', error);
    throw new Error(error);
  }
};

export const checkoutBuyNowOrder = async (userId, buyNowItem, quantity = 1) => {
  const product = await productModel
    .findById(buyNowItem.productId)
    .populate('category');
  if (!product) {
    throw new Error('product not available');
  }
  const variant = product.variants.find(
    (v) => v._id.toString() === buyNowItem.variantId.toString()
  );
  if (!variant) {
    throw new Error('variant not available');
  }
  if (variant.stock < buyNowItem.quantity) {
    throw new Error(
      `limited stock available, (only ${variant.stock} available)`
    );
  }

  const bestOffer = await getBestOffer({
    productId: product._id,
    categoryId: product.category?._id,
    price: variant.price,
  });

  const offerDiscount = bestOffer?.discount || 0;
  const finalPrice = variant.price - offerDiscount;

  const itemData = {
    productId: product._id,
    variantId: variant._id,
    productName: product.productName,
    price: variant.price,
    finalPrice: finalPrice,
    offerDiscount: offerDiscount,
    quantity: buyNowItem.quantity,
    totalPrice: finalPrice * buyNowItem.quantity,
    images: variant.images,
    attributes: variant.attributes || {},
    isAvailable: true,
  };

  const addresses = await addressModel.find({ userId }).sort({ isDefault: -1 });
  const defaultAddress =
    addresses.find((addr) => addr.isDefault) || addresses[0] || null;

  const mrpSubTotal = Number(variant.price) * buyNowItem.quantity;
  const totalSavings = offerDiscount * buyNowItem.quantity;
  const taxableAmount = mrpSubTotal - totalSavings;

  const couponsAvailable = await couponModel.find({
    minOrderAmount: { $lte: mrpSubTotal },
  });

  const shipping = taxableAmount > 1000 ? 0 : 40;
  const tax = Math.round(taxableAmount * 0.18);
  const total = Number(taxableAmount) + Number(shipping) + Number(tax);

  return {
    checkoutData: [itemData],
    totals: {
      subTotal: mrpSubTotal,
      totalSavings,
      shipping,
      tax,
      total,
    },
    addresses,
    defaultAddress,
    couponsAvailable,
  };
};

let ordNumSelect = 124281;

export const placeOrder = async (
  userId,
  addressId,
  paymentMethod,
  cartItems,
  couponCode = null
) => {
  const user = await userModel.findById(userId);
  if (!user || user.isBlocked) {
    throw new Error('Account not autherized');
  }
  if (!cartItems.length) {
    throw new Error('cart is empty');
  }
  const address = await addressModel.findOne({
    userId: userId,
    _id: addressId,
  });
  if (!address) {
    throw new Error('Invalid shiping address.');
  }

  let orderItems = [];
  let mrpSubTotal = 0;
  let totalSavings = 0;
  for (let item of cartItems) {
    if (item.category?.isListed == false) {
      throw new Error('category not available');
    }
    if (item.variant?.isListed == false) {
      throw new Error('item variant not available');
    }
    const productObj = await productModel
      .findById(item.productId)
      .populate('category');
    if (!productObj) throw new Error('Product no longer available');

    const variant = productObj.variants.find(
      (v) => v._id.toString() === item.variant._id.toString()
    );
    if (!variant || !variant.isListed)
      throw new Error(`Variant of ${item.productName} no longer available`);

    const bestOffer = await getBestOffer({
      productId: productObj._id,
      categoryId: productObj.category?._id,
      price: variant.price,
    });

    const offerDiscount = bestOffer?.discount || 0;
    const finalPrice = variant.price - offerDiscount;

    let stockUpdate = await productModel.updateOne(
      {
        _id: item.productId,
        'variants._id': new mongoose.Types.ObjectId(item.variant._id),
        'variants.stock': { $gte: item.quantity },
      },
      { $inc: { 'variants.$.stock': -item.quantity } }
    );

    if (stockUpdate.modifiedCount === 0) {
      throw new Error(
        `"${item.productName}" just ran out of stock. Please update your cart.`
      );
    }

    mrpSubTotal += variant.price * item.quantity;
    totalSavings += offerDiscount * item.quantity;

    orderItems.push({
      productId: item.productId,
      variantId: item.variant._id,
      productName: item.productName,
      variantAttributes: item.variant.attributes || {},
      price: variant.price,
      finalPrice: finalPrice,
      offerDiscount: offerDiscount,
      quantity: item.quantity,
      itemTotal: finalPrice * item.quantity,
      image: item.variant.images?.[0] || '../../public/public/no-image.jpg',
      itemStatus: 'active',
    });
  }

  const discountedSubtotal = mrpSubTotal - totalSavings;

  let couponDiscount = 0;
  let couponId = null;
  if (couponCode) {
    const coupon = await couponModel.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (coupon && coupon.minOrderAmount <= discountedSubtotal) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = (discountedSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount)
          couponDiscount = coupon.maxDiscount;
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, discountedSubtotal);
      couponId = coupon._id;

      await couponModel.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 } }
      );
    }
  }

  const amountForTax = discountedSubtotal - couponDiscount;
  const tax = parseFloat((amountForTax * 0.18).toFixed(2));
  const shipingCharge = amountForTax < 1000 && amountForTax > 0 ? 40 : 0;
  const total = parseFloat((amountForTax + tax + shipingCharge).toFixed(2));

  let orderNumber = `ORD-${new Date() - Math.floor(Math.random() * 9000 + 1000)}-${ordNumSelect++}`;

  const order = await orderModel.create({
    orderNumber,
    userId,
    shippingAddress: {
      fullName: address.userName,
      phone: address.phoneNumber,
      addressLine: address.detailedAddress,
      city: address.city,
      state: address.state || 'N/A',
      pincode: address.pincode,
      country: address.country || 'India',
    },
    items: orderItems,
    pricing: {
      subTotal: mrpSubTotal,
      tax,
      shipping: shipingCharge,
      discound: totalSavings,
      couponDiscount,
      total,
    },
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    couponId: couponId,
  });

  await cartModel.deleteMany({ userId: userId });
  return order;
};

export const successPage = async (userId, orderNumber) => {
  const order = await orderModel.findOne({ userId, orderNumber });
  if (!order) {
    throw new Error('order detailse not found');
  }
  return order;
};

export const buynow = async (productId, variantId, quantity) => {
  const product = await productModel.findOne({
    _id: productId,
    'variants._id': variantId,
  });
  if (!product) {
    throw new Error('product not available');
  }
  const variant = product.variants.find(
    (v) => v._id.toString() === variantId.toString()
  );
  if (!variant) {
    throw new Error('variant not available');
  }
  if (variant.stock < quantity) {
    throw new Error(
      `limited stock available, (only ${variant.stock} available)`
    );
  }
  return product;
};

export const placeBuyNowOrder = async (
  userId,
  addressId,
  paymentMethod,
  buyNowItem,
  couponCode = null
) => {
  const address = await addressModel.findOne({
    userId: userId,
    _id: addressId,
  });
  if (!address) {
    throw new Error('Invalid shiping address.');
  }
  const product = await productModel
    .findById(buyNowItem.productId)
    .populate('category');
  console.log(`the product to buy: ${product}`);
  if (!product) {
    throw new Error('product not available');
  }
  if (product.category && !product.category.isListed) {
    throw new Error('Category not available');
  }
  console.log(buyNowItem);

  const variant = product.variants.find(
    (v) => v._id.toString() === buyNowItem.variantId.toString()
  );
  if (!variant || !variant.isListed) {
    throw new Error('Variant not available');
  }
  const bestOffer = await getBestOffer({
    productId: product._id,
    categoryId: product.category?._id,
    price: variant.price,
  });

  const offerDiscount = bestOffer?.discount || 0;
  const finalPrice = variant.price - offerDiscount;

  const stockUpdate = await productModel.updateOne(
    {
      _id: buyNowItem.productId,
      'variants._id': new mongoose.Types.ObjectId(buyNowItem.variantId),
      'variants.stock': { $gte: buyNowItem.quantity },
    },
    { $inc: { 'variants.$.stock': -buyNowItem.quantity } }
  );

  if (stockUpdate.modifiedCount === 0) {
    throw new Error('Item just went out of stock. Please try again.');
  }
  const itemTotal = Number(finalPrice) * buyNowItem.quantity;
  const mrpSubTotal = Number(variant.price) * buyNowItem.quantity;
  const totalSavings = offerDiscount * buyNowItem.quantity;
  const discountedAmount = mrpSubTotal - totalSavings;

  let couponDiscount = 0;
  let couponId = null;
  if (couponCode) {
    const coupon = await couponModel.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (coupon && coupon.minOrderAmount <= discountedAmount) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = (discountedAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount)
          couponDiscount = coupon.maxDiscount;
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, discountedAmount);
      couponId = coupon._id;

      await couponModel.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 } }
      );
    }
  }

  const amountForTax = discountedAmount - couponDiscount;
  const shipping = amountForTax < 1000 && amountForTax > 0 ? 40 : 0;
  const tax = Math.round(amountForTax * 0.18);
  const total = Number(amountForTax) + Number(shipping) + Number(tax);
  const orderNumber = `ORD-${new Date() - Math.floor(Math.random() * 9000 + 1000)}-${ordNumSelect++}`;

  const order = await orderModel.create({
    orderNumber,
    userId,
    shippingAddress: {
      fullName: address.userName,
      phone: address.phoneNumber,
      addressLine: address.detailedAddress,
      city: address.city,
      state: address.state || 'N/A',
      pincode: address.pincode,
      country: address.country || 'India',
    },
    items: [
      {
        productId: product._id,
        variantId: variant._id,
        productName: product.productName,
        variantAttributes: variant.attributes || {},
        price: variant.price,
        finalPrice: finalPrice,
        offerDiscount: offerDiscount,
        quantity: buyNowItem.quantity,
        itemTotal,
        image: variant.images?.[0] || '/public/no-image.jpg',
        itemStatus: 'active',
      },
    ],
    pricing: {
      subTotal: mrpSubTotal,
      tax,
      shipping,
      discound: totalSavings,
      couponDiscount,
      total,
    },
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    couponId: couponId,
  });

  return order;
};

export const validateCoupon = async (code, subTotal) => {
  try {
    const coupon = await couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon)
      return { isValid: false, message: 'Coupon not found or inactive' };
    if (coupon.minOrderAmount > subTotal)
      return {
        isValid: false,
        message: `Minimum order of ₹${coupon.minOrderAmount} required`,
      };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return { isValid: false, message: 'Coupon has expired' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return { isValid: false, message: 'Coupon usage limit reached' };

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount)
        discountAmount = coupon.maxDiscount;
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      isValid: true,
      discountAmount: Math.min(discountAmount, subTotal),
      couponId: coupon._id,
    };
  } catch (error) {
    console.error('Coupon Validation Error:', error);
    return { isValid: false, message: 'Error validating coupon' };
  }
};
