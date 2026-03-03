import asynchandler from 'express-async-handler';
import * as serviceOfProductAndCategory from '../../services/admin/categoryAndProductService.js';

export const getCategory = asynchandler(async (req, res) => {
    try {
        let page =parseInt(req.query.page) || 1;
        if(page<1) page=1;
        const search =req.query.search ||"";
        const limit=10;
        const {category, totalCountOfCategory} = await serviceOfProductAndCategory.categoryData(page,limit,search);
        const totalPages= Math.ceil(totalCountOfCategory/limit);
        if(page>totalPages){
            return res.redirect(`/admin/category?page=${totalPages}`)
        }
        res.render("admin/categories", { category,totalCount:totalCountOfCategory,currentPage:page,totalPages,limit,search });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/dashborad");
    }
})

export const addCategoryPage = asynchandler(async (req, res) => {
    try {
        res.render("admin/addEditCategory");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/category");
    }
})

export const addNewCategory = asynchandler(async (req, res) => {
    try {
        const categoryData = req.body;
        await serviceOfProductAndCategory.addNewCategory(categoryData);
        res.status(200).json({ success: true, messege: "added new Category" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
})

export const listAndUnlistCategory = asynchandler(async (req, res) => {
    try {
        const categoryId = req.params.id;
        const action = req.params.action;
        const sevice = await serviceOfProductAndCategory.listAndUnlistCategory(categoryId, action)
        console.log("category id and action: " + categoryId, action)
        res.status(200).json({ success: true, message: "update successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });

    }
})

export const getEditCategoryPage = asynchandler(async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await serviceOfProductAndCategory.editCategoryPage(categoryId);
        res.render("admin/addEditCategory", { category, isEdit: true });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/category");
    }
})

export const updateCategory = asynchandler(async (req, res) => {
    try {
        const categoryData = req.body;
        console.log(categoryData._id)
        console.log(categoryData);
        await serviceOfProductAndCategory.updateCategory(categoryData);
        res.status(200).json({ success: true, message: "updated category" });
    } catch (error) {
        res.status(400).json({ success: false, messge: error.message });
    }
})

//product controllers
export const productPage =asynchandler( async(req,res)=>{
    try {
        let page=parseInt(req.query.page)||1;
        let search=req.query.search || "";
        let limit=10;
        let {products, totalCountOfProducts}=await serviceOfProductAndCategory.productPage(page,limit,search);
        let totalPages=Math.ceil(totalCountOfProducts/limit)
        res.render("admin/products",{
            products,
            totalCount:totalCountOfProducts,
            currentPage:page,
            totalPages,
            limit,
            search
        });
    } catch (error) {
        console.log(error)
        req.flash("error",error.message);
        res.redirect("/admin/dashbord");
    }
})