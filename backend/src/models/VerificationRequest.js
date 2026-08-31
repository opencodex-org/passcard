const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  nationalId: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['male', 'female', 'kids'],
    required: true
  },
  holderName: {
    type: String,
    required: true
  },
  parentPhone: String,
  parentApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  parentApprovedAt: Date,
  documents: [{
    type: {
      type: String,
      enum: ['national_id_front', 'national_id_back', 'passport', 'selfie'],
      required: true
    },
    url: String,
    fileName: String,
    uploadedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationNotes: String
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'needs_info'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,
  rejectionDetails: String,
  adminNotes: String,
  requestedInfoFrom: Date,
  resubmissionDeadline: Date,
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  flags: [String],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

verificationRequestSchema.index({ userId: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
