const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_created',
      'user_updated',
      'user_deleted',
      'user_suspended',
      'user_verified',
      'card_approved',
      'card_rejected',
      'transfer_approved',
      'transfer_rejected',
      'verification_approved',
      'verification_rejected',
      'role_changed',
      'design_approved',
      'design_rejected'
    ]
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetId: String,
  targetType: {
    type: String,
    enum: ['user', 'card', 'transfer', 'verification', 'design'],
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ targetUserId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
