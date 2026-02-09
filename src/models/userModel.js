import mongoose from "mongoose";

const userSchema =mongoose.Schema({
        userName:{
            type:String,
            required:true,
            minlength:3,
            maxlength:30,
            trim:true
        },
        email:{
            type: String,
            required: true,
            unique:true,
            minlength:10,
            maxlength:50,
        },
        password:{
            type: String,
            required: true,
            minlength:6,
            maxlength:100
        },
        role:{
            type: String,
            enum:["user","admin"],
            default:"user"
        },
        googleAuth:{
            type:Boolean,
            default:false
        },
        profileImage:{
            type: String,
            default:""
        },
        isBlocked:{
            type : Boolean,
            default :false
        },
        isVerified:{
            type: Boolean,
            default:false
        }
    },
    {
        timestamps: true
    }
)

const User = mongoose.model("User",userSchema);

export default User;