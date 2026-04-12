import User from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";

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
            //revenue
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
            //category 
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

export const reportData=async()=>{
    try {
        
    } catch (error) {
        
    }
}