import express from "express"
import * as userCntrl from "../controllers/userAuthentication.js"
import userAuth from "../middlewares/userAuth.js"
const router = express.Router();

router.get("/", userCntrl.landingBeforeLogin)
router.get("/login", userCntrl.loginPage);
router.post("/login",userAuth.isLogout,userCntrl.login);
router.get("/logout",userAuth.isLogin,userCntrl.logOut)

const userRoute = router;

export default userRoute;