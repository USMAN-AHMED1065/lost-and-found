const User = require('../models/User');

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  const user = await User.findById(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).send('Admin access only');
  }
  next();
}

module.exports = { requireLogin, requireAdmin };