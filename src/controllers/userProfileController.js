import asynchandler from "express-async-handler";
import * as addressService from '../services/uAddressService.js';

export const showProfile = asynchandler(async (req, res) => {

    const user = req.session.user || req.user;
    console.log("the user: " + user.email)
    const defaultAddres = await addressService.showProfileData(user.email);
    res.render("user/userAfterLogin/profile", { user, defaultAddres });
});

export const loadEditProfile = asynchandler(async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const userData = await addressService.editProfilePage(user.email);
        res.render("user/userAfterLogin/editProfile", { userData });
    } catch (error) {

    }
});

export const editProfile = asynchandler(async (req, res) => {
    try {
        const editData = req.session.editData;
        const userId = req.session.user._id || req.user.id;
        await addressService.editProfile(editData, userId);
        return res.status(200).json({ success: true, message: "Address added successfully", address });

    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });

    }
})
export const otpSend = asynchandler(async (req, res) => {
    const editData = req.body;
    if (editData.email || editData.password) {
        req.session.editData = editData;
        await addressService.optSend(req.session.user.email || req.user.email);
        res.render("user/otp");
    }
})
export const otpCheck = asynchandler(async (req, res) => {
    try {
        const otp = req.body;
        const userId = req.session.user._id || req.user.id;
        await addressService.otpCheck(otp, userId);
        editProfile();
    } catch (error) {

    }

})

export const loadAddressPage = asynchandler(async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const addresses = await addressService.allAddresses(user);
        res.render("user/userAfterLogin/addresses", { user, addresses })
    } catch (error) {

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
        console.log("address data to edit: ", addressData);
        await addressService.editAddress(addressId, addressData);
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
        const userId = req.session.user._id || req.user.id;
        await addressService.deleteAddress(userId, addressId);
        req.flash("success", "Default address updated successfully!");
        res.redirect("/user/addresses");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/addresses");
    }
})

