import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productModel",
        required: true
    },variantId:{
        type:mongoose.Schema.Types.ObjectId
    }
}, { timestamps: true });

const wishlistModel = mongoose.model("wishlistModel", wishlistSchema);

export default wishlistModel;
