import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 10,
        maxlength: 50,
    },
    phone:{
        type:String,
        required:false,
        sparse:true,
        default:null,
        unique:true
    },
    password: {
        type: String,
        required: false,
        minlength: 6,
        maxlength: 100,
        default:null
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    googleId: {
        type: String,
        unique:true,
        default: null
    },
    profileImage: {
        type: String,
        default: ""
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    }
)

const User = mongoose.model("User", userSchema);

export default User;