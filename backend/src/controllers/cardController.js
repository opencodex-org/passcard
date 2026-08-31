const Card = require('../models/Card');
const Account = require('../models/Account');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Get User Cards
exports.getCards = async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.userId })
      .select('-cvv -cardNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cards,
      count: cards.length
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Request Card Creation
exports.requestCard = async (req, res) => {
  try {
    const { cardType, design, holderName, customImage } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!cardType || !holderName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get user account
    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Generate card number (for demo purposes)
    const cardNumber = Math.random().toString().replace(/^0\./, '').slice(0, 16).padEnd(16, '0');
    const cardNumberMasked = '•••• •••• •••• ' + cardNumber.slice(-4);

    // Create card
    const card = new Card({
      accountId: account._id,
      userId,
      cardNumber: cardNumber, // Should be encrypted in production
      cardNumberMasked,
      cardType,
      cardBrand: 'visa', // Default
      holderName: holderName.toUpperCase(),
      expiryDate: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit' }),
      design: design || 'blue',
      customImage,
      status: 'active',
      issueDate: new Date(),
      designApprovalStatus: customImage ? 'pending' : 'approved',
      features: {
        contactlessEnabled: true,
        internationalEnabled: true,
        ecommerceEnabled: true
      }
    });

    if (customImage) {
      card.designApprovalStatus = 'pending';
    } else {
      card.designApprovalStatus = 'approved';
    }

    await card.save();

    res.status(201).json({
      success: true,
      data: {
        id: card._id,
        cardNumberMasked: card.cardNumberMasked,
        cardType: card.cardType,
        holderName: card.holderName,
        expiryDate: card.expiryDate,
        design: card.design,
        status: card.status,
        designApprovalStatus: card.designApprovalStatus
      },
      message: customImage ? 'Card request submitted for design approval' : 'Card created successfully'
    });
  } catch (error) {
    console.error('Request card error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Freeze Card
exports.freezeCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findOneAndUpdate(
      { _id: cardId, userId: req.user.userId },
      { status: 'frozen' },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    res.json({
      success: true,
      data: card,
      message: 'Card frozen successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Unfreeze Card
exports.unfreezeCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findOneAndUpdate(
      { _id: cardId, userId: req.user.userId },
      { status: 'active' },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    res.json({
      success: true,
      data: card,
      message: 'Card unfrozen successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Card Details
exports.getCardDetails = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findOne({
      _id: cardId,
      userId: req.user.userId
    }).select('-cvv');

    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
