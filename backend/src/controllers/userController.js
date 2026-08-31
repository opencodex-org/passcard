const User = require('../models/User');
const Account = require('../models/Account');

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        nationalId: user.nationalId,
        accountType: user.accountType,
        accountLevel: user.accountLevel,
        verificationStatus: user.verificationStatus,
        status: user.status,
        language: user.language,
        currency: user.currency,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, language, currency, notificationPreferences } = req.body;
    const userId = req.user.userId;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (language) updateData.language = language;
    if (currency) updateData.currency = currency;
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Account Info
exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.userId });

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    res.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
        status: account.status,
        accountLimits: account.accountLimits,
        dailySpent: account.dailySpent,
        monthlySpent: account.monthlySpent
      }
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Notification Preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications, smsNotifications, pushNotifications } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        notificationPreferences: {
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
          smsNotifications: smsNotifications !== undefined ? smsNotifications : true,
          pushNotifications: pushNotifications !== undefined ? pushNotifications : true
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: user.notificationPreferences,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Security Settings
exports.getSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled,
        biometricEnabled: user.biometricEnabled,
        deviceTokens: user.deviceTokens,
        lastLoginAt: user.lastLoginAt,
        lastLoginIP: user.lastLoginIP
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Enable Two Factor
exports.enableTwoFactor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { twoFactorEnabled: true },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Two-factor authentication enabled'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Disable Two Factor
exports.disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { twoFactorEnabled: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Two-factor authentication disabled'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
