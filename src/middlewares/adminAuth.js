const redirectIfLoggedIn=(req,res,next)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashbord")
    }
    next()
}

const protectAdmin=(req,res,next)=>{
    if(!req.session.admin){
        return res.redirect("/admin");
    }
    next()
}
const preventCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, private, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};
export default {redirectIfLoggedIn,protectAdmin,preventCache}