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
    isListed:{
        type:Boolean,
        default:true
    }
})


const categoryModle = mongoose.model("category", categorySchema);

export default categoryModle;