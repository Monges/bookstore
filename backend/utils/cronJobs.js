const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const { sendRentalReminder, sendOverdueNotice } = require('./emailService');

const checkRentalStatus = async () => {
  try {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 2); // 2 days before expiry

    // Find rentals that are about to expire
    const expiringRentals = await Transaction.find({
      type: 'rental',
      status: 'active rental',
      rentalEndDate: { 
        $lte: warningDate,
        $gt: now
      }
    }).populate('userId', 'email username').populate('bookId', 'title');

    for (const rental of expiringRentals) {
      await sendRentalReminder(
        rental.userId.email,
        rental.userId.username,
        rental.bookId.title,
        rental.rentalEndDate
      );
    }

    // Find overdue rentals
    const overdueRentals = await Transaction.find({
      type: 'rental',
      status: 'active rental',
      rentalEndDate: { $lt: now }
    }).populate('userId', 'email username').populate('bookId', 'title');

    for (const rental of overdueRentals) {
      // Mark as overdue
      rental.status = 'overdue';
      await rental.save();

      await sendOverdueNotice(
        rental.userId.email,
        rental.userId.username,
        rental.bookId.title,
        rental.rentalEndDate
      );
    }

    console.log(`Checked ${expiringRentals.length + overdueRentals.length} rentals at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error in rental status check:', error);
  }
};

const startCronJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', checkRentalStatus);
  console.log('Cron jobs started');
};

module.exports = { startCronJobs, checkRentalStatus };