
const isLogin = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("ZiGo.com");
    }
    next()
}

 const isLogout = (req,res,next) => {
    if(!req.session.user){
        return res.redirect("/");
    }
    next()
}

export default {isLogin, isLogout}