const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['beneficiary', 'phone', 'iban'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary'
  },
  recipientPhone: String,
  recipientIBAN: String,
  recipientName: String,
  
  transferType: {
    type: String,
    enum: ['local', 'international'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'SAR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  fees: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  purpose: String,
  description: String,
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  paymentMethod: {
    type: String,
    enum: ['card', 'account', 'wallet'],
    required: true
  },
  
  verification: {
    otp: String,
    otpExpiresAt: Date,
    otpVerified: Boolean,
    otpVerifiedAt: Date
  },
  
  reference: {
    type: String,
    unique: true,
    default: () => 'TRF' + Date.now() + Math.random().toString(36).substr(2, 9)
  },
  
  externalReference: String,
  bankReference: String,
  
  failureReason: String,
  failureDetails: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

transferSchema.index({ senderId: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ createdAt: -1 });
transferSchema.index({ reference: 1 });

module.exports = mongoose.model('Transfer', transferSchema);
