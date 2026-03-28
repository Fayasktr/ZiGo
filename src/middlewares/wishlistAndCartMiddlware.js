const isThereUser = async (req, res, next) => {
    if (req.session.user || req.user) {
        next()
    } else {
        let actionFor=req.originalUrl.split("/")[2]
        return res.status(401).json({ success: false, message: `${actionFor} need to login` })
    }
}


const wishlistAndCart = { isThereUser }
export default wishlistAndCart;
