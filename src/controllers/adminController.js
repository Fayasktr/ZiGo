import asynchandler from "express-async-handler"
import * as adminService from "../services/admin/adminService.js"


export const adminLoginPage = asynchandler(async (req,res)=>{
    res.render("admin/adminLogin");
})

export const adminAccess = asynchandler(async (req,res)=>{
    try{
        const {adminMail,password} = req.body;
        console.log("admin controler reached :"+adminMail)
        const checkAdminAuth = await adminService.accessToAdmin(adminMail,password);
        console.log("admin seccessfully logined ")
        req.session.admin={
            adminMail:adminMail,
            adminName:checkAdminAuth.adminMail
        }
        res.render("admin/adminDashbord")
    }catch (error) {
        req.flash("error",error);
        res.redirect("admin/adminLogin");
    }
});

export const adminLogout = asynchandler(async (req,res)=>{
    req.session.admin =null;
    res.redirect("/admin");
})