import wishlistModel from "../models/wishlistModel.js"
const isThereUser = async (req, res, next) => {
    if (req.session.user || req.user) {
        next()
    } else {
        return res.status(401).json({ success: false, message: "wishlist need to login" })
    }
}

const wishlistAndCart = { isThereUser }
export default wishlistAndCart;