function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function checkAuthState() {
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('authLink');
    const adminLink = document.getElementById('adminLink');

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            authLink.textContent = 'Выйти';
            authLink.href = '#';
            authLink.onclick = logout;

            if (payload.role === 'admin') {
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
    window.location.href = 'index.html';
}

async function login(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Ошибка входа: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Ошибка соединения');
    }
}

async function register(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };

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

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Ошибка регистрации: ' + (data.message || JSON.stringify(data.errors)));
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Ошибка соединения');
    }
}