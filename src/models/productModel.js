import mongoose from "mongoose";


const variantSchema = mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    attributes:{
        type:Map,
        of:String
    },images:{
        type:[String],
        required:true,
        validate:{
            validator:function(val){
                return val.length>=3;
            },
            message:"A variants must have at lease 3 images"
        }
    },
    isListed:{
        type:Boolean,
        default:true
    }
})

const productSchema = mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    brand:{
        type:String
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"category"
    },
    images:{
        type:[String],
        validate:{
            validator:function(val){
                return !val || val.length>=3
            },
            message:"A product must have minimum 3 images"
        }
    },
    variants:[variantSchema],
    isListed:{
        type:Boolean,
        default:true
    }

},  
{
    timestamps:true
}
)

const productModel = mongoose.model("productModel",productSchema);

export default productModel;


// Product
// │
// ├ name
// ├ description
// ├ brand
// ├ category
// ├ images
// ├ isListed
// │
// └ variants[]
//       │
//       ├ attributes
//       ├ price
//       ├ stock
//       ├ images
//       └ isListed