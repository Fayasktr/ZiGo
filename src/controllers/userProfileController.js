import asynchandler from "express-async-handler";


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