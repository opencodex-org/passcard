const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    // Stored encrypted
  },
  cardNumberMasked: {
    type: String,
    required: true
  },
  cardType: {
    type: String,
    enum: ['primary', 'additional', 'virtual'],
    required: true
  },
  cardBrand: {
    type: String,
    enum: ['visa', 'mastercard', 'mada'],
    required: true
  },
  holderName: {
    type: String,
    required: true,
    uppercase: true
  },
  expiryDate: {
    type: String, // MM/YY format
    required: true
  },
  cvv: {
    type: String,
    select: false,
    // Stored encrypted
  },
  design: {
    type: String,
    enum: ['blue', 'black', 'silver', 'gold', 'platinum', 'custom'],
    default: 'blue'
  },
  customImage: String, // URL or base64
  status: {
    type: String,
    enum: ['active', 'frozen', 'blocked', 'expired'],
    default: 'active'
  },
  limits: {
    dailyLimit: {
      type: Number,
      default: 5000
    },
    monthlyLimit: {
      type: Number,
      default: 50000
    },
    transactionLimit: {
      type: Number,
      default: 10000
    }
  },
  features: {
    contactlessEnabled: {
      type: Boolean,
      default: true
    },
    internationalEnabled: {
      type: Boolean,
      default: true
    },
    madaEnabled: {
      type: Boolean,
      default: false
    },
    ecommerceEnabled: {
      type: Boolean,
      default: true
    }
  },
  applepayEnabled: {
    type: Boolean,
    default: false
  },
  googlepayEnabled: {
    type: Boolean,
    default: false
  },
  issueDate: Date,
  designApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: mongoose.Schema.Types.ObjectId,
  approvalDate: Date,
  approvalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

cardSchema.index({ userId: 1 });
cardSchema.index({ accountId: 1 });
cardSchema.index({ status: 1 });
cardSchema.index({ cardType: 1 });

module.exports = mongoose.model('Card', cardSchema);
