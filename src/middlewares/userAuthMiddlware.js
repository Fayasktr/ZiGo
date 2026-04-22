import User from '../models/userModel.js';
const isLogin = (req, res, next) => {
  if (req.session.user || req.isAuthenticated()) {
    return res.redirect('/ZiGo.com');
  }
  next();
};

const isLogout = (req, res, next) => {
  if (!req.session.user && !req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
};

const isOtpPending = (req, res, next) => {
  if (req.session.otpUserId) {
    return next();
  }
  res.redirect('/signUp');
};

const checkBlocked = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id || req.user?._id;
    if (!userId) return next();

    const checkUser = await User.findById(userId);
    if (checkUser && checkUser.isBlocked) {
      console.log(`User ${userId} is blocked.`);

      const msg = 'Your account has been blocked by Admin.';

      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        delete req.session.user;
        return res.status(403).json({
          success: false,
          message: msg,
          redirect: '/login',
        });
      }

      req.flash('error', msg);

      req.session.user = undefined;
      delete req.session.user;

      if (req.session.passport) {
        req.session.passport = undefined;
        delete req.session.passport;
      }

      return req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        return res.redirect('/login');
      });
    }

    next();
  } catch (error) {
    console.error('CheckBlocked Error:', error);
    next();
  }
};

const preventCache = (req, res, next) => {
  res.set(
    'Cache-Control',
    'no-store, private, no-cache, must-revalidate, max-age=0'
  );
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

export default { isLogin, isLogout, isOtpPending, preventCache, checkBlocked };
