import User from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const adminDashboard = async (filter = '7d', customStart = null, customEnd = null) => {
    try {
    const now = new Date();
    let startDate = new Date();
    let endDate = now;
    let groupByFormat = "%Y-%m-%d";

    if (customStart) {
        startDate = new Date(customStart);
        if (customEnd) {
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
        }
    } else {
        if (filter === '1d') {
            startDate.setHours(0, 0, 0, 0);
            groupByFormat = "%H:00";
        } else if (filter === '7d') {
            startDate.setDate(now.getDate() - 7);
        } else if (filter === '30d') {
            startDate.setDate(now.getDate() - 30);
        } else if (filter === '1y') {
            startDate.setFullYear(now.getFullYear() - 1);
            groupByFormat = "%Y-%m";
        }
    }

    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    const [
        countOrders,
        totalAmt,
        usersCount,
        activeProducts,
        topProducts,
        recentOrders,
        revenueTrendData,
        categoryData
    ] = await Promise.all([
        orderModel.countDocuments(dateFilter),
        orderModel.aggregate([
            { $match: { paymentStatus: "paid", ...dateFilter } },
            { $group: { _id: null, totalAmt: { $sum: "$pricing.total" } } }
        ]),
        User.countDocuments(),
        productModel.countDocuments({ isListed: true }),
        orderModel.aggregate([
            { $match: { ...dateFilter } },
            { $unwind: "$items" },
            { $group: { _id: "$items.productName", count: { $sum: "$items.quantity" }, value: { $sum: "$items.itemTotal" } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]),
        orderModel.find(dateFilter)
            .populate('userId', 'email userName')
            .sort({ createdAt: -1 })
            .limit(5),
        orderModel.aggregate([
            { $match: { paymentStatus: "paid", ...dateFilter } },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
                    revenue: { $sum: "$pricing.total" }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        orderModel.aggregate([
            { $match: { paymentStatus: "paid", ...dateFilter } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "productmodels",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.category",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $group: {
                    _id: "$categoryInfo.categoryName",
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ])
        ])

    const totalRevenue = totalAmt[0]?.totalAmt || 0;
    const avgOrderValue = countOrders > 0 ? Math.round(totalRevenue / countOrders) : 0;

    return {
        summary: {
            totalOrders: countOrders,
            totalRevenue,
            activeUsers: usersCount,
            avgOrderValue,
            totalProducts: activeProducts
        },
        revenueTrend: {
            labels: revenueTrendData.map(d => d._id),
            data: revenueTrendData.map(d => d.revenue)
        },
        categoryDistribution: {
            labels: categoryData.map(d => d._id),
            data: categoryData.map(d => d.count)
        },
        topProducts: topProducts.map(p => ({
            name: p._id,
            salesCount: p.count,
            revenue: p.value
        })),
        recentOrders: recentOrders.map(order => ({
            orderId: order.orderNumber || order._id,
            customerName: order.shippingAddress?.fullName || order.userId?.userName || 'N/A',
            customerEmail: order.userId?.email || 'N/A',
            shippingAddress: order.shippingAddress,
            productName: order.items?.[0]?.productName || 'Order',
            totalAmount: order.pricing?.total || 0,
            status: order.orderStatus || 'Pending'
        }))
    };
    } catch (error) {
        console.error("Dashboard Service Error:", error);
        throw new Error(error)
    }
}

export const reportData = async (filters = {}) => {
    try {
    const { period = 'today', startDate, endDate } = filters;
    const dateRange = getDateRange(period, startDate, endDate);

    const overallMetrics = await orderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            }
        },
        { $unwind: '$items' },
        {
            $addFields: {
                'items.deliveredQuantity': {
                    $subtract: [
                        '$items.quantity',
                        { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                    ]
                },
                'items.actualRevenue': {
                    $multiply: [
                        {
                            $subtract: [
                                '$items.quantity',
                                { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                            ]
                        },
                        '$items.finalPrice'
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$items.actualRevenue' },
                totalOrders: { $addToSet: '$_id' },
                totalItemsSold: { $sum: '$items.deliveredQuantity' },
                totalItemsCancelled: { $sum: '$items.cancelledQuantity' },
                totalItemsReturned: { $sum: '$items.returnedQuantity' },
                grossRevenue: { $sum: '$pricing.total' },
                totalDiscount: { $sum: '$pricing.discound' },
                totalCouponDiscount: { $sum: '$pricing.couponDiscount' }
            }
        },
        {
            $project: {
                _id: 0,
                totalRevenue: 1,
                totalOrders: { $size: '$totalOrders' },
                avgOrderValue: {
                    $cond: [
                        { $gt: [{ $size: '$totalOrders' }, 0] },
                        { $divide: ['$totalRevenue', { $size: '$totalOrders' }] },
                        0
                    ]
                },
                totalItemsSold: 1,
                totalItemsCancelled: 1,
                totalItemsReturned: 1,
                grossRevenue: 1,
                totalDiscount: 1,
                totalCouponDiscount: 1,
                returnRate: {
                    $cond: [
                        { $gt: ['$totalItemsSold', 0] },
                        { $multiply: [{ $divide: ['$totalItemsReturned', '$totalItemsSold'] }, 100] },
                        0
                    ]
                },
                cancellationRate: {
                    $cond: [
                        { $gt: [{ $add: ['$totalItemsSold', '$totalItemsCancelled'] }, 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        '$totalItemsCancelled',
                                        { $add: ['$totalItemsSold', '$totalItemsCancelled'] }
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        }
    ]);

    const salesOverTime = await orderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            }
        },
        { $unwind: '$items' },
        {
            $addFields: {
                'items.actualRevenue': {
                    $multiply: [
                        {
                            $subtract: [
                                '$items.quantity',
                                { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                            ]
                        },
                        '$items.finalPrice'
                    ]
                }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$items.actualRevenue' },
                orders: { $addToSet: '$_id' }
            }
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                revenue: 1,
                orderCount: { $size: '$orders' }
            }
        },
        { $sort: { date: 1 } }
    ]);

    const topProducts = await orderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            }
        },
        { $unwind: '$items' },
        {
            $addFields: {
                'items.deliveredQuantity': {
                    $subtract: [
                        '$items.quantity',
                        { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                    ]
                },
                'items.actualRevenue': {
                    $multiply: [
                        {
                            $subtract: [
                                '$items.quantity',
                                { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                            ]
                        },
                        '$items.finalPrice'
                    ]
                }
            }
        },
        {
            $group: {
                _id: '$items.productId',
                productName: { $first: '$items.productName' },
                image: { $first: '$items.image' },
                unitsSold: { $sum: '$items.deliveredQuantity' },
                revenue: { $sum: '$items.actualRevenue' },
                totalOrders: { $sum: 1 }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'productmodels',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        {
            $addFields: {
                product: { $arrayElemAt: ['$productDetails', 0] }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        {
            $addFields: {
                category: { $arrayElemAt: ['$categoryInfo.categoryName', 0] },
                stock: { $sum: '$product.variants.stock' }
            }
        },
        {
            $project: {
                _id: 1,
                productName: 1,
                image: 1,
                unitsSold: 1,
                revenue: 1,
                totalOrders: 1,
                stock: 1,
                category: 1
            }
        }
    ]);

    const categoryWiseSales = await orderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'productmodels',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'categoryDetail'
            }
        },
        { $unwind: { path: '$categoryDetail', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                actualRevenue: {
                    $multiply: [
                        {
                            $subtract: [
                                '$items.quantity',
                                { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                            ]
                        },
                        '$items.finalPrice'
                    ]
                }
            }
        },
        {
            $group: {
                _id: '$categoryDetail.categoryName',
                revenue: { $sum: '$actualRevenue' },
                itemsSold: {
                    $sum: {
                        $subtract: [
                            '$items.quantity',
                            { $add: ['$items.cancelledQuantity', '$items.returnedQuantity'] }
                        ]
                    }
                }
            }
        },
        { $sort: { revenue: -1 } },
        {
            $project: {
                _id: 0,
                category: '$_id',
                revenue: 1,
                itemsSold: 1
            }
        }
    ]);

    const paymentMethodBreakdown = await orderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.start, $lte: dateRange.end },
                paymentStatus: 'paid'
            }
        },
        {
            $group: {
                _id: '$paymentMethod',
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.total' }
            }
        },
        {
            $project: {
                _id: 0,
                method: '$_id',
                orders: '$totalOrders',
                revenue: '$totalRevenue'
            }
        }
    ]);

    return {
        metrics: overallMetrics[0] || getDefaultMetrics(),
        salesOverTime,
        topProducts,
        categoryWiseSales,
        paymentMethodBreakdown
    };

    } catch (error) {
        console.error('Report generation error:', error);
        throw new Error(`Report generation failed: ${error.message}`);
}
};

const getDateRange = (period, customStart, customEnd) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    const tempDate = new Date();

    switch (period) {
        case 'today':
            break;
        case 'week':
            start.setDate(tempDate.getDate() - 7);
            break;
        case 'month':
            start.setDate(tempDate.getDate() - 30);
            break;
        case 'year':
            start.setFullYear(tempDate.getFullYear() - 1);
            break;
        case 'custom':
            if (!customStart || !customEnd) {
                throw new Error('Custom range requires startDate and endDate');
            }
            start = new Date(customStart);
            start.setHours(0, 0, 0, 0);
            const customEndFixed = new Date(customEnd);
            customEndFixed.setHours(23, 59, 59, 999);
            return { start, end: customEndFixed };
        default:
            break;
    }

    return { start, end };
}

const getDefaultMetrics = () => ({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalItemsSold: 0,
    totalItemsCancelled: 0,
    totalItemsReturned: 0,
    grossRevenue: 0,
    totalDiscount: 0,
    totalCouponDiscount: 0,
    returnRate: 0,
    cancellationRate: 0
});

export const exportSalesPDF = async (req, res) => {
    try {
        const { period = 'today', startDate, endDate } = req.query;
        const data = await reportData({ period, startDate, endDate });

        const templatePath = path.join(__dirname, "../../../views/admin/salesReportPDF.ejs");
        const html = await ejs.renderFile(templatePath, {
            ...data,
            period,
            startDate,
            endDate
        });

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" }
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=sales-report-${period}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF Export Error:", error);
        res.status(500).send("Error generating professional PDF report");
    }
};

export const exportSalesExcel = async (req, res) => {
    try {
    const { period = 'today', startDate, endDate } = req.query;
    const data = await reportData({ period, startDate, endDate });

    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
        { header: "Metric", key: "metric", width: 25 },
        { header: "Value", key: "value", width: 20 }
    ];
    summarySheet.addRows([
        ["Total Revenue", `₹${Math.round(data.metrics.totalRevenue)}`],
        ["Total Orders", data.metrics.totalOrders],
        ["Avg Order Value", `₹${Math.round(data.metrics.avgOrderValue)}`],
        ["Items Sold", data.metrics.totalItemsSold],
        ["Items Returned", data.metrics.totalItemsReturned],
        ["Items Cancelled", data.metrics.totalItemsCancelled]
    ]);
    summarySheet.getRow(1).font = { bold: true };

    const productSheet = workbook.addWorksheet("Top Products");
    productSheet.columns = [
        { header: "Product Name", key: "name", width: 30 },
        { header: "Category", key: "category", width: 20 },
        { header: "Units Sold", key: "sold", width: 15 },
        { header: "Revenue", key: "revenue", width: 20 }
    ];
    data.topProducts.forEach(p => {
        productSheet.addRow([p.productName, p.category, p.unitsSold, Math.round(p.revenue)]);
    });
    productSheet.getRow(1).font = { bold: true };

    const categorySheet = workbook.addWorksheet("Category Sales");
    categorySheet.columns = [
        { header: "Category", key: "name", width: 25 },
        { header: "Items Sold", key: "sold", width: 15 },
        { header: "Revenue", key: "revenue", width: 20 }
    ];
    data.categoryWiseSales.forEach(c => {
        categorySheet.addRow([c.category || 'Uncategorized', c.itemsSold, Math.round(c.revenue)]);
    });
    categorySheet.getRow(1).font = { bold: true };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${period}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
    } catch (error) {
        console.error("Excel Export Error:", error);
        res.status(500).send("Error generating Excel report");
}
};
