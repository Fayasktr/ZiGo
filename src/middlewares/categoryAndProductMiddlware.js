import cartModel from "../models/cartModel.js";
import categoryModle from "../models/categoryModel.js";

export const checkCategoryListed = async(req,res,next)=>{
    try {
        const categoryName= req.categoryName;
        const currentStatus=await categoryModle.findOne({categoryName});
        if(currentStatus.isListed == "false"){
            req.flash("this category not awailable");
            res.redirect("/ZiGo.com");
        }
        next()
    } catch (error) {
        req.flash("error",error.message);
    }
}

export const cartCount=async(req,res,next)=>{
    try {
        const userId=req.session?.user?.id||req?.user?.id||"";
        if(userId){
            const carts=await cartModel.find({userId:userId});
            let count=carts.reduce((acc,cart)=>acc+=cart?.quantity,0);
            console.log(`cart count: ${count}`);
            res.locals.cartCount=count||0;
        }
    } catch (error) {
        req.flash("error",error.message)
        res.redirect("/ZiGo.com")
    }
    next();
}