import categoryModel from "../../models/categoryModel.js";

export const categoryData = async()=>await categoryModel.find({});

export const addNewCategory=async(categoryData)=>{
    const oldCategory= await categoryModel.find({categoryName:categoryData.categoryName});
    if(oldCategory.length>0){
        throw new Error ("this category already added");
    }
    if(!categoryData.categoryName || !categoryData.iconClass || !categoryData.description ){
        throw new Error("Must need all elements");
    }
    return await categoryModel.create({
        categoryName:categoryData.categoryName,
        iconClass:categoryData.iconClass,
        description:categoryData.description,
        isListed:categoryData.isListed === "on"?true:false
    })
}

