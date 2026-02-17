
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

export default {isLogin, isLogout, isOtpPending}