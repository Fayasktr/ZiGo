import admin from "../../models/userModel.js";
import checkPass from "../../utils/checkPassword.js"
import userModel from "../../models/userModel.js"
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import walletModel from "../../models/walletModel.js"

export const accessToAdmin = async (adminMail, password) => {
    const adminData = await admin.findOne({ email: adminMail });
    if (!adminData) {
        throw new Error("can't find admin");
    }

    if (adminData.role !== "admin") {
        throw new Error("Access denied: Not an administrator.");
    }

    const isValid = await checkPass(password, adminData.password);

    if (!isValid) {
        throw new Error("Invalid credentials");
    }
    return adminData
}

export const usersList = async (page, limit, search) => {
    const skip = (page - 1) * limit;
    const users = await userModel.find({ role: { $ne: "admin" }, $or: [{ userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const totalCountOfUsers = await userModel.countDocuments({ role: { $ne: "admin" }, $or: [{ userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] });
    return { users, totalCountOfUsers };
}

export const blockOrUnblock = async (userId, action) => {
    const isBlocked = action === "block";
    const user = await userModel.findOne({ _id: userId });
    if(user.role=="admin"){
        throw new Error("you are try to block admin");
    }
    await userModel.updateOne({_id:userId},{$set:{isBlocked:isBlocked}});
}

export const adminOrderList=async(page,limit,search,status)=>{
    let skip=(page-1)*limit;
    let filter={};
    if (search) {
        filter.$or = [
            { orderNumber: { $regex: search, $options: "i" } },
            { "shippingAddress.fullName": { $regex: search, $options: "i" } }
        ];
    }
    if (status && status !== "all") {
        filter.orderStatus = status.toLowerCase();
    }

    const [orders, returnRequested, totalCount] = await Promise.all([
        orderModel
        .find(filter) 
        .populate("userId", "userName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
        orderModel.find({returnRequested:true}),
        orderModel.countDocuments(filter)
    ])

    return {orders,totalCount,returnRequested}
}

export const orderDetailsePage=async(orderId)=>{
    const orderData=await orderModel.findById(orderId).populate("userId");
    if(!orderData)throw new Error("order not found");
    return orderData;
}


export const orderStatusUpdate=async(orderId,newStatus,paymentStatus)=>{
    const allowed = {
        "pending":    ["pending","processing","shipped","delivered", "cancelled"],
        "processing": ["processing","shipped","delivered", "cancelled"],
        "shipped":    ["shipped","delivered", "cancelled"],
        "cancelled":  ["cancelled"],
        "delivered":  ["delivered","returned"],
        "returned":   ["returned"]
    };
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    const order = await orderModel.findById(orderId);
    if (!order) throw new Error("Order not found");
    
    const validNext = allowed[order.orderStatus] || [];
    if (!validNext.includes(newStatus)) {
        throw new Error(`Cannot change status from "${order.orderStatus}" to "${newStatus}"`);
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        throw new Error(`Invalid payment status: ${paymentStatus}`);
    }

    if (newStatus === "cancelled") {
        for (const item of order.items) {
            if (item.itemStatus === "active") {
                await productModel.updateOne(
                    { _id: item.productId, "variants._id": item.variantId },
                    { $inc: { "variants.$.stock": item.quantity } }
                );
                item.itemStatus = "cancelled";
            }
        }
    }

    if(newStatus =="delivered"){
        order.items.forEach((item=>{
            if(item.itemStatus=="active"){
                item.itemStatus="delivered";
            }
        }));
        if(!paymentStatus){
            order.paymentStatus="paid";
        }
    }
    order.orderStatus=newStatus;
    if(paymentStatus){
        order.paymentStatus=paymentStatus;
    }
    await order.save();
    return order;
}

export const handleReturnRequest=async(orderId,itemId,action)=>{
    if (!["approved", "rejected"].includes(action)) {
        throw new Error("Action must be approved or rejected");
    }

    const order=await orderModel.findById(orderId);
    if(!order)throw new Error("Order not found");
    
    const item=order.items.id(itemId);
    if(!item)throw new Error("Item not found");

    if(item.returnStatus!="requested"){
        throw new Error("No pending return reqest for this item");
    }

    if(action =="approved"){
        await productModel.updateOne(
            { _id: item.productId, "variants._id": item.variantId },
            { $inc: { "variants.$.stock": item.quantity } }
        );

        if(order.paymentStatus=="paid"){
            const refundAmount = item.itemTotal-order.pricing.shipping;
            await walletModel.findOneAndUpdate(
                { userId: order.userId },
                { $inc: { balance: refundAmount },
                    $push: {
                        transactions: {
                            type: "credit",
                            amount: refundAmount,
                            description: `Refund for returned item: ${item.productName}`,
                            orderId: order._id
                        }
                    }
                },
                { upsert: true, new: true }
            );
        }

        item.itemStatus="returned";
        item.returnStatus="approved";
        
        const allDone=order.items.every(i=>i.itemStatus=="returned"||i.itemStatus=="cancelled");
        if(allDone)order.orderStatus="returned"

    }else{
        item.returnStatus="rejected";
    }

    const anyPending = order.items.some(i => i.returnStatus === "requested");
    if (!anyPending) order.returnRequested = false;

    await order.save();
    return order;
}