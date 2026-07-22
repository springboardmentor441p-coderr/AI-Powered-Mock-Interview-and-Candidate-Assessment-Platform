const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function initPassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[passport] Google OAuth credentials missing, strategy not initialized.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Update oauth info if logging in with Google for the first time on an existing account
            if (!user.oauthProvider) {
              user.oauthProvider = 'google';
              user.oauthId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          // Create new user (default to candidate)
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            passwordHash: '', // No password for OAuth users
            oauthProvider: 'google',
            oauthId: profile.id,
            role: 'candidate',
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Serialize / deserialize (optional for JWT but good practice if sessions are used elsewhere)
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

module.exports = { initPassport };
