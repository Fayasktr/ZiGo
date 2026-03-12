let arr=[1,2,3,4,5,6,7,8,9,10];

for(let i=0;i<arr.length;i++){
    let isPrime=true;
    if(arr[i]==1)isPrime=false;
    for(let j=2;j<=arr[i]/2;j++){
        if(arr[i]%j==0){
            isPrime=false;
        }
    }
    if(isPrime){
        for(let k=i;k<arr.length;k++){
            arr[k]=arr[k+1];
        }
        arr.length =arr.length-1;
        i--;
    }
}
console.log(arr)





export const updateProduct = asynchandler(async (req, res) => {
    try {
        const { id, name, description, brand, category, isListed, existingMainImages, variantsData } = req.body;

        // 1. Handle Main Images
        let mainImagesToKeep = [];
        if (existingMainImages) {
            mainImagesToKeep = Array.isArray(existingMainImages) ? existingMainImages : [existingMainImages];
        }

        const newMainImagesUrls = [];
        const variantsNewImageUrls = {};

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const webpBuffer = await sharp(file.buffer).webp().toBuffer();
                const url = await uploadToCloudinary(webpBuffer, 'ZiGo_products_images');

                if (file.fieldname === "images") {
                    newMainImagesUrls.push(url);
                } else if (file.fieldname.startsWith("variant_")) {
                    if (!variantsNewImageUrls[file.fieldname]) {
                        variantsNewImageUrls[file.fieldname] = [];
                    }
                    variantsNewImageUrls[file.fieldname].push(url);
                }
            }
        }

        const finalMainImages = [...mainImagesToKeep, ...newMainImagesUrls];

        // 2. Handle Variants
        let parsedVariants = [];
        if (variantsData) {
            parsedVariants = JSON.parse(variantsData);
        }

        const finalVariants = parsedVariants.map((variant, index) => {
            const existingVariantImages = variant.images || []; // Note: changed from existingImages to images to match addEditProduct.ejs
            const newVariantImages = variantsNewImageUrls[`variant_${index}_images`] || [];

            return {
                price: Number(variant.price),
                stock: Number(variant.stock),
                attributes: variant.attributes || {},
                images: [...existingVariantImages, ...newVariantImages],
                isListed: variant.isListed !== undefined ? variant.isListed : true
            };
        });

        if (finalMainImages.length < 3) {
            throw new Error("minimum 3 main images are required.");
        }
        if (finalVariants.length === 0) {
            throw new Error("at least 1 variant is required.");
        }

        const updateData = {
            id,
            productName: name,
            description,
            brand,
            category,
            basePrice: finalVariants[0].price,
            isListed: isListed === "on",
            images: finalMainImages,
            variants: finalVariants
        };

        await serviceOfProductAndCategory.updateProductService(updateData);
        res.status(200).json({ success: true, message: "product update success.." })
    } catch (error) {
console.error("Update Product Error:", error);
        res.status(400).json({ success: false, message: error.message || "product update failed" });
    }
})

//service

export const updateProductService = async (productData) => {
    const { id, ...updateFields } = productData;
    const updatedProduct = await productModel.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
    );
    if (!updatedProduct) {
        throw new Error("Product not found");
    }
    return updatedProduct;
}