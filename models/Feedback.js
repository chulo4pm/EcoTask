// Feedback a volunteer or organizer sends to the admin ("Send feedback" in the account menu).
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['volunteer', 'organizer'], required: true },
  category: { type: String, enum: ['suggestion', 'bug', 'compliment', 'other'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  // Set when the admin marks it as read.
  readAt: { type: Date, default: null },
}, { timestamps: true });

feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
