const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const Card = require('../models/Card');
const Transfer = require('../models/Transfer');
const AuditLog = require('../models/AuditLog');
const Account = require('../models/Account');

// Get Verification Requests (Admin)
exports.getVerificationRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const requests = await VerificationRequest.find({ status })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VerificationRequest.countDocuments({ status });

    res.json({
      success: true,
      data: requests,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve Verification Request
exports.approveVerification = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const verificationRequest = await VerificationRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes
      },
      { new: true }
    );

    if (!verificationRequest) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Update user verification status
    const user = await User.findByIdAndUpdate(
      verificationRequest.userId,
      {
        verificationStatus: 'verified',
        verificationDate: new Date()
      },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      adminId,
      action: 'verification_approved',
      targetUserId: verificationRequest.userId,
      targetType: 'verification',
      details: { verificationId: requestId },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: verificationRequest,
      message: 'Verification request approved'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject Verification Request
exports.rejectVerification = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason, details } = req.body;
    const adminId = req.user.userId;

    const verificationRequest = await VerificationRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        rejectionDetails: details
      },
      { new: true }
    );

    if (!verificationRequest) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Update user
    await User.findByIdAndUpdate(
      verificationRequest.userId,
      { verificationStatus: 'rejected' }
    );

    // Log action
    await AuditLog.create({
      adminId,
      action: 'verification_rejected',
      targetUserId: verificationRequest.userId,
      targetType: 'verification',
      details: { reason, verificationId: requestId },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: verificationRequest,
      message: 'Verification request rejected'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Users (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { status, accountType, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (accountType) filter.accountType = accountType;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Suspend User
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'suspended' },
      { new: true }
    );

    await AuditLog.create({
      adminId,
      action: 'user_suspended',
      targetUserId: userId,
      targetType: 'user',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, userId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.targetUserId = userId;

    const logs = await AuditLog.find(filter)
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
