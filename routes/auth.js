const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { isValidPakistaniPhone, isValidEmail } = require('../utils/validators');

// Show signup form
router.get('/signup', (req, res) => {
  res.render('signup');
});

// Handle signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).send('Invalid email format');
    }
    if (!isValidPakistaniPhone(phone)) {
      return res.status(400).send('Phone must be an 11-digit Pakistani number starting with 03 (e.g. 03001234567)');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, phone });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error signing up — username or email may already exist');
  }
});

// Show login form
router.get('/login', (req, res) => {
  res.render('login');
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid email or password');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send('Invalid email or password');

    // Auto-expire ban if time has passed
    if (user.isBanned && user.banExpiresAt && user.banExpiresAt < new Date()) {
      user.isBanned = false;
      user.banExpiresAt = null;
      await user.save();
    }

    if (user.isBanned) {
      return res.status(403).send(`Your account is banned until ${user.banExpiresAt.toLocaleString()}`);
    }

    req.session.userId = user._id;
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;