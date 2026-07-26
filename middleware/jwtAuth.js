const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  let token = null;

  // Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // Optional: allow token in query string (useful only for OAuth redirects)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      authenticated: false,
      message: "Authentication token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);

    return res.status(401).json({
      authenticated: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authenticate;