const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  transferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transfer'
  },
  type: {
    type: String,
    enum: ['transfer', 'purchase', 'payment', 'deposit', 'withdrawal', 'refund'],
    required: true
  },
  category: String,
  merchant: String,
  merchantCategory: String,
  description: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'SAR'
  },
  fees: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  balanceBefore: Number,
  balanceAfter: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed'
  },
  reference: {
    type: String,
    unique: true,
    default: () => 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9)
  },
  externalReference: String,
  location: {
    city: String,
    country: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  },
  deviceInfo: {
    deviceId: String,
    ipAddress: String,
    userAgent: String
  },
  receipt: {
    url: String,
    fileName: String
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

transactionSchema.index({ userId: 1 });
transactionSchema.index({ accountId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ reference: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
