import cartModel from "../models/cartModel.js";
import categoryModle from "../models/categoryModel.js";
import wishlistModel from "../models/wishlistModel.js";

export const checkCategoryListed = async(req,res,next)=>{
    try {
        const categoryName= req.categoryName;
        const currentStatus=await categoryModle.findOne({categoryName});
        
        if(!currentStatus||currentStatus.isListed == "false"){
            req.flash("this category not awailable");
            res.redirect("/ZiGo.com");
        }
        next()
    } catch (error) {
        req.flash("error",error.message);
        return res.redirect("/ZiGo.com");
    }
}

export const cartCount = async(req, res, next) => {
    try {
        const userId = req.session?.user?.id || req?.user?.id || "";
        if (userId) {
            const carts = await cartModel.find({ userId: userId });
            const wishlists = await wishlistModel.find({ userId });
            
            let cartCount = carts.reduce((acc, cart) => acc += (cart?.quantity || 0), 0);
            res.locals.cartCount = cartCount;
            res.locals.wishlistCount = wishlists.length;
        } else {
            res.locals.cartCount = 0; 
            res.locals.wishlistCount = 0;
        }
    } catch (error) {
        console.error("cartCount middleware error:", error.message);
        res.locals.cartCount = 0;
    }
    next(); 
}