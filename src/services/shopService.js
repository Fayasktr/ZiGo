import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import wishlistModel from "../models/wishlistModel.js";
import mongoose from "mongoose";

export const getShopData = async (quary) => {
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
            filter.price = { $gte: parseInt(min) };
        } else {
            filter.price = { $gte: parseInt(min), $lte: parseInt(max) }
        }
    }
    if (category) {
        let categoryData = await categoryModel.findOne({ categoryName: category, isListed: true });
        if (categoryData) {
            filter.category = categoryData._id;
        }
    }

    const [products, totalCount] = await Promise.all([
        productModel.find(filter)
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        productModel.countDocuments(filter)
    ]);
    const categories = await categoryModel.find({ isListed: true });

    return {
        products,
        categories,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        search,
        selectedCategory: category,
        selectedPrice: price
    }
}

export const productDetailsePage = async (productId) => {
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
    console.log(category);
    return { product, relatedProducts };
}

export const wishlistUpdate = async (productId, userId) => {
    if (!userId) {
        throw new Error("no user found");
    }
    const existWislist = await wishlistModel.findOne({ userId, productId });
    if (existWislist) {
        await wishlistModel.deleteOne({ userId, productId });
        return { action: "removed" }
    } else {
        await wishlistModel.create({
            userId: userId,
            productId: productId
        })
        return { action: "added" }
    }
}