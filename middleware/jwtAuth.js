const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("Authorization:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      authenticated: false,
      message: "No token"
    });
  }

  const token = authHeader.substring(7);

  console.log("Token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded:", decoded);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT ERROR:", err);

    return res.status(401).json({
      authenticated: false,
      message: err.message
    });
  }
};

module.exports = authenticate;