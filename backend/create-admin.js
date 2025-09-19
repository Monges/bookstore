const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        // Подключаемся к MongoDB
        await mongoose.connect('mongodb://localhost:27017/bookstore');
        console.log('Connected to MongoDB');

        // Создаем модель пользователя
        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            email: String,
            password: String,
            role: String,
            createdAt: Date
        }));

        // Проверяем, существует ли уже админ
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin already exists:', existingAdmin);
            return;
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Создаем администратора
        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date()
        });

        console.log('✅ Admin created successfully!');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('Role: admin');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();