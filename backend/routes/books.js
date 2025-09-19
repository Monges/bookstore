const express = require('express');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Get all books with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { category, author, year, sortBy = 'title', sortOrder = 'asc', search, page = 1, limit = 12 } = req.query;
    
    let query = {};
    
    if (category && category !== 'all') query.category = category;
    if (author && author !== 'all') query.author = new RegExp(author, 'i');
    if (year && year !== 'all') query.year = parseInt(year);
    
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { author: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const books = await Book.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create book (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update book (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete book (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unique values for filters
router.get('/meta/filters', async (req, res) => {
  try {
    const categories = await Book.distinct('category');
    const authors = await Book.distinct('author');
    const years = await Book.distinct('year');
    
    res.json({ categories, authors, years: years.sort((a, b) => b - a) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;