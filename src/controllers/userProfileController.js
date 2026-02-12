import asynchandler from "express-async-handler";
import * as addressService from '../services/uAddressService.js';

export const showProfile = asynchandler(async (req, res) => {

    const user = req.session.user;
    res.render("user/userAfterLogin/profile", { user });
});

export const loadEditProfile = asynchandler(async (req, res) => {

    const user = req.session.user;
    res.render("user/userAfterLogin/editProfile", { user });
});


export const loadAddressPage = asynchandler(async (req,res)=>{

    const user = req.session.user;
    res.render("user/userAfterLogin/addresses",{user})
})

export const loadEditAddressPage = asynchandler(async (req,res)=>{
    const user =req.session.user;
    res.render("user/userAfterLogin/addEditAddress");
})

export const addEditAddress = asynchandler (async (req,res)=>{
    try{
        const addressData = req.body;
        if(addressData){
            //edit will do later
        }else{
            const newAddressCreate = await addressService.newAddress(addressData);
            res.redirect("/user/addresses");
        }
    }catch (error) {
        req.flash("error",error);
        res.redirect("addEditAddress")
    }
})