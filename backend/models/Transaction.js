const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'rental'],
    required: true
  },
  rentalDuration: {
    type: String,
    enum: ['2 weeks', '1 month', '3 months'],
    required: function() { return this.type === 'rental'; }
  },
  rentalEndDate: {
    type: Date,
    required: function() { return this.type === 'rental'; }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['completed', 'active rental', 'overdue', 'cancelled'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ bookId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ rentalEndDate: 1 });
TransactionSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);