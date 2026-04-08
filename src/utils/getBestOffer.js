import offerModel from "../models/offerModel.js";

export const getBestOffer = async ({ productId, categoryId, price }) => {
    const now = new Date();

    const productOffers = await offerModel.find({
        productId,
        isActive: true,
        expireAt: { $gt: now }
    });

    const categoryOffers = await offerModel.find({
        categoryId,
        isActive: true,
        expireAt: { $gt: now }
    });

    const getMaxDiscountOffer = (offers) => {
        let bestOffer = null;
        let maxDiscount = 0;

        for (let offer of offers) {
            let discount = 0;

            if (offer.discountType === "percentage") {
                discount = (price * offer.discountValue) / 100;
            } else {
                discount = offer.discountValue;
            }

            if (discount > maxDiscount) {
                maxDiscount = discount;
                bestOffer = offer;
            }
        }

        return { bestOffer, maxDiscount };
    };

    const productBest = getMaxDiscountOffer(productOffers);
    const categoryBest = getMaxDiscountOffer(categoryOffers);

    if (productBest.maxDiscount >= categoryBest.maxDiscount) {
        return {
            offer: productBest.bestOffer,
            discount: productBest.maxDiscount,
            appliedOn: "product"
        };
    } else {
        return {
            offer: categoryBest.bestOffer,
            discount: categoryBest.maxDiscount,
            appliedOn: "category"
        };
    }
};