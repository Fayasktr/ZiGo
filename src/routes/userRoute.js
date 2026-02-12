import express from "express";
import * as userProfile from '../controllers/userProfileController.js';
import userAuth from '../middlewares/userAuthMiddlware.js';

const router = express.Router()

router.use(userAuth.isLogout)

router.get("/user/profile", userProfile.showProfile);
router.get("/user/profile/edit", userProfile.loadEditProfile);


router.get("/user/addresses", userProfile.loadAddressPage)
router.get("/user/addresses/Edit", userProfile.loadEditAddressPage)       
router.get("/user/addresses/Edit/:id", userProfile.loadEditAddressPage)   
router.post("/user/addresses/Edit", userProfile.addEditAddress)           
router.post("/user/addresses/Edit/:id", userProfile.addEditAddress)      



export default router;