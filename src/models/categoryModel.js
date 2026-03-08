import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    categoryName:{
        type: String,
        required:true
    },
    iconClass:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:false
    },
    variantAttributes:[{
        type:String
    }],
    isListed:{
        type:Boolean,
        default:true
    }
},
{ timestamps:true })


const categoryModle = mongoose.model("category", categorySchema);

export default categoryModle;