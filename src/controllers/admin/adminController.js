import asynchandler from 'express-async-handler';
import * as adminService from '../../services/admin/adminService.js';
import sharp from 'sharp';
import { uploadToCloudinary } from '../../config/cloudinary.js';

export const adminLoginPage = asynchandler(async (req, res) => {
  res.render('admin/adminLogin');
});

export const adminDashboard = asynchandler(async (req, res) => {
  res.render('admin/adminDashboard');
});
export const adminAccess = asynchandler(async (req, res) => {
  try {
    const { adminMail, password } = req.body;
    const checkAdminAuth = await adminService.accessToAdmin(
      adminMail,
      password
    );
    req.session.admin = {
      adminMail: adminMail,
      adminName: checkAdminAuth.adminMail,
    };
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error', error);
    res.redirect('/admin');
  }
});

export const adminLogout = asynchandler(async (req, res) => {
  req.session.admin = null;
  res.redirect('/admin');
});

export const userManagementPage = asynchandler(async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1;
    const search = req.query.search || '';
    const limit = 10;
    const { users, totalCountOfUsers } = await adminService.usersList(
      page,
      limit,
      search
    );
    const totalPages = Math.ceil(totalCountOfUsers / limit);
    if (totalCountOfUsers == 0) {
      return res.render('admin/userManagement', {
        users,
        totalCount: totalCountOfUsers,
        currentPage: page,
        totalPages,
        limit,
        search,
      });
    }

    if (page > totalPages) {
      return res.redirect(`/admin/users?page=${totalPages}`);
    }
    res.render('admin/userManagement', {
      users,
      totalCount: totalCountOfUsers,
      currentPage: page,
      totalPages,
      limit,
      search,
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

export const blockAndUnblock = asynchandler(async (req, res) => {
  try {
    const action = req.params.action;
    const userId = req.params.id;
    if (action !== 'block' && action !== 'unblock') {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid action. Must be 'block' or 'unblock'.",
        });
    }
    await adminService.blockOrUnblock(userId, action);

    return res
      .status(200)
      .json({ success: true, message: 'update Successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export const adminOrderList = asynchandler(async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    const { orders, totalCount, returnRequested } =
      await adminService.adminOrderList(page, limit, search, status);
    const totalPages = Math.ceil(totalCount / limit);
    res.render('admin/orders', {
      orders,
      totalCount,
      currentPage: page,
      totalPages,
      limit,
      search,
      status,
      returnRequested,
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

export const orderDetailsePage = asynchandler(async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderData = await adminService.orderDetailsePage(orderId);
    res.render('admin/orderDetails', { order: orderData });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/orders');
  }
});

export const orderStatusUpdate = asynchandler(async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, paymentStatus } = req.body;
    console.log(
      `order id and status: ${status}, pay:${paymentStatus}, orderId:${orderId}`
    );
    const order = await adminService.orderStatusUpdate(
      orderId,
      status,
      paymentStatus
    );
    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export const handleReturnRequest = asynchandler(async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { action } = req.body;
    await adminService.handleReturnRequest(orderId, itemId, action);
    res.status(200).json({
      success: true,
      message: `Return ${action} successfully`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const couponPage = asynchandler(async (req, res) => {
  try {
    const { search = '', page = 1 } = req.query;
    const limit = 12;
    console.log(`search :${search}, ${page}`);
    const [couponData, totalCount] = await adminService.couponPage(
      search,
      page
    );
    const totalPages = Math.ceil(totalCount / limit);
    res.render('admin/coupons', {
      coupons: couponData,
      totalCount,
      totalPages,
      currentPage: page,
      limit,
      search,
    });
  } catch (error) {
    console.log(error);
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

export const addEditCouponPage = asynchandler(async (req, res) => {
  try {
    const couponId = req.query?.couponId || '';
    let coupon = null;
    if (couponId) {
      coupon = await adminService.editCouponPage(couponId);
    }
    res.render('admin/addEditCoupon', { coupon });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/coupons');
  }
});

export const addCoupon = asynchandler(async (req, res) => {
  try {
    console.log('reached coupon controll');
    const couponData = req.body;
    await adminService.addCoupon(couponData);

    res.status(200).json({ success: true, message: 'new coupon added' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const editCoupon = asynchandler(async (req, res) => {
  try {
    const couponId = req.params.id;
    const couponData = req.body;
    await adminService.editCoupon(couponId, couponData);
    res.json({ success: true, message: 'coupon upddated successfully' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export const deleteCoupon = asynchandler(async (req, res) => {
  try {
    const couponId = req.params.id;
    if (!couponId) throw new Error('missing couponId');
    await adminService.deleteCoupon(couponId);
    res.status(200).json({ success: true, message: 'coupon deleted' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export const offersPage = asynchandler(async (req, res) => {
  try {
    const { search = '', page = 1, type = 'category' } = req.query;
    const limit = 12;

    const { offerData, totalCount } = await adminService.getOffersPage(
      search,
      page,
      type
    );
    const totalPages = Math.ceil(totalCount / limit);

    res.render('admin/offers', {
      offers: offerData,
      totalCount,
      totalPages,
      currentPage: Number(page),
      limit,
      search,
      offerType: type,
    });
  } catch (error) {
    console.error('Offers page error:', error);
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

export const addEditOfferPage = asynchandler(async (req, res) => {
  try {
    const offerId = req.query?.offerId || '';

    const { offer, categories, products } =
      await adminService.getAddEditOfferPageData(offerId);

    res.render('admin/addEditOffer', {
      offer,
      categories,
      products,
    });
  } catch (error) {
    console.error('Add/Edit offer page error:', error);
    req.flash('error', error.message);
    res.redirect('/admin/offers');
  }
});

export const addOffer = asynchandler(async (req, res) => {
  try {
    const offerData = req.body;
    await adminService.addOffer(offerData);

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
    });
  } catch (error) {
    console.error('Add offer error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export const editOffer = asynchandler(async (req, res) => {
  try {
    const offerId = req.params.id;
    const offerData = req.body;

    await adminService.editOffer(offerId, offerData);

    res.json({
      success: true,
      message: 'Offer updated successfully',
    });
  } catch (error) {
    console.error('Edit offer error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export const deleteOffer = asynchandler(async (req, res) => {
  try {
    const offerId = req.params.id;

    if (!offerId) {
      throw new Error('Offer ID is required');
    }
    await adminService.deleteOffer(offerId);
    res.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export const bannerPage = asynchandler(async (req, res) => {
  try {
    console.log('reached banner ctrl');
    const banners = await adminService.bannerPage();
    res.render('admin/banners', { banners });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

export const addEditBannerPage = asynchandler(async (req, res) => {
  try {
    const id = req.query.id;
    let banner = null;
    if (id) {
      banner = await adminService.getBannerForEdit(id);
    }
    res.render('admin/addEditBanner', { banner });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/banners');
  }
});

export const addBanner = asynchandler(async (req, res) => {
  try {
    const bannerData = req.body;
    if (!req.file) {
      throw new Error('Banner image is required');
    }

    const webpBuffer = await sharp(req.file.buffer).webp().toBuffer();
    const imageUrl = await uploadToCloudinary(webpBuffer, 'ZiGo_banners');
    bannerData.image = imageUrl;

    await adminService.addBanner(bannerData);
    res
      .status(200)
      .json({ success: true, message: 'Banner added successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const editBanner = asynchandler(async (req, res) => {
  try {
    const id = req.params.id;
    const bannerData = req.body;

    if (req.file) {
      const webpBuffer = await sharp(req.file.buffer).webp().toBuffer();
      const imageUrl = await uploadToCloudinary(webpBuffer, 'ZiGo_banners');
      bannerData.image = imageUrl;
    }

    await adminService.editBanner(id, bannerData);
    res
      .status(200)
      .json({ success: true, message: 'Banner updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const deleteBanner = asynchandler(async (req, res) => {
  try {
    const { id } = req.body;
    await adminService.deleteBanner(id);
    res
      .status(200)
      .json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const bannerStatus = asynchandler(async (req, res) => {
  try {
    console.log('change status');
    const bannerId = req.params.id;
    if (!bannerId) {
      throw new Error('bannerId is missing');
    }
    const banner = await adminService.bannerStatus(bannerId);
    res.status(200).json({ success: true, message: 'status updated' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});
