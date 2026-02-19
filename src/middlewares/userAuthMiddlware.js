
const isLogin = (req, res, next) => {
    if (req.session.user || req.isAuthenticated()) {
        return res.redirect("/ZiGo.com");
    }
    next()
}

 const isLogout = (req,res,next) => {
    if(!req.session.user && !req.isAuthenticated()){
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

const preventCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, private, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

export default {isLogin, isLogout, isOtpPending, preventCache}