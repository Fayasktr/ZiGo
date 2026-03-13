import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import wishlistModel from "../models/wishlistModel.js";
import cartModel from "../models/cartModel.js";
import mongoose from "mongoose";

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
    console.log(`variant attribute:${variantAttributes}`);
    console.log(category);
    return { product, relatedProducts, wishlist };
}


export const wishlistUpdate = async (productId, userId, variantId) => {
    if (!userId) {
        throw new Error("no user found");
    }
    const existWislist = await wishlistModel.findOne({ userId, productId, variantId });
    if (existWislist) {
        await wishlistModel.deleteOne({ userId, productId, variantId });
        return { action: "removed" }
    } else {
        await wishlistModel.create({
            userId: userId,
            productId: productId,
            variantId: variantId
        })
        return { action: "added" }
    }
}

export const addToCart = async (productId, userId, variantId, quantity = 1) => {
    if (!userId) {
        throw new Error("Login required to add items to cart");
    }

    const qty = parseInt(quantity) || 1;
    const existCart = await cartModel.findOne({ userId, productId, variantId });

    if (existCart) {
        const newQuantity = existCart.quantity + qty;
        if (newQuantity > 10) {
            throw new Error("Maximum cart limit reached (10 per item)");
        }
        return await cartModel.updateOne({ userId, productId, variantId }, { $inc: { quantity: qty } });
    }

    const product = await productModel.findById(productId);
    if (!product) throw new Error("Product not found");

    const variant = product.variants.id(variantId);
    if (!variant) throw new Error("Variant not found");

    if (variant.stock < qty) {
        throw new Error("Insufficient stock available");
    }

    return await cartModel.create({
        userId: userId,
        productId: productId,
        variantId: variantId,
        quantity: qty,
        price: variant.price
    });
}