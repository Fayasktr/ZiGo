import asynchandler from "express-async-handler";
import * as addressService from '../services/uAddressService.js';
import { uploadToCloudinary } from '../config/cloudinary.js';


export const showProfile = asynchandler(async (req, res) => {

    const user = req.session.user || req.user;
    const defaultAddres = await addressService.showProfileData(user.email);
    res.render("user/userAfterLogin/profile", { user, defaultAddres });
});

export const loadEditProfile = asynchandler(async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const userData = await addressService.editProfilePage(user.email);
        res.render("user/userAfterLogin/editProfile", { userData });
    } catch (error) {
        req.flash("error", "Failed to load profile data.");
        res.redirect("/user/profile");
    }
});

export const updateProfile = asynchandler(async (req, res) => {
    try {
        const { userName, phoneNumber } = req.body;
        const userId = req.session?.user?.id || req.user?.id;
        if(phoneNumber.length!=10){
            throw new Error("phone number should be 10 digit");
        }
        await addressService.updatedProfileBasic(userId, userName, phoneNumber);
        if (req.session?.user) req.session.user.userName = userName;
        if (req.user) req.user.userName = userName;
        res.status(200).json({ success: true, message: "basic info updated" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
})
export const editPassword = asynchandler(async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session?.user?.id || req.user?.id;
        await addressService.updatePassword(userId, currentPassword, newPassword);
        return res.status(200).json({ success: true, message: "password updated successul" })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
})

export const changeEmail = asynchandler(async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.session?.user?.id || req.user?.id;

        await addressService.otpSendForEmailChange(userId, email);

        req.session.pendingEmail = email;

        return res.status(200).json({ success: true, message: "OTP sent to your new email." });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
})

export const loadVerifyEmailOtp = asynchandler(async (req, res) => {
    const email = req.session.pendingEmail;
    const userId = req.session?.user?.id || req.user?.id;
    if (!email) {
        return res.redirect('/user/profile/edit');
    }
    res.render("user/otp", {
        email,
        userId,
        verifyAction: "/user/profile/verifyEmail",
        resendAction: "/user/profile/resendEmailOtp"
    });
})

export const verifyEmail = asynchandler(async (req, res) => {
    try {
        const { otp, userId } = req.body;
        const newEmail = req.session.pendingEmail;

        if (!newEmail) throw new Error("Session expired. Please try again.");

        await addressService.verifyAndChangeEmail(userId, otp, newEmail);

        if (req.session?.user) req.session.user.email = newEmail;
        if (req.user) req.user.email = newEmail;
        delete req.session.pendingEmail;

        req.flash("success", "Email updated successfully!");
        res.redirect("/user/profile");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/profile/verifyEmail");
    }
})

export const resendEmailOtp = asynchandler(async (req, res) => {
    try {
        const email = req.session.pendingEmail;
        const userId = req.session?.user?.id || req.user?.id;

        if (!email) throw new Error("Session expired. Please try again.");

        await addressService.otpSendForEmailChange(userId, email);
        req.flash("success", "OTP resent successfully.");
        res.redirect("/user/profile/verifyEmail");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/profile/verifyEmail");
    }
})

export const updateProfileImage = asynchandler(async (req, res) => {
    try {

        if (!req.file) {
            throw new Error("no files to upload");
        }
        const userId = req.session?.user?.id || req.user?.id;
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'your_product_folder');

        await addressService.updateProfileImage(userId, imageUrl);
        if (req.session?.user) req.session.user.profileImage = imageUrl;
        if (req.user) req.user.profileImage = imageUrl;
        return res.status(200).json({
            success: true,
            message: "profile Image Updated..",
            imageUrl
        })
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
})

export const loadAddressPage = asynchandler(async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const addresses = await addressService.allAddresses(user);
        res.render("user/userAfterLogin/addresses", { user, addresses })
    } catch (error) {
        req.flash("error", "Failed to load addresses.");
        res.redirect("/user/profile");
    }
})

export const loadAddAddressPage = asynchandler(async (req, res) => {
    res.render("user/userAfterLogin/addEditAddress", { address: undefined });
})


export const addNewAddress = asynchandler(async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const addressData = req.body;
        let userEmail = user.email
        const address = await addressService.addAddress(userEmail, addressData);
        return res.status(200).json({ success: true, message: "Address added successfully", address });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
})


export const loadEditAddressPage = asynchandler(async (req, res) => {
    try {
        const addressId = req.params.id;
        const updateData = await addressService.editAddressPage(addressId);
        res.render("user/userAfterLogin/addEditAddress", { address: updateData });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/addresses");
    }
})

export const EditAddress = asynchandler(async (req, res) => {
    try {
        const addressData = req.body;
        const addressId = req.params.id;
        const user = req.session.user || req.user;
        const userId = user.id || user._id;
        await addressService.editAddress(userId, addressId, addressData);
        return res.status(200).json({ success: true, message: "Address updated successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
})

export const setDefault = asynchandler(async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const userId = user.id || user._id
        await addressService.setDefaultService(userId, req.params.id);
        res.redirect("/user/addresses");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/addresses");
    }
})

export const deleteAddress = asynchandler(async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session?.user?.id || req.user?.id;
        await addressService.deleteAddress(userId, addressId);
        req.flash("success", "Default address updated successfully!");
        res.redirect("/user/addresses");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/addresses");
    }
})


export const wishlistPage=asynchandler(async(req,res)=>{
    try {
        const user = req.session?.user || req.user;
        const userId = user?.id || user?._id;
        const wishlist = await addressService.wishlistPage(userId);
        res.render("user/userAfterLogin/wishlist", { wishlist, user: req.session.user || req.user });
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/user/addresses");
    }
})

export const removeWishlist =asynchandler(async(req,res)=>{
    try {
        const userId=req.session.user.id||req.user.id;
        const productId=req.params.id;
        const variantId=req.query.variantId;
        let result =await addressService.deleteWishlistItem(userId,productId,variantId);
        res.status(200).json({success:result,message:"item removed from wishlist"});
    } catch (error) {
        res.status(400).json({success:false,message:error.message});
    }
})

export const addToCart=asynchandler(async(req,res)=>{
    try {
        const userId=req.session?.user.id||req.user?.id;
        const productId=req.params.id;
        const variantId=req.query.variantId;
        let updateToCart=await addressService.addToCart(userId,productId,variantId);
        res.status(200).json({success:true,message:"item added to cart"});
    } catch (error) {
        res.status(400).json({success:false,message:error.message});
    }
})

export const cartPage=asynchandler(async(req,res)=>{
    try {
        const user = req.session?.user || req.user;
        const userId = user?.id || user?._id;
        if (!userId) {
            throw new Error("user not found")
        }
        const cart = await addressService.getCartPage(userId);
        res.render("user/userAfterLogin/cart", {
            cart,
            user: req.session.user || req.user
        });
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/user/profile");
    }
})

export const deleteCartItem =asynchandler(async(req,res)=>{
    try {
        const userId=req.session.user?.id||req.user?.id;
        const productId=req.params.id;
        const variantId=req.query.variantId;
        const update=await addressService.deleteCart(userId,productId,variantId);
        res.status(200).json({success:true,message:"item removed"});
    } catch (error) {
        res.status(400).json({success:false,message:"item not removed"});
    }
})

export const changeCartQty=asynchandler(async(req,res)=>{
    try {
        const {change,productId,variantId,currentQty}=req.query;
        const userId=req.session?.user.id||req?.user.id;
        const update=await addressService.changeCartQuantity(userId,change,productId,variantId,currentQty);
        res.status(200).json({success:true,message:"quantity changed",update:update});
    } catch (error) {
        console.log(error)
        res.status(400).json({success:false,message:error.message||"cannot change the quatity"});
    }
})

export const orderHistory=asynchandler(async(req,res)=>{
    try {
        const userId = req.session?.user.id || req?.user.id;
        const result = await addressService.orderHistory(userId, req.query);
        const user = req.session?.user || req?.user;
        res.render("user/userAfterLogin/orderHistory", { 
            orders: result.orders,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            totalCount: result.totalCount,
            limit: 5,
            search: result.search,
            user 
        });
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/user/profile");
    }
})

export const orderDetailse=asynchandler(async(req,res)=>{
    try {
        const userId=req.session?.user.id||req?.user.id;
        const orderId=req.params.id;
        const order=await addressService.orderDetailse(userId,orderId);
        res.render("user/userAfterLogin/orderDetails",{order});
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/user/orders");
    }
})

export const ordercancel=asynchandler(async(req,res)=>{
    try {
        const userId=req.session?.user.id||req?.user.id;
        const orderId=req.params.id;
        const reason= req.body.reason ||""
        const comments=req.body.comments;
        const cancelling=await addressService.orderCancel(userId,orderId,reason,comments);
        res.status(200).json({success:true,message:"order canselled"});
    } catch (error) {
        res.status(400).json({success:false,message:"can't change order status"});
    }
})

export const itemCancel=asynchandler(async(req,res)=>{
    try {
        const userId=req.session?.user.id||req?.user.id;
        const orderId=req.params.orderId;
        const itemId=req.params.itemId;
        const reason= req.body.reason;
        const comments=req.body.comments;
        const quantity = req.body.quantity || 1; 
        await addressService.itemCancel(userId,orderId,itemId,reason,comments,quantity);
        res.status(200).json({success:true,message:"item canselled"});
    } catch (error) {
        res.status(400).json({success:false,message:error.message ||"can't change item status"});
    }
})

export const itemReturn=asynchandler(async(req,res)=>{
    try {
        const userId=req.session?.user?.id||req?.user?.id;
        const {orderId,itemId}=req.params;
        const {reason,quantity=1,comments}=req.body;
        await addressService.itemReturn(userId,orderId,itemId,reason,quantity,comments);
        res.status(200).json({success:true,message:"return requiested"});
    } catch (error) {
        res.status(400).json({success:false,message:error.message ||"can't change item status"});
    }
})

export const walletPage=asynchandler(async(req,res)=>{
    try {
        const userId = req.session?.user?.id || req.user?.id;
        if (!userId) {
            throw new Error("User session not found");
        }
        const wallet = await addressService.getWalletData(userId);
        res.render("user/userAfterLogin/wallet", {user: req.session.user || req.user,wallet});
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/profile");
    }
})

export const downloadInvoice=asynchandler(async(req,res)=>{
    try {
        const orderId=req.params.orderId;
        const userId= req.session?.user?.id || req.user?.id;
        const {order,pdf}=await addressService.setupInvoice(orderId,userId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
            `attachment; filename=invoice-${order.orderNumber}.pdf`
        );
        res.send(pdf);
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/user/orders");
    }
})