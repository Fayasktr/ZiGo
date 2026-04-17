const isThereUser = async (req, res, next) => {
  if (req.session.user || req.user) {
    next();
  } else {
    const isAjax =
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'));
    if (isAjax) {
      let actionFor = req.originalUrl.split('/')[2];
      return res
        .status(401)
        .json({ success: false, message: `${actionFor} need to login` });
    } else {
      return res.redirect('/login');
    }
  }
};

const wishlistAndCart = { isThereUser };
export default wishlistAndCart;
