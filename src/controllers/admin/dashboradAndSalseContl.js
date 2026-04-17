import asynchandler from 'express-async-handler';
import * as dahsboardService from '../../services/admin/dashboardAndSalseService.js';

export const adminDashboard = asynchandler(async (req, res) => {
  res.render('admin/adminDashbord');
});

export const getDashboardData = asynchandler(async (req, res) => {
  try {
    const { filter = '7d', startDate, endDate } = req.query;
    const dashboardData = await dahsboardService.adminDashboard(
      filter,
      startDate,
      endDate
    );
    res.json({
      success: true,
      message: 'dashboard data send successfully',
      ...dashboardData,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export const salsePage = asynchandler(async (req, res) => {
  res.render('admin/report');
});

export const reportData = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    const data = await dahsboardService.reportData({
      period,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

export const exportSalesPDF = asynchandler(async (req, res) => {
  await dahsboardService.exportSalesPDF(req, res);
});

export const exportSalesExcel = asynchandler(async (req, res) => {
  await dahsboardService.exportSalesExcel(req, res);
});
