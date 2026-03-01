import categoryModle from "../models/categoryModel";

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