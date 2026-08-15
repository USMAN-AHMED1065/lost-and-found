const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const Post = require('../models/Post');
const { requireLogin } = require('../middleware/auth');
const { isValidPakistaniPhone, isValidEmail } = require('../utils/validators');
const User = require('../models/User');
const { computeMatchScore } = require('../utils/matcher');

router.get('/new', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('new', { user });
});

// router.post('/', requireLogin, upload.single('image'), async (req, res) => {
//   try {
//     const { type, title, description, location, contactPhone, contactEmail } = req.body;

//     if (!isValidEmail(contactEmail)) {
//       return res.status(400).send('Invalid contact email format');
//     }
//     if (!isValidPakistaniPhone(contactPhone)) {
//       return res.status(400).send('Contact phone must be an 11-digit Pakistani number starting with 03');
//     }

//     const imageUrl = req.file ? req.file.path : null;
//     const newPost = new Post({
//       type, title, description, location, imageUrl,
//       contactPhone, contactEmail,
//       postedBy: req.session.userId
//     });
//     await newPost.save();
//     res.redirect('/posts');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error creating post');
//   }
// });

router.post('/', requireLogin, upload.single('image'), async (req, res) => {
  try {
    const { type, title, description, location, contactPhone, contactEmail, verificationQuestion } = req.body;

    if (!isValidEmail(contactEmail)) {
      return res.status(400).send('Invalid contact email format');
    }
    if (!isValidPakistaniPhone(contactPhone)) {
      return res.status(400).send('Contact phone must be an 11-digit Pakistani number starting with 03');
    }

    const imageUrl = req.file ? req.file.path : null;
    const newPost = new Post({
      type, title, description, location, imageUrl,
      contactPhone, contactEmail,
      verificationQuestion: type === 'found' ? (verificationQuestion || '') : '',
      postedBy: req.session.userId
    });
    await newPost.save();
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating post');
  }
});



router.get('/', async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};
    if (type === 'lost' || type === 'found') query.type = type;
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query).populate('postedBy', 'username email').sort({ createdAt: -1 });

    let savedIds = [];
    if (req.session.userId) {
      const currentUser = await User.findById(req.session.userId);
      savedIds = currentUser.savedPosts.map(id => id.toString());
    }

    res.render('posts', { posts, currentType: type || '', currentSearch: search || '', savedIds });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching posts');
  }
});

// View saved posts — MUST be above any /:id routes
router.get('/saved', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate({
      path: 'savedPosts',
      populate: { path: 'postedBy', select: 'username email' }
    });
    res.render('saved', { posts: user.savedPosts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching saved posts');
  }
});

// View my own claims (across all posts) — MUST be above /:id/claims
router.get('/claims/mine', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find({ 'claims.claimedBy': req.session.userId })
      .populate('postedBy', 'username email phone');

    const myClaims = [];
    posts.forEach(post => {
      post.claims.forEach(claim => {
        if (claim.claimedBy.toString() === req.session.userId) {
          myClaims.push({ post, claim });
        }
      });
    });

    res.render('my-claims', { myClaims });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading your claims');
  }
});

// Save a post
router.post('/:id/save', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const alreadySaved = user.savedPosts.some(id => id.toString() === req.params.id);

    if (!alreadySaved) {
      user.savedPosts.push(req.params.id);
      await user.save();
    }
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving post');
  }
});

// Unsave a post
router.post('/:id/unsave', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== req.params.id);
    await user.save();
    res.redirect('/posts/saved');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error unsaving post');
  }
});

// Mark a post as resolved or reopen it (owner only)
router.post('/:id/resolve', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.postedBy.toString() !== req.session.userId) {
      return res.status(403).send('Not authorized');
    }
    post.resolved = !post.resolved;
    await post.save();
    res.redirect(req.get('Referer') || '/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating post status');
  }
});

// Show matches for a specific post (lost <-> found)
router.get('/:id/matches', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const oppositeType = post.type === 'lost' ? 'found' : 'lost';
    const candidates = await Post.find({ type: oppositeType, resolved: false })
      .populate('postedBy', 'username email');

    const matches = candidates
      .map(candidate => ({
        post: candidate,
        score: computeMatchScore(post, candidate)
      }))
      .filter(match => match.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.render('matches', { sourcePost: post, matches });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error finding matches');
  }
});

// Show edit form (only if owner)
router.get('/:id/edit', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.postedBy.toString() !== req.session.userId) {
    return res.status(403).send('Not authorized');
  }
  res.render('edit', { post });
});

// Handle update
router.put('/:id', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.postedBy.toString() !== req.session.userId) {
    return res.status(403).send('Not authorized');
  }
  const { type, title, description, location } = req.body;
  post.type = type;
  post.title = title;
  post.description = description;
  post.location = location;
  await post.save();
  res.redirect('/posts');
});

// Report a post
router.post('/:id/report', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const alreadyReported = post.reportedBy.some(
      userId => userId.toString() === req.session.userId
    );

    if (alreadyReported) {
      return res.status(400).send('You already reported this post');
    }

    post.reportedBy.push(req.session.userId);
    post.reportCount += 1;
    await post.save();

    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reporting post');
  }
});

// Handle delete
router.delete('/:id', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.postedBy.toString() !== req.session.userId) {
    return res.status(403).send('Not authorized');
  }
  await post.deleteOne();
  res.redirect('/posts');
});

// Submit a claim on a found item
// router.post('/:id/claim', requireLogin, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).send('Post not found');
//     if (post.postedBy.toString() === req.session.userId) {
//       return res.status(400).send('You cannot claim your own post');
//     }

//     const { message } = req.body;
//     if (!message || message.trim() === '') {
//       return res.status(400).send('Please describe why this item is yours');
//     }

//     post.claims.push({ claimedBy: req.session.userId, message });
//     await post.save();
//     res.redirect('/posts');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error submitting claim');
//   }
// });

router.post('/:id/claim', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');
    if (post.postedBy.toString() === req.session.userId) {
      return res.status(400).send('You cannot claim your own post');
    }

    const alreadyClaimed = post.claims.some(
      c => c.claimedBy.toString() === req.session.userId
    );
    if (alreadyClaimed) {
      return res.status(400).send('You have already submitted a claim on this item');
    }

    const { message, answer } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).send('Please describe why this item is yours');
    }

    post.claims.push({
      claimedBy: req.session.userId,
      message,
      answer: answer || ''
    });
    await post.save();
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting claim');
  }
});










// View all claims on a post (owner only)
router.get('/:id/claims', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('claims.claimedBy', 'username email phone');
    if (!post || post.postedBy.toString() !== req.session.userId) {
      return res.status(403).send('Not authorized');
    }
    res.render('claims', { post });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading claims');
  }
});

// Approve a claim
router.post('/:id/claims/:claimId/approve', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.postedBy.toString() !== req.session.userId) {
      return res.status(403).send('Not authorized');
    }

    post.claims.forEach(claim => {
      if (claim._id.toString() === req.params.claimId) {
        claim.status = 'approved';
      } else if (claim.status === 'pending') {
        claim.status = 'rejected';
      }
    });
    post.resolved = true;
    await post.save();
    res.redirect(`/posts/${post._id}/claims`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error approving claim');
  }
});


// Reject all pending claims and reopen the post (no legitimate match found)
router.post('/:id/no-match', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.postedBy.toString() !== req.session.userId) {
      return res.status(403).send('Not authorized');
    }

    post.claims.forEach(claim => {
      if (claim.status === 'pending') claim.status = 'rejected';
    });
    post.resolved = false;
    await post.save();
    res.redirect(`/posts/${post._id}/claims`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reopening post');
  }
});

// Reject a single claim
router.post('/:id/claims/:claimId/reject', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.postedBy.toString() !== req.session.userId) {
      return res.status(403).send('Not authorized');
    }

    const claim = post.claims.id(req.params.claimId);
    if (claim) claim.status = 'rejected';
    await post.save();
    res.redirect(`/posts/${post._id}/claims`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error rejecting claim');
  }
});

module.exports = router;