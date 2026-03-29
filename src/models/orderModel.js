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
    itemTotal:{
        type:Number,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    itemStatus: {
        type: String,
        enum: ["active", "cancelled","delivered", "returned"],
        default: "active"
    },
    returnStatus: {
        type: String,
        enum: ["none", "requested", "approved", "rejected"],
        default: "none"
    },
    returnQuantity: { type: Number, default: 0 },
    returnComments: { type: String }, 
    returnRequestedAt: { type: Date },
    cancelReason: { type: String },
    returnReason: { type: String },
    comments:{type:String}
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
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: "India" }
    },
    pricing:{
        subTotal:{type:Number,required:true},
        tax:{type:Number,default:0},
        shipping:{type:Number,default:0},
        discound:{type:Number,default:0},
        total:{type:Number,required:true}

    },
    orderStatus:{
        type:String,
        enum:["pending","processing","shipped","delivered","cancelled"],
        default:"Pending"
    },
    cancelReason:{
        type:String,
        default:""
    },
    paymentMethod:{
        type:String,
        enum:["cash","rozorpay","wallet"]
    },
    paymentStatus:{
        type:String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    returnRequested: {
        type: Boolean,
        default: false
    },
    items:[itemsSchema],
    couponId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"coupon",
        default:null
    }
},
{
    timestamps:true
}
)

export default mongoose.model("order",orderSchema);