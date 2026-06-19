const jwt = require("jsonwebtoken");
const { getUserByUsername } = require("../services/databaseService");

const auth = async (req, res, next) => {
  try {
    console.log("========================================");
    console.log("AUTH MIDDLEWARE");
    console.log("Cookies:", req.cookies);

    const token = req.cookies?.token;

    console.log("Token:", token);

    if (!token) {
      console.log("No token received.");

      return res.status(401).json({
        message: "Authentication required."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded);

    const user = await getUserByUsername(decoded.username);

    if (!user) {
      console.log("User not found.");

      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/"
      });

      return res.status(401).json({
        message: "User not found."
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      must_change_password: !!user.must_change_password
    };

    console.log("Authenticated:", req.user.username);

    // Allow these routes even if password must be changed
    const allowedRoutes = [
      "/api/auth/change-password",
      "/api/auth/logout",
      "/api/auth/me"
    ];

    if (
      req.user.must_change_password &&
      !allowedRoutes.includes(req.originalUrl)
    ) {
      return res.status(403).json({
        message:
          "Password change required. Please change your password first."
      });
    }

    next();

  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });

    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only."
    });
  }

  next();
};

module.exports = {
  auth,
  adminOnly
};