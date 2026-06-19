const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getUserByUsername } = require("../services/databaseService");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log("========================================");
    console.log("LOGIN REQUEST");
    console.log("Username:", username);
    console.log("========================================");

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    const user = await getUserByUsername(username);

    if (!user) {
      console.log("User not found");
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    console.log("JWT created");

    res.cookie("token", token, COOKIE_OPTIONS);

    console.log("Cookie Sent");

    return res.status(200).json({
      username: user.username,
      role: user.role,
      must_change_password: !!user.must_change_password,
      mustChangePassword: !!user.must_change_password,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  return res.status(200).json({
    message: "Logged out successfully.",
  });
};

const me = async (req, res, next) => {
  try {
    return res.status(200).json({
      username: req.user.username,
      role: req.user.role,
      must_change_password: !!req.user.must_change_password,
      mustChangePassword: !!req.user.must_change_password,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout,
  me,
};