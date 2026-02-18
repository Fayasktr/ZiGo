import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";

// ═══════════════════════════════════════════════════
// PART A — Define the Google Strategy
// This callback runs AFTER Google verifies the user
// ═══════════════════════════════════════════════════
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"  
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId:profile.id });
        let email= profile.emails[0].value;
        if (user) {
            user.isVerified = true;
            await user.save();
        }else{
          user=await User.findOne({email:email});
          if(user){
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }else{
            user = await User.create({
            userName: profile.displayName,      
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value,   
            googleId: profile.id              
           });
          }
        }
        return done(null, user);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ═══════════════════════════════════════════════════
// PART B — serializeUser
// Called ONCE at login. Decides what to store in the session cookie.
// We only store the user's MongoDB _id (a tiny 24-character string).
// ═══════════════════════════════════════════════════
passport.serializeUser((user, done) => {
  done(null, user.id);
});


// ═══════════════════════════════════════════════════
// PART C — deserializeUser
// Called on EVERY request where a session exists.
// Takes the _id from the cookie, queries MongoDB,
// and puts the full user document into req.user.
// ═══════════════════════════════════════════════════

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;