const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

class AuthController {
  constructor(User) {
    this.User = User;
    this.initializePassport();
  }

  initializePassport() {
    // Google OAuth Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("Google profile:", profile.displayName);

            // Check if Google account already exists
            let user = await this.User.findOne({
              where: {
                provider: "google",
                providerId: profile.id,
              },
            });

            if (user) {
              console.log("Existing Google user:", user.email);
              return done(null, user);
            }

            // Check if email already exists
            user = await this.User.findOne({
              where: {
                email: profile.emails[0].value,
              },
            });

            if (user) {
              console.log("Linking Google account:", user.email);

              user.provider = "google";
              user.providerId = profile.id;
              await user.save();

              return done(null, user);
            }

            // Create new Google user
            console.log("Creating new Google user");

            user = await this.User.create({
              userName: profile.displayName,
              email: profile.emails[0].value,
              provider: "google",
              providerId: profile.id,
            });

            return done(null, user);
          } catch (err) {
            console.error(err);
            return done(err, null);
          }
        }
      )
    );
  }

  // Redirect user to Google

  googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
    session: false,
  });

  //Google callback
  googleCallback = (req, res, next) => {
    passport.authenticate(
      "google",
      {
        failureRedirect: "/auth/failure",
        session: false,
      },
      async (err, user) => {
        if (err) {
          console.error("Google authentication error:", err);

          return res.redirect(
            `${process.env.FRONTEND_URL}/oauth-callback?status=error&error=${encodeURIComponent(
              err.message
            )}`
          );
        }

        if (!user) {
          return res.redirect(
            `${process.env.FRONTEND_URL}/oauth-callback?status=error&error=Authentication failed`
          );
        }

        // Generate JWT
        const token = jwt.sign(
          {
            userId: user.userId,
            email: user.email,
            provider: user.provider,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

        return res.redirect(
          `${process.env.FRONTEND_URL}/oauth-callback?status=success&token=${encodeURIComponent(
            token
          )}`
        );
      }
    )(req, res, next);
  };


  //Authentication failure

  authFailure = (req, res) => {
    const error = req.query.error || "Authentication failed";

    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback?status=error&error=${encodeURIComponent(
        error
      )}`
    );
  };

  
  // Logout
  // JWT logout handled client-side by deleting the token.
  logout = (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  };


  getAuthStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        authenticated: false,
        message: "req.user missing"
      });
    }

    const dbUser = await this.User.findByPk(req.user.userId);
    console.log("DB user =", dbUser);  // full user from DB

    if (!dbUser) {
      return res.status(401).json({
        authenticated: false,
        message: "User not found",
        user: null,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        userId: dbUser.userId,          // ✅ from DB
        userName: dbUser.userName,
        email: dbUser.email,
        provider: dbUser.provider,
        providerId: dbUser.providerId,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
        profilePicture: dbUser.profilePicture,
        lastLoginAt: dbUser.lastLoginAt,   // ✅ correct casing
        isActive: dbUser.isActive,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      authenticated: false,
      message: "Unable to verify authentication",
    });
  }
};
}

module.exports = AuthController;