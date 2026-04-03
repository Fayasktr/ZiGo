import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import wishlistModel from "../models/wishlistModel.js";
import cartModel from "../models/cartModel.js";
import addressModel from "../models/addressModel.js";
import userModel from "../models/userModel.js"
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";

export const getShopData = async (quary, userId) => {
    let { page = 1, search = "", category = "", price = "" } = quary;
    let limit = 9;
    let skip = (page - 1) * limit;
    let filter = { isListed: true };

    if (search) {
        filter.productName = { $regex: search, $options: "i" };
    }
    if (price) {
        let [min, max] = price.split("-");
        if (max == "plus") {
            filter['variants.price'] = { $gte: parseInt(min) };
        } else {
            filter['variants.price'] = { $gte: parseInt(min), $lte: parseInt(max) }
        }
    }
    let categories = await categoryModel.find({ isListed: true }).sort({ createdAt: -1 });

    let categoryArray = [];
    if (category) {
        categoryArray = Array.isArray(category) ? category : [category];
    }

    if (categoryArray.length > 0) {
        let categoryData = await categoryModel.find({ categoryName: { $in: categoryArray }, isListed: true });
        if (categoryData && categoryData.length > 0) {
            filter.category = { $in: categoryData.map(c => c._id) };
        }
    } else {
        const categoryIds = categories.map((item) => item._id);
        filter.category = { $in: categoryIds };
    }

    let userWishlist = [];
    if (userId) {
        const wishlistItems = await wishlistModel.find({ userId: userId }).distinct('variantId');
        userWishlist = wishlistItems.filter(Boolean).map(id => id.toString());
    }
    const [products, totalCount] = await Promise.all([
        productModel.find(filter)
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        productModel.countDocuments(filter)
    ]);

    return {
        userWishlist,
        products,
        categories,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        search,
        selectedCategory: category,
        selectedPrice: price,
        userWishlist
    }
}

export const productDetailsePage = async (productId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return null;
    }
    const product = await productModel.findById(productId).populate("category")
    if (!product) {
        throw new Error("The product unlisted or not not available");
    }
    const category = product.category
    let relatedProducts = []
    if (category) {
        relatedProducts = await productModel.find({
            _id: { $ne: productId },
            category: category._id,
            isListed: true
        }).limit(4);
    }
    let wishlist = [];
    if (userId) {
        const wishlistData = await wishlistModel.find({ userId: userId }).distinct('variantId');
        wishlist = wishlistData.filter(Boolean).map(id => id.toString());
    }
    const variantAttributes = relatedProducts[0]?.variantAttributes;

    return { product, relatedProducts, wishlist };
}


export const wishlistUpdate = async (productId, userId, variantId) => {
    if (!userId) {
        throw new Error("no user found");
    }
    const existWislist = await wishlistModel.findOne({ userId, productId, variantId });
    if (existWislist) {
        await wishlistModel.deleteOne({ userId, productId, variantId });
        const wishlistCount = await wishlistModel.countDocuments({ userId });
        return { action: "removed", wishlistCount };
    } else {
        await wishlistModel.create({
            userId: userId,
            productId: productId,
            variantId: variantId
        });
        const wishlistCount = await wishlistModel.countDocuments({ userId });
        return { action: "added", wishlistCount };
    }
}

export const addToCart = async (userId, productId, variantId, quantity = 1) => {

    if (!userId) {
        throw new Error("Login required to add items to cart");
    }
    if(quantity>10)throw new Error("select maximum 10 quantity for a single product")
    const qty = parseInt(quantity) || 1;
    const existCart = await cartModel.findOne({ userId, productId, variantId });
    const product = await productModel.findById(productId);
    const variant = product.variants.find(v => v._id.toString() === variantId)
    const cartItems = await cartModel.find({ userId });
    const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    if(!variant){
        throw new Error("this variant currently not available")
    }
    if(existCart&&existCart.quantity>=variant.stock){
        throw new Error(`Stock limit exceed (only ${variant.stock} stock available)`)
    }
    
    if (existCart) {
        const newQuantity = existCart.quantity + qty;
        if (newQuantity > 10) {
            throw new Error("Maximum cart limit reached (10 per item)");
        }
        await cartModel.updateOne({ userId, productId, variantId }, { $inc: { quantity: qty } },{upsert:true,new:true,setDefaultsOnInsert:true});
    } else {
        if (!product) throw new Error("Product not found");
        if (!variant) throw new Error("Variant not found");
        if (variant.stock < qty) {
            throw new Error(`Insufficient stock available, only ${variant.stock} stock available`);
        }

        await cartModel.create({
            userId: userId,
            productId: productId,
            variantId: variantId,
            quantity: qty,
            price: variant.price
        });
    }

    const carts = await cartModel.find({ userId });
    return carts.reduce((acc, item) => acc + (item.quantity || 0), 0);
}

export const checkoutPage = async (userId) => {
    try {
        const cartData = await cartModel.find({ userId: userId }).populate("productId");
        
        const checkoutData = cartData.map(item => {
            const product = item.productId;
            if (!product) return null;

            const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            
            return {
                _id: item._id,
                productId: product._id,
                productName: product.productName,
                variantId: item.variantId,
                quantity: item.quantity,
                price: variant ? variant.price : 0,
                images: variant ? variant.images : [],
                attributes: variant ? variant.attributes : {},
                stock: variant ? variant.stock : 0,
                totalPrice: (variant ? variant.price : 0) * item.quantity,
                isAvailable: variant ? (variant.stock >= item.quantity && variant.isListed && product.isListed) : false
            };
        }).filter(item => item !== null);

        const addresses = await addressModel.find({ userId: userId }).sort({ isDefault: -1, createdAt: -1 });
        const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;

        const subTotal = checkoutData.reduce((sum, item) => sum + (item.isAvailable ? item.totalPrice : 0), 0);
        const shipping = subTotal > 1000 ? 0 : 40;
        const tax = subTotal * 0.18;
        const total = subTotal + shipping + tax;

        console.log(`Checkout page loaded for user ${userId}. Items: ${checkoutData.length}`);
        
        return {
            checkoutData,
            defaultAddress,
            addresses,
            totals: {
                subTotal,
                shipping,
                tax,
                total
            }
        };
    } catch (error) {
        console.error("Checkout Service Error:", error);
        throw error;
    }
}


export const checkoutBuyNowOrder = async (userId,buyNowItem,quantity=1) => {
    const product = await productModel.findById(buyNowItem.productId);
    if(!product){
        throw new Error("product not available");
    }
    const variant = product.variants.find(v => v._id.toString() === buyNowItem.variantId.toString());
    if(!variant){
        throw new Error("variant not available");
    }
    if(variant.stock < buyNowItem.quantity){
        throw new Error(`limited stock available, (only ${variant.stock} available)`);
    }
    const itemData = {
        productId: product._id,
        variantId: variant._id,
        productName: product.productName,
        price: variant.price,
        quantity: buyNowItem.quantity,
        totalPrice: variant.price * buyNowItem.quantity,
        images: variant.images,
        attributes: variant.attributes || {},
        isAvailable: true 
    };

    const addresses = await addressModel.find({ userId }).sort({ isDefault: -1 });
    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;

    const subTotal = itemData.totalPrice;
    const shipping = subTotal > 1000 ? 0 : 40;
    const tax = subTotal * 0.18;
    console.log(4)
    return {
        checkoutData: [itemData], 
        totals: { subTotal, shipping, tax, total: subTotal + shipping + tax },
        addresses,
        defaultAddress
    };
};


let ordNumSelect=124281;

export const placeOrder=async(userId,addressId,paymentMethod,cartItems)=>{
    const user=await userModel.findById(userId);
    if(!user||user.isBlocked){
        throw new Error("Account not autherized");
    }
    if(!cartItems.length){
        throw new Error("cart is empty");
    };
    const address=await addressModel.findOne({userId:userId,_id:addressId});
    if(!address){
        throw new Error("Invalid shiping address.");
    }

    let orderItems=[];
    let subTotal=0;
    for(let item of cartItems){

        if(item.category?.isListed==false){
            throw new Error("category not available");
        }
        if(item.variant?.isListed==false){
            throw new Error("item variant not available");
        };  
        let stockUpdate = await productModel.updateOne(
            {_id: item.productId,
                "variants._id": new mongoose.Types.ObjectId(item.variant._id),
                "variants.stock": { $gte: item.quantity }
            },
            { $inc: { "variants.$.stock": -item.quantity }});

        if (stockUpdate.modifiedCount === 0) {
            throw new Error(`"${item.productName}" just ran out of stock. Please update your cart.`);
        }
        
        let itemTotal=item.variant.price*item.quantity;
        subTotal+=itemTotal;
        
        orderItems.push({
            productId: item.productId,
            variantId: item.variant._id,
            productName: item.productName,
            variantAttributes: item.variant.attributes || {},
            price: item.variant.price,
            quantity: item.quantity,
            itemTotal,
            image: item.variant.images?.[0] || "../../public/public/no-image.jpg",
            itemStatus: "active"
        });
    }
    const tax = parseFloat((subTotal * 0.18).toFixed(2));
    const shipingCharge=subTotal<1000?40:0;
    const total = parseFloat((subTotal + tax +shipingCharge).toFixed(2));
    
    let orderNumber=`ORD-${new Date()-Math.floor(Math.random()* 9000 + 1000)}-${ordNumSelect++}`;

    const order = await orderModel.create({
        orderNumber,
        userId,
        shippingAddress: {
            fullName: address.userName,
            phone: address.phoneNumber,
            addressLine: address.detailedAddress,
            city: address.city,
            state: address.state || "N/A",
            pincode: address.pincode,
            country: address.country || "India"
        },
        items: orderItems,
        pricing: { subTotal, tax, shipping: shipingCharge, discount: 0, total },
        paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending"
    });
    
    await cartModel.deleteMany({userId:userId});
    return order;
}

export const successPage=async(userId,orderNumber)=>{
    const order=await orderModel.findOne({userId,orderNumber});
    if(!order){
        throw new Error("order detailse not found");
    }
    return order
}

export const buynow=async(productId,variantId,quantity)=>{
    
    const product = await productModel.findOne({_id:productId,"variants._id":variantId});
    if(!product){
        throw new Error("product not available");
    }
    const variant = product.variants.find(v => v._id.toString() === variantId.toString());
    if(!variant){
        throw new Error("variant not available");
    }
    if(variant.stock < quantity){
        throw new Error(`limited stock available, (only ${variant.stock} available)`);
    }
    return product
}


export const placeBuyNowOrder=async(userId,addressId,paymentMethod,buyNowItem)=>{
    const address=await addressModel.findOne({userId:userId,_id:addressId});
    if(!address){
        throw new Error("Invalid shiping address.");
    }
    const product=await productModel.findById(buyNowItem.productId).populate("category");
    console.log(`the product to buy: ${product}`);
    if(!product){
        throw new Error("product not available");
    }
    if (product.category && !product.category.isListed) {
        throw new Error("Category not available");
    }
    console.log(buyNowItem)

    const variant = product.variants.find(
        (v) => v._id.toString() === buyNowItem.variantId.toString()
    );
    if (!variant || !variant.isListed) {
        throw new Error("Variant not available");
    }
    const stockUpdate = await productModel.updateOne(
        {
        _id: buyNowItem.productId,
        "variants._id": new mongoose.Types.ObjectId(buyNowItem.variantId),
        "variants.stock": { $gte: buyNowItem.quantity },
        },
        { $inc: { "variants.$.stock": -buyNowItem.quantity } }
    );

    if (stockUpdate.modifiedCount === 0) {
        throw new Error("Item just went out of stock. Please try again.");
    }
    const itemTotal=variant.price*buyNowItem.quantity;
    const subTotal=itemTotal;
    const shipping=subTotal<1000?40:0;
    const tax = parseFloat((subTotal * 0.18).toFixed(2));
    const total = parseFloat((subTotal + shipping + tax).toFixed(2));
    const orderNumber=`ORD-${new Date()-Math.floor(Math.random()* 9000 + 1000)}-${ordNumSelect++}`;

    const order = await orderModel.create({
        orderNumber,
        userId,
        shippingAddress: {
            fullName: address.userName,
            phone: address.phoneNumber,
            addressLine: address.detailedAddress,
            city: address.city,
            state: address.state || "N/A",
            pincode: address.pincode,
            country: address.country || "India",
        },
        items: [
        {
            productId: product._id,
            variantId: variant._id,
            productName: product.productName,
            variantAttributes: variant.attributes || {},
            price: variant.price,
            quantity:buyNowItem.quantity,
            itemTotal,
            image: variant.images?.[0] || "/public/no-image.jpg",
            itemStatus: "active",
        }],
        pricing: { subTotal, tax, shipping, discount: 0, total },
        paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending",
    });

    return order;

}