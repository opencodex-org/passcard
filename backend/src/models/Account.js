const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  accountNumber: {
    type: String,
    unique: true,
    default: () => 'ACC' + Date.now() + Math.random().toString(36).substr(2, 9)
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'SAR'
  },
  accountLimits: {
    dailyTransactionLimit: {
      type: Number,
      default: 50000
    },
    monthlyTransactionLimit: {
      type: Number,
      default: 500000
    },
    maxTransferAmount: {
      type: Number,
      default: 100000
    },
    maxBeneficiaries: {
      type: Number,
      default: 10
    }
  },
  dailySpent: {
    type: Number,
    default: 0
  },
  monthlySpent: {
    type: Number,
    default: 0
  },
  spentReset: {
    daily: Date,
    monthly: Date
  },
  parentInfo: {
    parentUserId: mongoose.Schema.Types.ObjectId,
    parentApprovalRequired: Boolean,
    allowanceAmount: Number,
    allowanceReset: Date
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'closed'],
    default: 'active'
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'kids'],
    default: 'checking'
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

accountSchema.index({ userId: 1 });
accountSchema.index({ accountNumber: 1 });

module.exports = mongoose.model('Account', accountSchema);
