import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";

export const categoryData = async (page,limit,search) => {
    const skip =(page-1) *limit;
    const category=await categoryModel.find({categoryName:{$regex:search,$options:"i"}})
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit);
    const totalCountOfCategory =await categoryModel.countDocuments();
    return {category, totalCountOfCategory};
}


export const addNewCategory = async (categoryData) => {
    const oldCategory = await categoryModel.find({ categoryName: categoryData.categoryName });
    if (oldCategory.length > 0) {
        throw new Error("this category already added");
    }
    if (!categoryData.categoryName || !categoryData.iconClass) {
        throw new Error("Must need all elements");
    }
    console.log(categoryData);

    return await categoryModel.create({
        categoryName: categoryData.categoryName,
        iconClass: categoryData.iconClass,
        description: categoryData.description,
        variantAttributes:categoryData.variantAttributes,
        isListed: categoryData.isListed === "on" ? true : false
    })
}

export const listAndUnlistCategory = async (categoryId, action) => {
    const act = action === "Unblock" ? true : false;
    await categoryModel.findOneAndUpdate({ _id: categoryId }, { $set: { isListed: act } });
}

export const editCategoryPage = async (categoryId) => {
    const categoryData = await categoryModel.findById(categoryId);
    if (!categoryData) {
        throw new Error("category not found");
    }
    return categoryData;
}

export const updateCategory = async (categoryData) => {
    const category = await categoryModel.findOneAndUpdate(
        { _id: categoryData._id },
        { 
            categoryName: categoryData.categoryName,
            iconClass: categoryData.iconClass,
            description: categoryData.description,
            isListed: categoryData.isListed === "on" ? true : false
        }
    );
    if(!category){
        throw new Error("there is no category on this id");
    }
}

//product service
export const productPage = async(page,limit,search)=>{
    let skip=(page-1)*limit;
    const products=await productModel.find({productName:{$regex:search,$options:"i"}})
        .populate("category")
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);
    let totalCountOfProducts=await productModel.countDocuments();
    return {products,totalCountOfProducts}
}

export const addProductPage=async()=>{
    return await categoryModel.find()
}

export const listAndUnlistProduct =async(productId,isListed)=>{
    const update=await productModel.findByIdAndUpdate(productId,
        {isListed},
        {new:true}
    );
    return update;
}

export const addProduct=async(productData)=>{
    const existProduct=await productModel.find({productName:productData.productName});
    console.log("exist",existProduct)
    if(existProduct.length>0){
        throw new Error("this product name alread exist");
    }
    return await productModel.create(productData);
}

export const editProductPage=async(productId)=>{
    const productForEdit=await productModel.findById(productId);
    const category=await categoryModel.find()
    return {productForEdit,category};
}

export const updateProduct=async(reqData)=>{
    console.log("req data:",reqData);
}