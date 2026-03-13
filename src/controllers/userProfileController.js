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
        console.log(userId)
        const wishlist = await addressService.wishlistPage(userId);
        console.log(wishlist)
        res.render("user/userAfterLogin/wishlist", { wishlist, user: req.session.user || req.user });
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/user/addresses");
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
