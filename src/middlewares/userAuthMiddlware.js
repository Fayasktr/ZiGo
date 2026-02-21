import User from "../models/userModel.js"
const isLogin = (req, res, next) => {
    console.log(req.user)
    if (req.session.user || req.isAuthenticated() ) {
        return res.redirect("/ZiGo.com");
    }
    next()
}

 const isLogout = (req,res,next) => {
    if(!req.session.user && !req.isAuthenticated() ){
        return res.redirect("/");
    }
    next()
}

const isOtpPending = (req,res,next)=>{

    if(req.session.otpUserId){
        return next();
    }
    res.redirect("signUp");
}
const checkBlocked = async (req, res, next) => {
    try {
        const userId = req.session?.user?.id || req.user?._id;

        if (!userId) return next();

        const checkUser = await User.findById(userId);

        if (!checkUser || checkUser.isBlocked) {
            req.session.user = null;

            if (req.logout) {
                return req.logout((err) => {
                    req.flash("error", "Your account is currently blocked by Admin.");
                    return res.redirect("/login");
                });
            }

            req.flash("error", "Your account is currently blocked by Admin.");
            return res.redirect("/login");
        }

        next();
    } catch (error) {
        console.log("Error in checkBlocked middleware:", error);
        next();
    }
}

const preventCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, private, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

export default { isLogin, isLogout, isOtpPending, preventCache, checkBlocked }