const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobDescription: {
    type: String,
    default: ''
  },
  matchScore: {
    type: Number,
    default: 0
  },
  predictedTitle: {
    type: String,
    default: 'General Developer'
  },
  predictedExperienceLevel: {
    type: String,
    default: 'Mid-Level'
  },
  matchedSkills: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [String],
    default: []
  },
  otherSkills: {
    type: [String],
    default: []
  },
  suggestions: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  parsedCv: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  originalFile: {
    filename: { type: String, default: '' },
    contentType: { type: String, default: '' },
    data: { type: Buffer, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // 7 days in seconds (604800)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('History', historySchema);
