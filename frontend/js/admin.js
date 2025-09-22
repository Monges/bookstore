// Admin specific functionality
class AdminManager {
    constructor() {
        this.currentPage = 1;
        this.booksPerPage = 10;
        this.transactionsPerPage = 20;
    }

    async init() {
        if (!checkAuth()) return;
        if (!isAdmin()) {
            alert('Доступ запрещен. Требуются права администратора.');
            window.location.href = 'index.html';
            return;
        }

        await this.loadStats();
        await this.loadBooks();
        this.setupEventListeners();
    }

    async loadStats() {
        try {
            const response = await authFetch('/api/admin/stats');
            const stats = await response.json();

            if (response.ok) {
                this.updateStatsDisplay(stats);
            } else {
                throw new Error(stats.message);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Ошибка загрузки статистики');
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('statsBooks').textContent = stats.totalBooks.toLocaleString();
        document.getElementById('statsUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('statsTransactions').textContent = stats.totalTransactions.toLocaleString();
        document.getElementById('statsRevenue').textContent = stats.totalRevenue.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    async loadBooks(page = 1) {
        try {
            const response = await authFetch(`/api/books?page=${page}&limit=${this.booksPerPage}`);
            const data = await response.json();

            if (response.ok) {
                this.displayBooks(data.books);
                this.setupBooksPagination(page, data.totalPages);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.showError('Ошибка загрузки книг');
        }
    }

    displayBooks(books) {
        const container = document.getElementById('booksList');
        
        if (books.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-book-open text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Книги не найдены</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="overflow-x-auto">
                <table class="w-full table-auto">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Автор</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Год</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        books.forEach(book => {
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${book.title}</div>
                        <div class="text-sm text-gray-500">${book.category}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${book.author}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${book.year}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                            book.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }">
                            ${book.isAvailable ? 'Доступна' : 'Недоступна'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="adminManager.editBook('${book._id}')" 
                                class="text-blue-600 hover:text-blue-900 mr-3">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminManager.deleteBook('${book._id}')" 
                                class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    setupBooksPagination(currentPage, totalPages) {
        const container = document.getElementById('booksPagination');
        if (!container || totalPages <= 1) return;

        let html = `
            <div class="flex justify-center items-center space-x-2 mt-4">
                <button onclick="adminManager.loadBooks(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    ← Назад
                </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button onclick="adminManager.loadBooks(${i})" 
                        class="px-3 py-1 rounded border ${
                            i === currentPage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }">
                    ${i}
                </button>
            `;
        }

        html += `
                <button onclick="adminManager.loadBooks(${currentPage + 1})" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    Вперед →
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    async addBook(bookData) {
        try {
            const response = await authFetch('/api/books', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Книга успешно добавлена!');
                await this.loadBooks();
                document.getElementById('addBookForm').reset();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error adding book:', error);
            this.showError('Ошибка добавления книги: ' + error.message);
        }
    }

    async editBook(bookId) {
        // Implementation for editing book
        alert('Редактирование книги с ID: ' + bookId);
        // You can implement a modal for editing
    }

    async deleteBook(bookId) {
        if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return;

        try {
            const response = await authFetch(`/api/books/${bookId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Книга успешно удалена!');
                await this.loadBooks();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error deleting book:', error);
            this.showError('Ошибка удаления книги: ' + error.message);
        }
    }

    setupEventListeners() {
        const addBookForm = document.getElementById('addBookForm');
        if (addBookForm) {
            addBookForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const bookData = Object.fromEntries(formData.entries());
                await this.addBook(bookData);
            });
        }
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50';
        notification.innerHTML = `
            <strong>Ошибка!</strong> ${message}
            <button class="float-right text-red-800 font-bold" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50';
        notification.innerHTML = `
            <strong>Успех!</strong> ${message}
            <button class="float-right text-green-800 font-bold" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize admin manager
const adminManager = new AdminManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    adminManager.init();
});