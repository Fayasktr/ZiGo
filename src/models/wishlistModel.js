import mongoose, { mongo } from "mongoose";

const wishlistSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"productModel",
        required:true
    }
},
{
    timestamps:true
});

const wishlistModel = mongoose.model("wishlistModel",wishlistSchema);

export default wishlistModel;
