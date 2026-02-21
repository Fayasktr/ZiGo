import express from "express"
import * as userCntrl from "../controllers/userAuthCtrler.js"
import userAuth from "../middlewares/userAuthMiddlware.js"
import passport from "../config/passport.js";
const router = express.Router();

router.get("/auth/google",
    passport.authenticate("google",
        { scope: ["profile", "email"] },
        // {prompt: 'select_account'}
    )
);

router.get("/auth/google/callback",passport.authenticate("google",{
    failureRedirect:"/login",
    keepSessionInfo:true
}),
    (req,res)=>{
        req.session.user = {
            id: req.user._id,
            userName: req.user.userName,
            email: req.user.email
        };
        res.redirect("/ZiGo.com");
    }
);


router.get("/", userCntrl.landingBeforeLogin)
router.get("/login", userAuth.preventCache, userAuth.isLogin, userCntrl.loginPage);
router.post("/login", userAuth.isLogin, userCntrl.login);
router.get("/logout", userAuth.isLogout, userCntrl.logOut)

router.route("/signUp")
    .get(userAuth.preventCache, userAuth.isLogin, userCntrl.loadSignUp)
    .post(userCntrl.signUp);

router.route("/verifyOtp")
    .get(userAuth.isOtpPending, userCntrl.loadOtpPage)
    .post(userCntrl.otpVerify)

router.get("/resendOtp", userCntrl.resendOtp);

router.get("/forgotPassword", userCntrl.forgotPasswordPage);
router.post("/forgotPassword", userCntrl.sendOTPForForgotPass);
router.get("/resetPassword", userAuth.isOtpPending);
router.post("/resetPassword", userAuth.isOtpPending, userCntrl.resetPassword);



const authRoute = router;

export default authRoute;