import express from "express"
import * as userCntrl from "../controllers/userAuthCtrler.js"
import userAuth from "../middlewares/userAuthMiddlware.js"
const router = express.Router();

router.get("/", userCntrl.landingBeforeLogin)
router.get("/login", userCntrl.loginPage);
router.post("/login", userCntrl.login);
router.get("/logout", userAuth.isLogout, userCntrl.logOut)
router.get("/ZiGo.com", userAuth.isLogout, userCntrl.LoadHomePage);

router.get("/signUp", userAuth.isLogin, userCntrl.loadSignUp);

const userRoute = router;

export default userRoute;