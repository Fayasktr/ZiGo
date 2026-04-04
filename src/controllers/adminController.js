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
        if(totalCountOfUsers==0){
            return res.render("admin/userManagement", {users,totalCount: totalCountOfUsers,currentPage: page,totalPages,limit, search});
        }

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
        if (action !== "block" && action !== "unblock") {
            return res.status(400).json({ success: false, message: "Invalid action. Must be 'block' or 'unblock'." });
        }
        await adminService.blockOrUnblock(userId, action);
        
        return res.status(200).json({ success: true, message: "update Successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
    }
})

export const adminOrderList=asynchandler(async(req,res)=>{
    try {
        let page=parseInt(req.query.page)||1;
        const limit=10;
        const search=req.query.search||"";
        const status=req.query.status||"all";

        const {orders,totalCount,returnRequested}=await adminService.adminOrderList(page,limit,search,status);
        const totalPages=Math.ceil(totalCount/limit);
        res.render("admin/orders",{orders,totalCount,currentPage:page,totalPages,limit,search,status,returnRequested})
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/admin/dashbord");
    }
})

export const orderDetailsePage=asynchandler(async(req,res)=>{
    try {
        const orderId=req.params.id;
        const orderData=await adminService.orderDetailsePage(orderId);
        res.render("admin/orderDetails",{order:orderData})
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/admin/orders");
    }
})

export const orderStatusUpdate=asynchandler(async(req,res)=>{
    try {
        const orderId=req.params.id;
        const {status,paymentStatus}=req.body;
        console.log(`order id and status: ${status}, pay:${paymentStatus}, orderId:${orderId}`);
        const order=await adminService.orderStatusUpdate(orderId,status,paymentStatus);
        res.status(200).json({ 
            success: true, 
            message: "Order updated successfully",
            order: {
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus
            }
        });
    } catch (error) {
        res.json({success:false,message:error.message});
    }
})

export const handleReturnRequest=asynchandler(async(req,res)=>{
    try {
        const {orderId,itemId}=req.params;
        const {action}=req.body;
        await adminService.handleReturnRequest(orderId,itemId,action);
        res.status(200).json({ 
            success: true, 
            message: `Return ${action} successfully` 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
})


