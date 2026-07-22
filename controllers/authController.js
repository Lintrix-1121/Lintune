const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

class AuthController {
  constructor(User) {
    this.User = User;
    this.initializePassport();
  }

  initializePassport() {
    // Passport session setup
    passport.serializeUser((user, done) => {
      done(null, user.userId);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.User.findByPk(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    // Google OAuth Strategy configuration
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'] //scope
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile.displayName);
        
        // Check if user with the Google ID exists
        let user = await this.User.findOne({
          where: {
            providerId: profile.id,
            provider: 'google'
          }
        });

        if (user) {
          console.log('Existing Google user found:', user.email);
          return done(null, user);
        }

        // Check if user with the email exists
        user = await this.User.findOne({
          where: {
            email: profile.emails[0].value
          }
        });

        if (user) {
          console.log('Linking Google account to existing user:', user.email);
          // Link Google account to existing user
          user.provider = 'google';
          user.providerId = profile.id;
          await user.save();
          return done(null, user);
        }

        // Create new user with Google account
        console.log('Creating new user with Google account:', profile.emails[0].value);
        const newUser = await this.User.create({
          userName: profile.displayName,
          email: profile.emails[0].value,
          provider: 'google',
          providerId: profile.id
        });

        return done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }));
  }

  // Initiate Google OAuth with explicit scope
  googleAuth = (req, res, next) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  };

  // Google OAuth callback - handle both success and failure
  googleCallback = (req, res, next) => {
    passport.authenticate('google', {
      failureRedirect: '/auth/failure',
      session: true
    }, (err, user, info) => {
      if (err) {
        console.error('Google auth error:', err);
        return res.redirect('/auth/failure?error=' + encodeURIComponent(err.message));
      }

      if (!user) {
        return res.redirect('/auth/failure?error=Authentication failed');
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/auth/failure?error=' + encodeURIComponent(loginErr.message));
        }

        // Successful authentication - redirect to success page or frontend
        return res.redirect('/auth/success');
      });
    })(req, res, next);
  };

  // Success page
  authSuccess = (req, res) => {
    if (req.isAuthenticated()) {
          const frontendUrl = process.env.FRONTEND_URL;
          return res.redirect(`${frontendUrl}/oauth-callback?status=success`);
      
    } else {
      res.redirect('/auth/failure');
    }
  };

  // Failure page
  authFailure = (req, res) => {
    const error = req.query.error || 'Authentication failed';
      const frontendUrl = process.env.FRONTEND_URL;
      return res.redirect(`${frontendUrl}/oauth-callback?status=error&error=${encodeURIComponent(error)}`);
  };

  // Logout
  logout = (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: err.message
        });
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({
            success: false,
            message: 'Session destruction failed',
            error: sessionErr.message
          });
        }

        res.status(200).json({
          success: true,
          message: 'Logout successful'
        });
      });
    });
  };

  // Check authentication status
  getAuthStatus = (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json({
        authenticated: true,
        user: {
          userId: req.user.userId,
          userName: req.user.userName,
          email: req.user.email,
          provider: req.user.provider
        }
      });
    } else {
      res.status(200).json({
        authenticated: false,
        user: null
      });
    }
  };
}

module.exports = AuthController;




