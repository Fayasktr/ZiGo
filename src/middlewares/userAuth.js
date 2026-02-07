
 const isLogin = (req,res, next)=>{
    if(req.session.user){
        return res.redirect("home");
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