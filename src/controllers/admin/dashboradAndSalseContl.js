import asynchandler from "express-async-handler"
import * as dahsboardService from "../../services/admin/dashboardAndSalseService.js";

export const adminDashboard = asynchandler(async (req, res) => {
    res.render("admin/adminDashbord")
})

export const getDashboardData=asynchandler(async(req,res)=>{
    try {
        const { filter = '7d', startDate, endDate } = req.query;
        const dashboardData = await dahsboardService.adminDashboard(filter, startDate, endDate);
        res.json({success:true,message:"dashboard data send successfully",...dashboardData});
    } catch (error) {
        res.json({success:false,message:error.message});
    }
})

export const salsePage=asynchandler(async(req,res)=>{
    res.render("admin/report")
})

export const reportData=asynchandler(async(req,res)=>{
    try {
        
    } catch (error) {
        
    }
})