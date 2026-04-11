import asynchandler from "express-async-handler"
import * as dahsboardService from "../../services/admin/dashboardAndSalseService.js";

export const adminDashbord = asynchandler(async (req, res) => {
    res.render("admin/adminDashbord")
})
