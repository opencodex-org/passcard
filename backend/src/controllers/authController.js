const User = require('../models/User');
const Account = require('../models/Account');
const VerificationRequest = require('../models/VerificationRequest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Register User
exports.register = async (req, res) => {
  try {
    const { phoneNumber, email, fullName, nationalId, gender, accountType, password, parentPhone } = req.body;

    // Validate input
    if (!phoneNumber || !email || !fullName || !nationalId || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ phoneNumber }, { email }, { nationalId }]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = new User({
      phoneNumber,
      email,
      fullName,
      nationalId,
      gender: accountType !== 'kids' ? accountType : gender,
      accountType,
      password,
      parentPhone: accountType === 'kids' ? parentPhone : null,
      verificationStatus: 'pending'
    });

    await user.save();

    // Create account
    const account = new Account({
      userId: user._id,
      accountType: accountType === 'kids' ? 'kids' : 'checking',
      balance: 0
    });

    await account.save();

    // Create verification request
    const verificationRequest = new VerificationRequest({
      userId: user._id,
      phoneNumber,
      nationalId,
      fullName,
      accountType,
      holderName: `${fullName.toUpperCase()}`,
      parentPhone: accountType === 'kids' ? parentPhone : null,
      status: 'pending'
    });

    await verificationRequest.save();

    // Update user with verification request ID
    user.verificationRequestId = verificationRequest._id;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        verificationId: verificationRequest._id,
        accountType
      },
      message: 'Registration successful. Verification request submitted.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, error: 'Phone number and password required' });
    }

    // Find user and select password
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check verification status
    if (user.verificationStatus !== 'verified') {
      return res.status(403).json({ success: false, error: 'Account not verified yet' });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is ' + user.status });
    }

    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip;
    await user.save();

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          accountType: user.accountType,
          accountLevel: user.accountLevel
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify Phone OTP
exports.verifyPhone = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and code required' });
    }

    // TODO: Verify OTP from SMS service (Twilio)
    // For now, accept any 6-digit code
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Invalid code format' });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number required' });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await user.save();

    // TODO: Send reset code via SMS
    // For now, return success
    res.json({
      success: true,
      message: 'Password reset code sent to your phone'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { phoneNumber, resetCode, newPassword } = req.body;

    if (!phoneNumber || !resetCode || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      phoneNumber,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
