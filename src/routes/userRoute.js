import express from "express";
import * as userProfile from '../controllers/userProfileController.js';
import userAuth from '../middlewares/userAuthMiddlware.js';

const router = express.Router()

router.get("/user/profile", userAuth.isLogout, userProfile.showProfile);
router.get("/user/profile/edit", userAuth.isLogout, userProfile.loadEditProfile);
router.get("/user/addresses",userAuth.isLogout, userProfile.loadAddressPage)





export default router;