const express = require('express');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile with transactions
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('bookId', 'title author coverImage')
      .sort({ createdAt: -1 });

    res.json({ user, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rent a book
router.post('/rent/:bookId', auth, async (req, res) => {
  try {
    const { rentalDuration } = req.body;
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (!book.isAvailable) {
      return res.status(400).json({ message: 'Book is not available for rent' });
    }

    const rentalPeriods = {
      '2 weeks': 14,
      '1 month': 30,
      '3 months': 90
    };

    const rentalEndDate = new Date();
    rentalEndDate.setDate(rentalEndDate.getDate() + rentalPeriods[rentalDuration]);

    const amount = book.rentalPrice * (rentalPeriods[rentalDuration] / 30);

    const transaction = new Transaction({
      userId: req.user._id,
      bookId: book._id,
      type: 'rental',
      rentalDuration,
      rentalEndDate,
      amount,
      status: 'active rental'
    });

    await transaction.save();

    // Update book availability
    book.isAvailable = false;
    await book.save();

    // Add to user's rented books
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        rentedBooks: {
          bookId: book._id,
          rentalEndDate,
          transactionId: transaction._id
        }
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Purchase a book
router.post('/purchase/:bookId', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const transaction = new Transaction({
      userId: req.user._id,
      bookId: book._id,
      type: 'purchase',
      amount: book.price,
      status: 'completed'
    });

    await transaction.save();

    // For purchase, we might want to keep the book available for others
    // or mark it as sold. Here we'll keep it available.

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Return a rented book
router.post('/return/:transactionId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    
    if (!transaction || transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.type !== 'rental') {
      return res.status(400).json({ message: 'Only rental transactions can be returned' });
    }

    transaction.status = 'completed';
    await transaction.save();

    // Update book availability
    await Book.findByIdAndUpdate(transaction.bookId, { isAvailable: true });

    // Remove from user's rented books
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { rentedBooks: { transactionId: transaction._id } }
    });

    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;