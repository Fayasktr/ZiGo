import mongoose, { mongo } from "mongoose";

const addressesSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userName: {
        type: String,
        required: true,
    },
    addressType: {
        type: String,
        required: true,
    },
    detailedAddress: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 150
    },
    country: {
        type: String,
        default: "india"
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true,
    },
    phoneNumber: {
        type: Number,
        required: true,
        match: /^[0-9]{10}$/
    },
    email: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    }
},
    {
        timestamps: true
    });

const addressModel = mongoose.model("addressModel", addressesSchema);

export default addressModel;