import User from "../models/userModel.js"
const isLogin = (req, res, next) => {
    if (req.session.user || req.isAuthenticated()) {
        return res.redirect("/ZiGo.com");
    }
    next()
}

const isLogout = (req, res, next) => {
    if (!req.session.user && !req.isAuthenticated()) {
        return res.redirect("/");
    }
    next()
}

const isOtpPending = (req, res, next) => {

    if (req.session.otpUserId) {
        return next();
    }
    res.redirect("signUp");
}

const checkBlocked = async (req, res, next) => {
    try {
        const userId = req.session?.user?.id || req.user?._id;
        if (!userId) return next();

        const checkUser = await User.findById(userId);
        if (checkUser && checkUser.isBlocked) {
            console.log(`User ${userId} is blocked.`);

            const msg = "Your account has been blocked by Admin.";

            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                req.session.user = null;
                return res.status(403).json({
                    success: false,
                    message: msg,
                    redirect: "/login"
                });
            }

            req.session.user = null;
            req.flash("error", msg);

            if (req.session.admin) {
                console.log("Admin session detected, preserving session but cleared User data.");
                res.locals.error = [msg];
                return next();
            }

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