const mongoose = require('mongoose');

async function testBookCreation() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bookstore');
        console.log('Connected to MongoDB');

        const Book = require('./models/Book');
        
        const testBook = {
            title: "Тестовая книга",
            author: "Тестовый автор",
            description: "Тестовое описание книги",
            year: 2024,
            category: "Фэнтези",
            price: 100,
            rentalPrice: 10,
            isAvailable: true,
            coverImage: "https://via.placeholder.com/300x400"
        };

        const book = new Book(testBook);
        await book.save();
        
        console.log('✅ Тестовая книга создана успешно!');
        console.log('ID книги:', book._id);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}

testBookCreation();