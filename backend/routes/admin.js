const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Get all transactions
router.get('/transactions', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overdue rentals
router.get('/overdue', auth, isAdmin, async (req, res) => {
  try {
    const overdueRentals = await Transaction.find({
      type: 'rental',
      status: 'active rental',
      rentalEndDate: { $lt: new Date() }
    })
    .populate('userId', 'username email')
    .populate('bookId', 'title author')
    .sort({ rentalEndDate: 1 });

    res.json(overdueRentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const revenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentTransactions = await Transaction.find()
      .populate('userId', 'username')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalBooks,
      totalUsers,
      totalTransactions,
      totalRevenue: revenue[0]?.total || 0,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction status
router.patch('/transactions/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'username email').populate('bookId', 'title author');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;