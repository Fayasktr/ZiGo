import mongoose from "mongoose";

const cartSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    variantId:{
        type:mongoose.Schema.Types.ObjectId
    },
    quantity:{
        type:Number,
        default:1,
        min:1
    },
    price:{
        type:Number,
        required:true
    }
},{timestamps:true});

const cartModel =mongoose.model("cartModel",cartSchema);

export default cartModel