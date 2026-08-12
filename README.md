# 🛒 ZiGo E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg?logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v5.x-000000.svg?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-MVC%20%7C%20Subdomain%20vhost-orange.svg)](#-architecture--subdomain-routing)
[![PWA](https://img.shields.io/badge/PWA-Supported-purple.svg)](public/manifest.json)

**ZiGo** is a full-stack, enterprise-grade E-Commerce Web Application engineered with **Node.js**, **Express.js**, **MongoDB**, and **EJS**. Built following the classic Model-View-Controller (MVC) architectural pattern, ZiGo delivers a seamless multi-vendor shopping experience alongside a powerful, isolated sub-domain administration portal.

---

## 📋 Table of Contents
- [✨ Key Architectural Highlights](#-key-architectural-highlights)
- [📦 Technology Stack](#-technology-stack)
- [💎 Feature Breakdown](#-feature-breakdown)
  - [👤 User Application](#-user-application)
  - [🛡️ Admin Portal](#️-admin-portal)
- [📁 Project Directory Structure](#-project-directory-structure)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [⚙️ Environment Variables](#️-environment-variables)
- [🌐 Local Subdomain Configuration (`vhost`)](#-local-subdomain-configuration-vhost)
- [📊 Database Models Schema](#-database-models-schema)
- [🛡️ Security & Best Practices Audit](#️-security--best-practices-audit)
- [📄 License](#-license)

---

## ✨ Key Architectural Highlights

### 1. 🌐 Isolated Subdomain Architecture (`vhost`)
ZiGo separates administrative operations from the main storefront at the DNS level using Express `vhost`. Traffic directed to `admin.zigo.buzz` (or local equivalent) is routed exclusively to the admin controller and view pipelines, isolating administrative privileges and keeping routes clean.

```
                    ┌─────────────────────────┐
                    │      Incoming Web       │
                    │        Requests         │
                    └────────────┬────────────┘
                                 │
                     ┌───────────┴───────────┐
                     │ Express vhost Router  │
                     └─────┬───────────┬─────┘
                           │           │
           Host: admin.zigo.buzz   Host: zigo.buzz / localhost
                           │           │
            ┌──────────────▼──┐     ┌──▼──────────────┐
            │ Admin Subdomain │     │  User Main App  │
            │   Controller    │     │   Storefront    │
            └─────────────────┘     └─────────────────┘
```

### 2. 🖼️ Advanced Image Processing Pipeline
Image handling is optimized for web performance across all device viewports:
- **Client-Side Cropping:** Integrated with **Cropper.js** to allow admins to interactively crop and frame product and banner images before uploading.
- **Multipart Parsing:** Handled efficiently via **Multer**.
- **Backend Optimization:** Compressed, resized, and reformatted on-the-fly using **Sharp**.
- **Cloud Delivery:** Uploaded directly to **Cloudinary** for global CDN delivery.

### 3. 📄 Automated Document & PDF Generation
- **Sales Analytics Reports:** Admins can export date-filtered sales metrics into **Excel spreadsheets** via **ExcelJS**.
- **PDF Invoices & Summaries:** Programmatically rendered dynamic PDF invoices and sales reports utilizing **PDFKit** and **Puppeteer**.

### 4. 💳 Multi-Channel Payment & Virtual Wallet System
- **Razorpay Integration:** Full online checkout flow with signature verification and automated retry handling for failed attempts.
- **Integrated User Wallet:** Built-in virtual wallet for seamless refunds on order cancellations/returns, as well as direct checkout payments.
- **Cash on Delivery (COD):** Integrated with customizable eligibility thresholds.

---

## 📦 Technology Stack

| Domain | Technologies / Libraries |
| :--- | :--- |
| **Core Runtime** | [Node.js](https://nodejs.org/), ES6+ Modules |
| **Web Framework** | [Express.js v5](https://expressjs.com/) |
| **Database & ODM** | [MongoDB](https://www.mongodb.com/), [Mongoose v9](https://mongoosejs.com/) |
| **Templating Engine** | [EJS](https://ejs.co/) (Embedded JavaScript) |
| **Authentication** | [Passport.js](http://www.passportjs.org/) (Local Strategy & Google OAuth 2.0), `bcrypt` |
| **Media Processing** | [Multer](https://github.com/expressjs/multer), [Sharp](https://sharp.pixelplumbing.com/), [Cloudinary](https://cloudinary.com/), [Cropper.js](https://fengyuanchen.github.io/cropperjs/) |
| **Payments** | [Razorpay SDK](https://razorpay.com/docs/api/) |
| **Documents & Reporting** | [PDFKit](https://pdfkit.org/), [Puppeteer](https://pptr.dev/), [ExcelJS](https://github.com/exceljs/exceljs) |
| **Messaging & Mail** | [Nodemailer](https://nodemailer.com/) (OTP verification & email updates) |
| **Subdomain Routing** | [vhost](https://github.com/expressjs/vhost) |
| **Frontend Utilities** | HTML5, Vanilla CSS3, JavaScript, [Chart.js](https://www.chartjs.org/) |

---

## 💎 Feature Breakdown

### 👤 User Application
- **Authentication & Security:**
  - Standard Email/Password registration with bcrypt hashing.
  - One-Time Password (OTP) account verification via email.
  - Password recovery via OTP verification.
  - One-click Google Social Login via OAuth 2.0.
  - Session persistence backed by MongoDB (`connect-mongo`).
- **Storefront & Catalog Browsing:**
  - Dynamic product catalog with real-time category filtering, search, and sorting.
  - Detailed product view pages featuring multi-image zoom and stock availability indicators.
  - Instant product wishlist toggling.
- **Shopping Cart & Checkout:**
  - Interactive cart management (quantity adjustment, dynamic price calculation).
  - Discount coupon application engine with minimum purchase and usage limits.
  - Multi-address selection (Add/Edit/Delete/Set Default).
  - Multiple payment options (Razorpay Payment Gateway, COD, User Wallet).
  - Payment failure detection with instant inline retry flow.
- **User Dashboard & Profile:**
  - Personal profile editor and profile image upload.
  - Comprehensive order history with real-time status tracking (Pending, Processing, Shipped, Delivered, Cancelled, Returned).
  - Individual item cancellation and return requests.
  - PDF Invoice generation and download for completed orders.
  - Virtual Wallet transaction history log.

### 🛡️ Admin Portal (`admin.zigo.buzz`)
- **Executive Dashboard:** Visualized revenue metrics, total orders, active users, and category-wise sales using interactive Chart.js charts.
- **Product Management:** Full CRUD operations, variant management, multi-image upload with cropping, inventory stock control, and category assignment.
- **Category Management:** Create, edit, list, and unlist product categories.
- **Order Moderation:** View incoming customer orders, update dispatch/delivery statuses, approve/reject customer return requests, and process automated wallet refunds.
- **Coupon & Offer Engine:**
  - Generate promotional coupons with fixed or percentage discounts, expiration dates, and minimum spend rules.
  - Create category and product-level promotional offers.
- **Banner Management:** Dynamic homepage slideshow/banner control.
- **User Management:** View registered users, track activity, and block/unblock accounts.
- **Export & Reporting:** Generate downloadable PDF and Excel sales reports filtered by custom date ranges, weekly, or monthly intervals.

---

## 📁 Project Directory Structure

```
ZiGo/
├── public/                     # Static assets (CSS, JS, Images, PWA Service Worker, Manifest)
│   ├── manifest.json
│   └── service-worker.js
├── src/                        # Main application source code
│   ├── app.js                  # Express application setup, middlewares, and routing
│   ├── config/                 # Services configuration (Database, Passport, Cloudinary, Razorpay)
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── passport.js
│   │   ├── razorpay.js
│   │   └── session.js
│   ├── controllers/            # Controller logic (Admin, Auth, Profile, Shop)
│   │   ├── admin/
│   │   ├── shopController.js
│   │   ├── userAuthCtrler.js
│   │   └── userProfileController.js
│   ├── middlewares/            # Custom Express middlewares (Auth, Upload, Cart/Wishlist)
│   ├── models/                 # Mongoose Data Models (User, Product, Order, Wallet, etc.)
│   ├── routes/                 # Express Router modules
│   │   ├── admin/
│   │   │   ├── adminRoute.js
│   │   │   └── productAndCatogoryRoute.js
│   │   ├── authRoute.js
│   │   ├── shopRoute.js
│   │   └── userRoute.js
│   ├── services/               # Business logic & Database service layer
│   │   ├── admin/
│   │   ├── paymentService.js
│   │   ├── shopService.js
│   │   ├── uAddressService.js
│   │   └── uLoginService.js
│   └── utils/                  # Helper utilities (Nodemailer, Password Hashing, OTP Generator)
├── views/                      # EJS templates
│   ├── admin/                  # Admin portal EJS views
│   ├── partials/               # Reusable view components (Header, Footer, Navigation)
│   └── user/                   # User storefront EJS views
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore specifications
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Application entry point
└── zigo_project_brief.md       # Initial project brief document
```

---

## 🚀 Quick Start & Installation

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster URI)
- Cloudinary Account (for image hosting)
- Razorpay Merchant Account (for test API keys)

### 1. Clone the Repository
```bash
git clone https://github.com/Fayasktr/ZiGo.git
cd ZiGo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in your configuration details in `.env` (refer to the [Environment Variables](#️-environment-variables) section).

### 4. Run the Application

#### Development Mode (with hot-reloading via Nodemon):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```
The application will launch on `http://localhost:9925` (or your configured `PORT`).

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following structure:

```env
# Server Configuration
PORT=9925
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ZiGo?retryWrites=true&w=majority

# Session Security
SESSION_SECRET_KEY=your_super_secret_session_key

# Nodemailer Email Credentials (for OTPs)
EMAIL=your-email@gmail.com
APP_PASSWORD=your-gmail-app-password

# Cloudinary Storage Configuration
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Razorpay Payment Gateway Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🌐 Local Subdomain Configuration (`vhost`)

ZiGo uses Express `vhost` to serve the Admin Panel at `admin.zigo.buzz`. To test the admin panel locally:

1. Open your local OS `hosts` file with Administrator/Sudo privileges:
   - **Windows:** `C:\Windows\System32\drivers\etc\hosts`
   - **Linux / macOS:** `/etc/hosts`
2. Add the following entry:
   ```text
   127.0.0.1   admin.zigo.buzz
   127.0.0.1   zigo.buzz
   ```
3. Save the file. You can now access:
   - Storefront: `http://zigo.buzz:9925`
   - Admin Panel: `http://admin.zigo.buzz:9925`

---

## 📊 Database Models Schema

| Model File | Description | Key Fields / References |
| :--- | :--- | :--- |
| [`userModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/userModel.js) | Stores user identity, status, and Google OAuth IDs | `userName`, `email`, `password`, `googleId`, `isBlocked`, `profileImage` |
| [`productModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/productModel.js) | Represents catalog products | `productName`, `category`, `regularPrice`, `salePrice`, `stock`, `images` |
| [`categoryModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/categoryModel.js) | Categories for product classification | `name`, `description`, `isListed` |
| [`orderModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/orderModel.js) | Master order transactions | `orderId`, `user`, `orderedItems`, `totalPrice`, `paymentMethod`, `status` |
| [`cartModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/cartModel.js) | Active shopping cart items per user | `userId`, `items` (`productId`, `quantity`, `price`) |
| [`wishlistModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/wishlistModel.js) | Saved favorite products | `userId`, `products` |
| [`walletModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/walletModel.js) | Virtual wallet balance & history | `userId`, `balance`, `transactions` (`amount`, `type`, `description`) |
| [`addressModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/addressModel.js) | User shipping address book | `userId`, `addresses` (`name`, `city`, `phone`, `isDefault`) |
| [`couponModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/couponModel.js) | Discount promotional codes | `code`, `discountPercentage`, `minimumPrice`, `expireOn` |
| [`offerModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/offerModel.js) | Product and Category offers | `title`, `discountPercentage`, `offerType`, `targetId` |
| [`bannerModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/bannerModel.js) | Dynamic storefront banners | `title`, `image`, `link`, `startDate`, `endDate` |
| [`otpModel.js`](file:///c:/Users/FAYAS/Desktop/ZiGo/src/models/otpModel.js) | Temporary OTP cache with TTL | `email`, `otp`, `createdAt` (Auto-expires) |

---

## 🛡️ Security & Best Practices Audit

> [!IMPORTANT]
> **Recommended Production Enhancements:**
> 1. **Secret Rotation:** Always ensure `.env` is excluded from version control (`.gitignore`) and rotate exposed production keys regularly.
> 2. **HTTP Headers:** Integrate `helmet` middleware in [src/app.js](file:///c:/Users/FAYAS/Desktop/ZiGo/src/app.js) to enforce secure headers.
> 3. **Production Process Management:** In production containers (Docker, Render, AWS), launch using `node server.js` or `PM2` rather than `nodemon`.

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.
