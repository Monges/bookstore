// Profile management functionality
class ProfileManager {
    constructor() {
        this.userData = null;
        this.transactions = [];
    }

    async init() {
        if (!checkAuth()) return;
        
        await this.loadProfile();
        this.setupEventListeners();
    }

    async loadProfile() {
        try {
            const response = await authFetch('/api/profile');
            const data = await response.json();

            if (response.ok) {
                this.userData = data.user;
                this.transactions = data.transactions;
                this.updateProfileDisplay();
                this.displayTransactions();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Ошибка загрузки профиля');
        }
    }

    updateProfileDisplay() {
        if (!this.userData) return;

        document.getElementById('userUsername').textContent = this.userData.username;
        document.getElementById('userEmail').textContent = this.userData.email;
        document.getElementById('userRole').textContent = this.userData.role === 'admin' ? 'Администратор' : 'Пользователь';
        document.getElementById('userCreatedAt').textContent = new Date(this.userData.createdAt).toLocaleDateString('ru-RU');
    }

    displayTransactions() {
        const container = document.getElementById('transactionHistory');
        const currentRentalsContainer = document.getElementById('currentRentals');

        if (this.transactions.length === 0) {
            container.innerHTML = this.createEmptyState('История операций пуста', 'fas fa-receipt');
            currentRentalsContainer.innerHTML = this.createEmptyState('Нет активных аренд', 'fas fa-book-open');
            return;
        }

        // Display current rentals
        const currentRentals = this.transactions.filter(t => t.status === 'active rental');
        currentRentalsContainer.innerHTML = this.createRentalsList(currentRentals);

        // Display transaction history
        const history = this.transactions.filter(t => t.status !== 'active rental');
        container.innerHTML = this.createTransactionsList(history);
    }

    createEmptyState(message, icon) {
        return `
            <div class="text-center py-8">
                <i class="${icon} text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">${message}</p>
            </div>
        `;
    }

    createRentalsList(rentals) {
        if (rentals.length === 0) {
            return this.createEmptyState('Нет активных аренд', 'fas fa-book-open');
        }

        let html = '';
        rentals.forEach(rental => {
            const endDate = new Date(rental.rentalEndDate);
            const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
            
            html += `
                <div class="border rounded-lg p-4 mb-4 bg-gradient-to-r from-green-50 to-blue-50 slide-up">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-semibold text-lg">${rental.bookId.title}</h4>
                            <p class="text-gray-600">${rental.bookId.author}</p>
                        </div>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            ${rental.rentalDuration}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <span class="text-sm text-gray-600">Арендовано до:</span>
                            <div class="font-semibold">${endDate.toLocaleDateString('ru-RU')}</div>
                        </div>
                        <div>
                            <span class="text-sm text-gray-600">Осталось дней:</span>
                            <div class="font-semibold ${daysLeft <= 3 ? 'text-red-600' : 'text-green-600'}">
                                ${daysLeft} ${this.getDayText(daysLeft)}
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="profileManager.returnBook('${rental._id}')" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                        <i class="fas fa-undo mr-2"></i>Вернуть книгу
                    </button>
                </div>
            `;
        });

        return html;
    }

    createTransactionsList(transactions) {
        if (transactions.length === 0) {
            return this.createEmptyState('История операций пуста', 'fas fa-receipt');
        }

        let html = '';
        transactions.forEach(transaction => {
            const date = new Date(transaction.createdAt);
            const isRental = transaction.type === 'rental';
            
            html += `
                <div class="border rounded-lg p-4 mb-4 slide-up">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold">${transaction.bookId.title}</h4>
                            <p class="text-gray-600 text-sm">${transaction.bookId.author}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }">
                            ${isRental ? 'Аренда' : 'Покупка'}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Дата:</span>
                            <div>${date.toLocaleDateString('ru-RU')}</div>
                        </div>
                        <div>
                            <span class="text-gray-600">Сумма:</span>
                            <div class="font-semibold">${transaction.amount}₽</div>
                        </div>
                        ${isRental ? `
                        <div>
                            <span class="text-gray-600">Срок:</span>
                            <div>${transaction.rentalDuration}</div>
                        </div>
                        <div>
                            <span class="text-gray-600">Статус:</span>
                            <div>${this.getStatusText(transaction.status)}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        return html;
    }

    getDayText(days) {
        if (days === 1) return 'день';
        if (days < 5) return 'дня';
        return 'дней';
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Завершено',
            'active rental': 'Активно',
            'overdue': 'Просрочено',
            'cancelled': 'Отменено'
        };
        return statusMap[status] || status;
    }

    async returnBook(transactionId) {
        if (!confirm('Вы уверены, что хотите вернуть книгу?')) return;

        try {
            const response = await authFetch(`/api/profile/return/${transactionId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Книга успешно возвращена!');
                await this.loadProfile(); // Reload profile data
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error returning book:', error);
            this.showError('Ошибка возврата книги: ' + error.message);
        }
    }

    setupEventListeners() {
        // Add any profile-specific event listeners here
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50';
        notification.innerHTML = `
            <strong>Ошибка!</strong> ${message}
            <button class="float-right text-red-800 font-bold" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50';
        notification.innerHTML = `
            <strong>Успех!</strong> ${message}
            <button class="float-right text-green-800 font-bold" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize profile manager
const profileManager = new ProfileManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    profileManager.init();
});