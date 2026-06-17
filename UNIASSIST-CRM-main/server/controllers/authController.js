const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getUserByUsername } = require('../services/databaseService');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ message: 'Invalid username or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({ username: user.username, role: user.role, must_change_password: !!user.must_change_password, mustChangePassword: !!user.must_change_password });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.status(200).json({ message: 'Logged out successfully.' });
};

const me = async (req, res, next) => {
  try {
    // req.user is populated by the auth middleware
    return res.status(200).json({
      username: req.user.username,
      role: req.user.role,
      must_change_password: !!req.user.must_change_password,
      mustChangePassword: !!req.user.must_change_password
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  me
};

