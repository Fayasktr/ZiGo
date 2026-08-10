# ZiGo E-Commerce Platform - Project Brief

**ZiGo** is a comprehensive, full-stack e-commerce web application built using modern JavaScript technologies. It follows the MVC (Model-View-Controller) architecture, separating data structures, business logic, and presentation.

## 🛠️ Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Frontend / Views:** EJS (Embedded JavaScript templating), HTML, CSS, Vanilla JS
- **Authentication:** Passport.js (Local Strategy & Google OAuth 2.0)
- **File Uploads & Storage:** Multer, Cloudinary, Sharp (Image Optimization)
- **Payments:** Razorpay Integration
- **Emails:** Nodemailer

---

## ✨ Highlighted / Advanced Features

### 1. Subdomain Routing (`vhost`)
A major architectural highlight of the project is the separation of the User and Admin applications using subdomains. The application uses the `vhost` package to route traffic directed to `admin.zigo.buzz` exclusively to the admin routes (`adminRoute.js`). This ensures a clean separation of concerns and enhances security by isolating the admin panel.

### 2. Comprehensive Image Processing Pipeline
The application doesn't just accept image uploads; it processes them for optimal web delivery. 
- **Cropper.js:** Used on the frontend to allow users (or admins) to crop images before they are uploaded.
- **Multer:** Handles the multipart/form-data parsing.
- **Sharp:** Processes and resizes images on the backend to ensure uniformity and reduce load times.
- **Cloudinary:** Stores the optimized images in the cloud, serving them via a CDN.

### 3. Reporting & Document Generation
The admin panel goes beyond basic CRUD operations by offering advanced reporting tools. 
- **ExcelJS:** Generates downloadable Excel spreadsheets for sales reports.
- **PDFKit & Puppeteer:** Generates dynamic, downloadable PDF documents (like Invoices and comprehensive Sales Reports) directly from the application data.
- **Chart.js:** Powers interactive visual dashboards for the admin to track sales, users, and order metrics.

---

## 📦 Detailed Feature Breakdown

### 👤 User Panel Features
*   **Authentication & Security:**
    *   Sign Up and Login using Email/Password (hashed with `bcrypt`).
    *   Social Login via Google (Passport OAuth20).
    *   OTP verification for account creation or password recovery, handled via `nodemailer`.
*   **Profile Management:**
    *   Manage personal details.
    *   Address Book: Users can add, edit, and manage multiple delivery addresses (`addressModel.js`).
*   **Shopping Experience:**
    *   **Product Browsing:** View categories, search products, and view detailed product pages.
    *   **Shopping Cart:** Add products to a cart, adjust quantities, and view cart totals dynamically (`cartModel.js`).
    *   **Wishlist:** Save products for later purchase (`wishlistModel.js`).
*   **Checkout & Orders:**
    *   Select delivery address and payment method (Razorpay for online payments, COD, Wallet).
    *   Apply Discount Coupons (`couponModel.js`).
    *   Order tracking and history (`orderModel.js`).
*   **Wallet System:**
    *   A virtual wallet for users to store funds, receive refunds, and make seamless purchases (`walletModel.js`).

### 🛡️ Admin Panel Features (Subdomain: admin.zigo.buzz)
*   **Dashboard:** High-level overview of sales, revenue, and active users visualized with charts.
*   **Product Management:** Full CRUD capabilities for products. Admins can upload multiple images, manage stock inventory, and set pricing.
*   **Category Management:** Organize products into categories (`categoryModel.js`).
*   **User Management:** View all registered users, block/unblock users for moderation (`userModel.js`).
*   **Order Management:** View all incoming orders, update order statuses (e.g., Processing, Shipped, Delivered), and process returns or cancellations.
*   **Marketing & Promotions:**
    *   **Offers:** Create specific promotional offers on categories or products (`offerModel.js`).
    *   **Coupons:** Generate discount codes with specific rules and expiration dates.
    *   **Banners:** Manage dynamic homepage banners to highlight sales or new arrivals (`bannerModel.js`).
*   **Reporting:** Generate and download detailed sales reports in Excel and PDF formats.

---

## 🏗️ Architecture & Code Structure
- **`src/app.js`**: The core entry point configuring middleware, sessions (`connect-mongo`), flash messages, passport initialization, and routing logic (including the `vhost` implementation).
- **`src/models/`**: Contains all Mongoose schemas defining the database structure (Users, Products, Orders, Cart, Wishlist, Coupons, Offers, Wallet, Banners, Address, OTP).
- **`src/controllers/`**: Contains the business logic, separated into admin controllers (e.g., `shopController.js`), user authentication (`userAuthCtrler.js`), and user profiles (`userProfileController.js`).
- **`src/routes/`**: Defines API endpoints and maps them to controllers.
- **`views/`**: EJS templates split into `admin/`, `user/`, and `partials/` for modular frontend development.
