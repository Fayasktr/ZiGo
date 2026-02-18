import express from "express";
import * as userProfile from '../controllers/userProfileController.js';
import userAuth from '../middlewares/userAuthMiddlware.js';
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router()

router.use(userAuth.isLogout)

router.get("/user/profile", userProfile.showProfile);
router.get("/user/profile/edit", userProfile.loadEditProfile);


router.get("/user/addresses", userProfile.loadAddressPage)
router.get("/user/addresses/add", userProfile.loadAddAddressPage)  
router.post("/user/addresses/add",userProfile.addNewAddress)     
router.get("/user/addresses/Edit", userProfile.loadEditAddressPage);           
router.post("/user/addresses/Edit/:id", userProfile.addEditAddress)      

router.post("/user/addresses/:id/setDefault",userProfile.setDefault);


export default router;