const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { requireLogin } = require('../middleware/auth');
const { isValidPakistaniPhone, isValidEmail } = require('../utils/validators');
const User = require('../models/User');
const Post = require('../models/Post');

// View profile with stats
router.get('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const totalPosts = await Post.countDocuments({ postedBy: req.session.userId });
    const openPosts = await Post.countDocuments({ postedBy: req.session.userId, resolved: false });
    const resolvedPosts = await Post.countDocuments({ postedBy: req.session.userId, resolved: true });

    res.render('profile', { user, totalPosts, openPosts, resolvedPosts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading profile');
  }
});

// Update profile info
router.post('/update', requireLogin, async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).send('Invalid email format');
    }
    if (!isValidPakistaniPhone(phone)) {
      return res.status(400).send('Phone must be an 11-digit Pakistani number starting with 03');
    }

    await User.findByIdAndUpdate(req.session.userId, { username, email, phone });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile — username or email may already be taken');
  }
});

// Change password
router.post('/change-password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.session.userId);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).send('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error changing password');
  }
});

module.exports = router;