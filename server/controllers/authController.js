const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getUserByUsername } = require('../services/databaseService');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log("========================================");
    console.log("LOGIN REQUEST");
    console.log("Username:", username);
    console.log("Password Entered:", password);
    console.log("========================================");

    if (!username || !password) {
      console.log("Username or password missing");

      return res.status(400).json({
        message: 'Username and password are required.'
      });
    }

    console.log("Searching user in database...");

    const user = await getUserByUsername(username);

    console.log("Database Result:");
    console.log(user);

    if (!user) {
      console.log("User NOT found.");

      return res.status(401).json({
        message: 'Invalid username or password.'
      });
    }

    console.log("Stored Username:", user.username);
    console.log("Stored Role:", user.role);
    console.log("Stored Password Hash:", user.password);

    console.log("Comparing password...");

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      console.log("Password does NOT match.");

      return res.status(401).json({
        message: 'Invalid username or password.'
      });
    }

    console.log("Password matched successfully.");

    const token = jwt.sign(
      {
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    console.log("JWT Token created successfully.");

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log("Login SUCCESS");
    console.log("========================================");

    return res.status(200).json({
      username: user.username,
      role: user.role,
      must_change_password: !!user.must_change_password,
      mustChangePassword: !!user.must_change_password
    });

  } catch (error) {
    console.error("LOGIN ERROR:");
    console.error(error);

    next(error);
  }
};

const logout = (req, res) => {
  console.log("Logout request");

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  return res.status(200).json({
    message: 'Logged out successfully.'
  });
};

const me = async (req, res, next) => {
  try {
    return res.status(200).json({
      username: req.user.username,
      role: req.user.role,
      must_change_password: !!req.user.must_change_password,
      mustChangePassword: !!req.user.must_change_password
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  login,
  logout,
  me
};