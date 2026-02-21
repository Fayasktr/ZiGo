import express from "express";
import * as userProfile from '../controllers/userProfileController.js';
import * as userCntrl from '../controllers/userAuthCtrler.js';
import userAuth from '../middlewares/userAuthMiddlware.js';
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router()
router.use(userAuth.preventCache);
router.use("/user",userAuth.isLogout)

router.get("/ZiGo.com", userAuth.isLogout,userAuth.checkBlocked, userCntrl.LoadHomePage);


router.get("/user/profile", userProfile.showProfile);
router.get("/user/profile/edit", userProfile.loadEditProfile);
router.put("/user/profile/edit", upload.single('profileImage'), userProfile.editProfile);
router.post("/user/otp", userProfile.otpCheck);

router.get("/user/addresses", userProfile.loadAddressPage)
router.get("/user/addresses/add", userProfile.loadAddAddressPage)
router.post("/user/addresses/add", userProfile.addNewAddress)

router.get("/user/addresses/:id/edit", userProfile.loadEditAddressPage);
router.put("/user/addresses/:id/edit", userProfile.EditAddress);

router.get("/user/addresses/:id/setDefault", userProfile.setDefault);
router.post("/user/addresses/:id/delete", userProfile.deleteAddress);


export default router;