const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  year: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: 'Другое'
  },
  price: {
    type: Number,
    required: true
  },
  rentalPrice: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  coverImage: {
    type: String,
    default: '/images/default-cover.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Убрали индексы чтобы избежать ошибок
module.exports = mongoose.model('Book', BookSchema);