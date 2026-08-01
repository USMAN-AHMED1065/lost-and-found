const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

// Dashboard with stats
router.get('/', requireAdmin, async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalItems = await Post.countDocuments();
  const bannedUsers = await User.countDocuments({ isBanned: true });
  const reportedPosts = await Post.find({ reportCount: { $gt: 0 } })
    .populate('postedBy', 'username email')
    .sort({ reportCount: -1 });

  res.render('admin/dashboard', {
    totalUsers, totalItems, bannedUsers, reportedPosts
  });
});

// View all users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.render('admin/users', { users });
});

// Ban a user for a set duration
router.post('/users/:id/ban', requireAdmin, async (req, res) => {
  const { days } = req.body;
  const banDurationMs = parseInt(days) * 24 * 60 * 60 * 1000;

  const user = await User.findById(req.params.id);
  user.isBanned = true;
  user.banExpiresAt = new Date(Date.now() + banDurationMs);
  await user.save();

  // Delete their posts
  await Post.deleteMany({ postedBy: user._id });

  res.redirect('/admin/users');
});

// Manual unban
router.post('/users/:id/unban', requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isBanned = false;
  user.banExpiresAt = null;
  await user.save();
  res.redirect('/admin/users');
});

// Delete any post
router.post('/posts/:id/delete', requireAdmin, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

module.exports = router;