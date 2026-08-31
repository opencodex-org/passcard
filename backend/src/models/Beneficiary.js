const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  beneficiaryName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['iban', 'account_number'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    // Stored encrypted
  },
  iban: {
    type: String,
    // Stored encrypted
  },
  bankName: String,
  bankCode: String,
  swiftCode: String,
  country: String,
  phoneNumber: String,
  email: String,
  transferType: {
    type: String,
    enum: ['local', 'international'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'verified', 'pending'],
    default: 'pending'
  },
  verificationOTP: {
    code: String,
    expiresAt: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

beneficiarySchema.index({ userId: 1 });
beneficiarySchema.index({ status: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
