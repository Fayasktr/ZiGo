import asynchandler from 'express-async-handler';
import * as serviceOfProductAndCategory from '../../services/admin/categoryAndProductService.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';
import sharp from "sharp";
import { json } from 'express';

export const getCategory = asynchandler(async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        if (page < 1) page = 1;
        const search = req.query.search || "";
        const limit = 10;
        const { category, totalCountOfCategory } = await serviceOfProductAndCategory.categoryData(page, limit, search);
        const totalPages = Math.ceil(totalCountOfCategory / limit);
        if (page > totalPages) {
            return res.redirect(`/admin/category?page=${totalPages}`)
        }
        res.render("admin/categories", { category, totalCount: totalCountOfCategory, currentPage: page, totalPages, limit, search });
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
        await serviceOfProductAndCategory.updateCategory(categoryData);
        res.status(200).json({ success: true, message: "updated category" });
    } catch (error) {
        res.status(400).json({ success: false, messge: error.message });
    }
})

//product controllers
export const productPage = asynchandler(async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let search = req.query.search || "";
        let limit = 10;
        let { products, totalCountOfProducts } = await serviceOfProductAndCategory.productPage(page, limit, search);
        let totalPages = Math.ceil(totalCountOfProducts / limit)
        // console.log("products detailse:-", products)
        res.render("admin/products", {
            products,
            totalCount: totalCountOfProducts,
            currentPage: page,
            totalPages,
            limit,
            search
        });
    } catch (error) {
        console.log(error)
        req.flash("error", error.message);
        res.redirect("/admin/dashbord");
    }
})

export const addProductPage = asynchandler(async (req, res) => {
    try {
        const categoryList = await serviceOfProductAndCategory.addProductPage();
        res.render("admin/addEditProduct", { category: categoryList });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/dashboard");
    }
})

export const listAndUnlistProduct = asynchandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const isListed = req.params.isListed == "true";
        console.log(isListed)
        const update = await serviceOfProductAndCategory.listAndUnlistProduct(productId, isListed);
        console.log(update.isListed)
        const list = update.isListed == true ? "listed" : "unlisted";
        res.status(200).json({ success: true, message: `product ${list}` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export const addProduct = asynchandler(async (req, res) => {
    try {
        const mainImageUrls = [];
        const variantsImageUrls = {}
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const webpBuffer = await sharp(file.buffer).webp().toBuffer();
                const url = await uploadToCloudinary(webpBuffer, 'ZiGo_products_images');

                if (file.fieldname == "images") {
                    mainImageUrls.push(url);
                } else if (file.fieldname.startsWith("variant_")) {
                    if (!variantsImageUrls[file.fieldname]) {
                        variantsImageUrls[file.fieldname] = [];
                    }
                    variantsImageUrls[file.fieldname].push(url);
                }
            }
        }
        let variantsArray = [];
        if (req.body.variantsData && req.body.variantsData != "[]") {
            variantsArray = JSON.parse(req.body.variantsData);
        }
        let formatedVariants = variantsArray.map((variant, index) => {
            let variantImagesToUpload = variantsImageUrls[`variant_${index}_images`] || [];
            return {
                price: Number(variant.price),
                stock: Number(variant.stock),
                attributes: variant.attributes || {},
                images: variantImagesToUpload,
                isListed: true
            }
        })
        if (formatedVariants.length === 0) {
            throw new Error("at least 1 variant is required.");
        }
        if (mainImageUrls.length < 3) {
            throw new Error("minimum 3 main images are required.");
        }

        const finalProductDataToUpload = {
            productName: req.body.name,
            description: req.body.description,
            brand: req.body.brand,
            category: req.body.category,
            basePrice: formatedVariants[0].price,
            isListed: req.body.isListed == "on" ? true : false,
            images: mainImageUrls,
            variants: formatedVariants
        }
        console.log("final product to upload:-", finalProductDataToUpload);
        const uploaded = await serviceOfProductAndCategory.addProduct(finalProductDataToUpload);
        console.log("data after upload:", uploaded);
        res.status(200).json({ success: true, message: "product uploaded" });
    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message });
    }
})

export const editProductPage = asynchandler(async (req, res) => {
    try {
        const productId = req.params.id;
        console.log("product Id: ", productId);
        const { productForEdit, category } = await serviceOfProductAndCategory.editProductPage(productId);
        console.log(productForEdit)
        res.render("admin/addEditProduct", { product: productForEdit, isEdit: true, category });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/admin/products");
    }
})

export const updateProduct = asynchandler(async (req, res) => {
    try {
        const update = await serviceOfProductAndCategory.updateProduct(req.body);
        res.status(200).json({ success: true, message: "product update success.." })
    } catch (error) {
        res.status(400).json({ success: false, message: "product update failed" });
    }
})