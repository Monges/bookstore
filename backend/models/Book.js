const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  year: {
    type: Number,
    required: true,
    min: 1000,
    max: new Date().getFullYear()
  },
  category: {
    type: String,
    required: true,
    enum: ['Фэнтези', 'Научная фантастика', 'Роман', 'Детектив', 'Ужасы', 'Приключения', 'Исторический', 'Биография', 'Поэзия', 'Драма', 'Комиксы', 'ЛитРПГ', 'Другое'],
    default: 'Другое'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  rentalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  coverImage: {
    type: String,
    default: '/images/default-cover.jpg'
  },
  pages: {
    type: Number,
    min: 1
  },
  language: {
    type: String,
    default: 'Russian'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
BookSchema.index({ title: 'text', author: 'text' });
BookSchema.index({ category: 1 });
BookSchema.index({ author: 1 });
BookSchema.index({ year: 1 });

module.exports = mongoose.model('Book', BookSchema);