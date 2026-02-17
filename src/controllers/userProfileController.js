import asynchandler from "express-async-handler";
import * as addressService from '../services/uAddressService.js';

export const showProfile = asynchandler(async (req, res) => {

    const user = req.session.user || req.user;
    console.log("the user: "+user.email)
    const defaultAddres = await addressService.showProfileData(user.email);
    res.render("user/userAfterLogin/profile", { user, defaultAddres });
});

export const loadEditProfile = asynchandler(async (req, res) => {

    const user = req.session.user || req.user;
    res.render("user/userAfterLogin/editProfile", { user });
});


export const loadAddressPage = asynchandler(async (req, res) => {

    const user = req.session.user || req.user;
    const addresses = await addressService.allAddresses(user);
    res.render("user/userAfterLogin/addresses", { user, addresses })
})

export const loadEditAddressPage = asynchandler(async (req, res) => {
    const user = req.session.user;

    res.render("user/userAfterLogin/addEditAddress", { user });
})

export const addEditAddress = asynchandler(async (req, res) => {
    try {
        const addressData = req.body;
        console.log("address data to save: "+addressData);
        if (addressData) {
            const newAddressCreate = await addressService.newAddress(addressData);
            res.redirect("/user/addresses");
        } else {
            res.redirect("/user/addresses");
        }
    } catch (error) {
        req.flash("error", error);
        res.redirect("addEditAddress")
    }
})