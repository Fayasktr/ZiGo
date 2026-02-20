import asynchandler from "express-async-handler"
import * as adminService from "../services/admin/adminService.js"


export const adminLoginPage = asynchandler(async (req, res) => {
    res.render("admin/adminLogin");
})

export const adminAccess = asynchandler(async (req, res) => {
    try {
        const { adminMail, password } = req.body;
        const checkAdminAuth = await adminService.accessToAdmin(adminMail, password);
        req.session.admin = {
            adminMail: adminMail,
            adminName: checkAdminAuth.adminMail
        }
        res.render("admin/adminDashbord")
    } catch (error) {
        req.flash("error", error);
        res.redirect("admin/adminLogin");
    }
});

export const adminLogout = asynchandler(async (req, res) => {
    req.session.admin = null;
    res.redirect("/admin");
})

export const userManagementPage = asynchandler(async (req, res) => {
    try {
        const users = await adminService.usersList();
        res.render("admin/userManagement", { users });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/adminDashbord");
    }
})

export const blockAndUnblock = asynchandler(async (req, res) => {

})