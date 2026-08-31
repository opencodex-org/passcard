const Transfer = require('../models/Transfer');
const Beneficiary = require('../models/Beneficiary');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get Beneficiaries
exports.getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user.userId, status: 'active' })
      .select('-accountNumber');

    res.json({
      success: true,
      data: beneficiaries,
      count: beneficiaries.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add Beneficiary
exports.addBeneficiary = async (req, res) => {
  try {
    const { beneficiaryName, accountNumber, iban, bankName, transferType, country } = req.body;
    const userId = req.user.userId;

    if (!beneficiaryName || !accountNumber) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const beneficiary = new Beneficiary({
      userId,
      beneficiaryName,
      accountNumber, // Should be encrypted
      iban,
      bankName,
      transferType: transferType || 'local',
      country,
      accountType: iban ? 'iban' : 'account_number',
      status: 'pending',
      isVerified: false
    });

    await beneficiary.save();

    res.status(201).json({
      success: true,
      data: {
        id: beneficiary._id,
        beneficiaryName: beneficiary.beneficiaryName,
        status: beneficiary.status
      },
      message: 'Beneficiary added. Awaiting verification.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Local Transfer
exports.localTransfer = async (req, res) => {
  try {
    const { beneficiaryId, amount, description } = req.body;
    const senderId = req.user.userId;

    if (!beneficiaryId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transfer data' });
    }

    // Get sender account
    const senderAccount = await Account.findOne({ userId: senderId });
    if (!senderAccount) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    if (senderAccount.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Create transfer
    const transfer = new Transfer({
      senderId,
      recipientId: beneficiaryId,
      recipientType: 'beneficiary',
      transferType: 'local',
      amount,
      currency: senderAccount.currency,
      totalAmount: amount,
      description,
      paymentMethod: 'account',
      status: 'pending',
      fees: 0
    });

    await transfer.save();

    res.status(201).json({
      success: true,
      data: {
        id: transfer._id,
        reference: transfer.reference,
        amount: transfer.amount,
        status: transfer.status,
        message: 'Please verify with OTP to complete transfer'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Confirm Transfer
exports.confirmTransfer = async (req, res) => {
  try {
    const { transferId, otp } = req.body;
    const userId = req.user.userId;

    if (!transferId || !otp) {
      return res.status(400).json({ success: false, error: 'Transfer ID and OTP required' });
    }

    const transfer = await Transfer.findOne({ _id: transferId, senderId: userId });
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer not found' });
    }

    // Verify OTP (simplified)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP format' });
    }

    // Process transfer
    const senderAccount = await Account.findOne({ userId });
    
    if (senderAccount.balance < transfer.totalAmount) {
      transfer.status = 'failed';
      transfer.failureReason = 'Insufficient balance';
      await transfer.save();
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Deduct from sender
    senderAccount.balance -= transfer.totalAmount;
    senderAccount.dailySpent += transfer.totalAmount;
    await senderAccount.save();

    // Mark transfer as completed
    transfer.status = 'completed';
    transfer.completedAt = new Date();
    await transfer.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      accountId: senderAccount._id,
      transferId: transfer._id,
      type: 'transfer',
      amount: transfer.amount,
      currency: transfer.currency,
      totalAmount: transfer.totalAmount,
      fees: transfer.fees,
      balanceBefore: senderAccount.balance + transfer.totalAmount,
      balanceAfter: senderAccount.balance,
      status: 'completed',
      reference: transfer.reference
    });

    await transaction.save();

    res.json({
      success: true,
      data: {
        reference: transfer.reference,
        amount: transfer.amount,
        status: transfer.status,
        completedAt: transfer.completedAt
      },
      message: 'Transfer completed successfully'
    });
  } catch (error) {
    console.error('Confirm transfer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Transfers
exports.getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find({ senderId: req.user.userId })
      .populate('recipientId', 'beneficiaryName accountNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
