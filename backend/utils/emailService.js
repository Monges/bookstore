const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendRentalReminder = async (userEmail, userName, bookTitle, endDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Напоминание о сроке аренды книги',
      html: `
        <h2>Уважаемый(ая) ${userName}!</h2>
        <p>Срок аренды книги "${bookTitle}" истекает ${new Date(endDate).toLocaleDateString('ru-RU')}.</p>
        <p>Пожалуйста, не забудьте вернуть книгу вовремя или продлить аренду.</p>
        <br>
        <p>С уважением,<br>Команда книжного магазина</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendOverdueNotice = async (userEmail, userName, bookTitle, endDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Просрочка возврата книги',
      html: `
        <h2>Уважаемый(ая) ${userName}!</h2>
        <p>Срок аренды книги "${bookTitle}" истек ${new Date(endDate).toLocaleDateString('ru-RU')}.</p>
        <p>Пожалуйста, верните книгу как можно скорее во избежание дополнительных штрафов.</p>
        <br>
        <p>С уважением,<br>Команда книжного магазина</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Overdue notice sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending overdue notice:', error);
  }
};

module.exports = { sendRentalReminder, sendOverdueNotice };