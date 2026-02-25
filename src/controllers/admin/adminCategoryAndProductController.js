import asynchandler from 'express-async-handler';
import * as serviceOfProductAndCategory from '../../services/admin/categoryAndProductService.js';

export const getCategory =asynchandler(async(req,res)=>{
    try {
        console.log("reached fn successfully!!!");
        const categories=await serviceOfProductAndCategory.categoryData();
        res.render("admin/categories",{categories});
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/admin/dashborad");
    }
})

export const addCategoryPage =asynchandler( async (req,res)=>{
    try {
        res.render("admin/addEditCategory");
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/admin/category");
    }
})

export const addNewCategory = asynchandler (async (req,res)=>{
    try {
        const categoryData= req.body;
        const newCategory =await serviceOfProductAndCategory.addNewCategory(categoryData);
        res.redirect("/admin/category");
    } catch (error) {
        req.flash("error",error.message);
        res.redirect("/admin/category");
    }
})