const bcrypt = require('bcryptjs');
const { updateUserPasswordAndFlag, getUserByUsername } = require('../services/databaseService');

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new passwords required.' });

    // req.user is set by auth middleware
    const username = req.user && req.user.username;
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect.' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    const ok = await updateUserPasswordAndFlag(username, hash, 0);
    if (!ok) return res.status(500).json({ message: 'Failed to update password.' });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { changePassword };
