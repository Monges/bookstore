let currentPage = 1;
const booksPerPage = 12;
let totalPages = 1;
let currentFilters = {};

async function loadBooks(page = 1) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: booksPerPage,
            ...currentFilters
        });

        const response = await fetch(`/api/books?${params}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        displayBooks(data.books);
        setupPagination(page, data.totalPages);
        currentPage = page;
        totalPages = data.totalPages;
    } catch (error) {
        console.error('Error loading books:', error);
        alert('Ошибка загрузки книг');
    }
}

function displayBooks(books) {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';

    if (books.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Книги не найдены</p></div>';
        return;
    }

    books.forEach(book => {
        const bookCard = `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img src="${book.coverImage}" alt="${book.title}" 
                     class="w-full h-48 object-cover" onerror="this.src='/images/default-cover.jpg'">
                <div class="p-4">
                    <h3 class="font-bold text-lg mb-2">${book.title}</h3>
                    <p class="text-gray-600 mb-2">${book.author}</p>
                    <p class="text-sm text-gray-500 mb-2">${book.year} • ${book.category}</p>
                    
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-2xl font-bold text-blue-600">${book.price}₽</span>
                        <span class="text-green-600">Аренда: ${book.rentalPrice}₽/мес</span>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button onclick="viewBook('${book._id}')" 
                                class="flex-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                            Подробнее
                        </button>
                        ${book.isAvailable ? `
                        <button onclick="rentBook('${book._id}')" 
                                class="flex-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                            Арендовать
                        </button>
                        ` : `
                        <button disabled class="flex-1 bg-gray-400 text-white px-3 py-1 rounded text-sm">
                            Недоступно
                        </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += bookCard;
    });
}

function setupPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
        pagination.innerHTML += `
            <button onclick="loadBooks(${currentPage - 1})" 
                    class="mx-1 px-3 py-2 bg-white border rounded-md hover:bg-gray-50">
                ← Назад
            </button>
        `;
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.innerHTML += `
            <button onclick="loadBooks(${i})" 
                    class="mx-1 px-3 py-2 border rounded-md ${
                        i === currentPage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white hover:bg-gray-50'
                    }">
                ${i}
            </button>
        `;
    }

    if (currentPage < totalPages) {
        pagination.innerHTML += `
            <button onclick="loadBooks(${currentPage + 1})" 
                    class="mx-1 px-3 py-2 bg-white border rounded-md hover:bg-gray-50">
                Вперед →
            </button>
        `;
    }
}

async function loadFilters() {
    try {
        const response = await fetch('/api/books/meta/filters');
        const filters = await response.json();

        populateSelect('categoryFilter', filters.categories);
        populateSelect('authorFilter', filters.authors);
        populateSelect('yearFilter', filters.years);
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

function populateSelect(selectId, values) {
    const select = document.getElementById(selectId);
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function applyFilters() {
    currentFilters = {
        category: document.getElementById('categoryFilter').value,
        author: document.getElementById('authorFilter').value,
        year: document.getElementById('yearFilter').value,
        sortBy: document.getElementById('sortFilter').value.startsWith('-') 
               ? document.getElementById('sortFilter').value.substring(1) 
               : document.getElementById('sortFilter').value,
        sortOrder: document.getElementById('sortFilter').value.startsWith('-') ? 'desc' : 'asc'
    };

    // Remove 'all' values
    Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key] === 'all') {
            delete currentFilters[key];
        }
    });

    loadBooks(1);
}

function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm) {
        currentFilters.search = searchTerm;
        loadBooks(1);
    }
}

function viewBook(bookId) {
    window.location.href = `book-detail.html?id=${bookId}`;
}

async function rentBook(bookId) {
    if (!checkAuth()) return;

    const duration = prompt('Выберите срок аренды:\n1. 2 недели\n2. 1 месяц\n3. 3 месяца', '1 month');
    if (!duration) return;

    const validDurations = ['2 weeks', '1 month', '3 months'];
    if (!validDurations.includes(duration)) {
        alert('Пожалуйста, выберите valid срок аренды');
        return;
    }

    try {
        const response = await fetch('/api/profile/rent/' + bookId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ rentalDuration: duration })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Книга успешно арендована!');
            loadBooks(currentPage); // Refresh the list
        } else {
            alert('Ошибка: ' + data.message);
        }
    } catch (error) {
        console.error('Error renting book:', error);
        alert('Ошибка аренды книги');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
    loadBooks();
    checkAuthState();
});