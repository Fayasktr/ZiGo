import asynchandler from "express-async-handler"
import * as adminService from "../services/admin/adminService.js"


export const adminLoginPage = asynchandler(async (req, res) => {
    res.render("admin/adminLogin");
})

export const adminDashbord = asynchandler(async (req, res) => {
    res.render("admin/adminDashbord")
})
export const adminAccess = asynchandler(async (req, res) => {
    try {
        const { adminMail, password } = req.body;
        const checkAdminAuth = await adminService.accessToAdmin(adminMail, password);
        req.session.admin = {
            adminMail: adminMail,
            adminName: checkAdminAuth.adminMail
        }
        res.redirect("/admin/dashbord")
    } catch (error) {
        req.flash("error", error);
        res.redirect("/admin");
    }
});

export const adminLogout = asynchandler(async (req, res) => {
    req.session.admin = null;
    res.redirect("/admin");
})

export const userManagementPage = asynchandler(async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        if (page < 1) page = 1;
        const search = req.query.search || "";
        const limit = 10;
        const { users, totalCountOfUsers } = await adminService.usersList(page, limit, search);
        const totalPages = Math.ceil(totalCountOfUsers / limit);

        if (page > totalPages) {
            return res.redirect(`/admin/users?page=${totalPages}`);
        }
        res.render("admin/userManagement", {
            users,
            totalCount: totalCountOfUsers,
            currentPage: page,
            totalPages,
            limit,
            search
        });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/dashbord");
    }
})

export const blockAndUnblock = asynchandler(async (req, res) => {
    try {
        const action = req.params.action;
        const userId = req.params.id;
        await adminService.blockOrUnblock(userId, action);
        if (action === "block") {
            delete req.session.user || req.user;
        }
        return res.status(200).json({ success: true, message: "update Successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
    }
})