import express from "express"
import * as userCntrl from "../controllers/userAuthCtrler.js"
import userAuth from "../middlewares/userAuthMiddlware.js"
const router = express.Router();

router.get("/", userCntrl.landingBeforeLogin)
router.get("/login",userAuth.isLogin, userCntrl.loginPage);
router.post("/login", userCntrl.login);
router.get("/logout", userAuth.isLogout, userCntrl.logOut)
router.get("/ZiGo.com", userAuth.isLogout, userCntrl.LoadHomePage);

router.route("/signUp")
.get(userAuth.isLogin, userCntrl.loadSignUp)
.post(userCntrl.signUp);

router.route("/verifyOtp")
.get(userAuth.isOtpPending, userCntrl.loadOtpPage)
.post(userCntrl.otpVerify)

router.get("/resendOtp", userCntrl.resendOtp);

const authRoute = router;

export default authRoute;