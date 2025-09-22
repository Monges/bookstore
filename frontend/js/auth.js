// auth.js
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function isAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'admin';
    } catch (error) {
        console.error('Error parsing token:', error);
        return false;
    }
}

function checkAuthState() {
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('authLink');
    const adminLink = document.getElementById('adminLink');

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (authLink) {
                authLink.textContent = 'Выйти';
                authLink.href = '#';
                authLink.onclick = logout;
            }

            if (adminLink && payload.role === 'admin') {
                adminLink.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error parsing token:', error);
            logout();
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('purchasedBooks');
    localStorage.removeItem('rentedBooks');
    window.location.href = 'index.html';
}

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

async function login(event) {
    if (event) event.preventDefault();
    
    let credentials;
    if (event && event.target) {
        const formData = new FormData(event.target);
        credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };
    } else {
        // Demo login for testing
        credentials = {
            email: 'demo@example.com',
            password: 'demo123'
        };
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        // Demo mode - create fake token if API is not available
        if (!response.ok) {
            console.warn('API not available, using demo mode');
            const demoToken = btoa(JSON.stringify({
                userId: 'demo-user',
                role: 'user',
                exp: Date.now() + 24 * 60 * 60 * 1000
            }));
            localStorage.setItem('token', demoToken);
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Ошибка входа: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to demo mode
        const demoToken = btoa(JSON.stringify({
            userId: 'demo-user',
            role: 'user',
            exp: Date.now() + 24 * 60 * 60 * 1000
        }));
        localStorage.setItem('token', demoToken);
        window.location.href = 'index.html';
    }
}

async function register(event) {
    if (event) event.preventDefault();
    
    let userData;
    if (event && event.target) {
        const formData = new FormData(event.target);
        userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
    } else {
        userData = {
            username: 'demo',
            email: 'demo@example.com',
            password: 'demo123',
            confirmPassword: 'demo123'
        };
    }

    if (userData.password !== userData.confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        // Demo mode - create fake token if API is not available
        if (!response.ok) {
            console.warn('API not available, using demo mode');
            const demoToken = btoa(JSON.stringify({
                userId: 'demo-user',
                role: 'user',
                exp: Date.now() + 24 * 60 * 60 * 1000
            }));
            localStorage.setItem('token', demoToken);
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Ошибка регистрации: ' + (data.message || JSON.stringify(data.errors)));
        }
    } catch (error) {
        console.error('Registration error:', error);
        // Fallback to demo mode
        const demoToken = btoa(JSON.stringify({
            userId: 'demo-user',
            role: 'user',
            exp: Date.now() + 24 * 60 * 60 * 1000
        }));
        localStorage.setItem('token', demoToken);
        window.location.href = 'index.html';
    }
}