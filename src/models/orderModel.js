import mongoose from "mongoose"

const itemsSchema = mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    variantId:{
        type:mongoose.Schema.Types.ObjectId
    },
    productName:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true,
    },
    quantity:{
        type:Number,
        default:1
    },
    image:{
        type:String,
        required:true
    }
})

const orderSchema=mongoose.Schema({
    orderNumber:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    shippingAddress:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Address"
    },
    totalAmount:{
        type:Number
    },
    orderStatus:{
        type:String,
        enum:["Pending","Processing","Shipped","Delivered","Cancelled"],
        default:"pending"
    },
    paymentMethod:{
        type:String,
        enum:["cash","rozorpay"]
    },
    paymentStatus:{
        type:String,
        default:"pending"
    },
    items:[itemsSchema],
    couponId:{
        type:mongoose.Schema.Types.ObjectId,
        required:false
    }
},
{
    timestamps:true
}
)

export default mongoose.model("order",orderSchema);