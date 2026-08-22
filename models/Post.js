const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  location: { type: String },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportCount: { type: Number, default: 0 },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resolved: { type: Boolean, default: false },
  verificationQuestion: { type: String, default: '' },
  claims: [{
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    answer: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});


postSchema.index({ createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ postedBy: 1 });

module.exports = mongoose.model('Post', postSchema);