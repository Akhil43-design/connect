// Authentication JavaScript

// Tab switching
function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabBtns[0].classList.add('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabBtns[1].classList.add('active');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect based on role
            if (data.role === 'customer') {
                window.location.href = '/customer/dashboard';
            } else if (data.role === 'store_owner') {
                window.location.href = '/store/dashboard';
            }
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('An error occurred during login', 'error');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    let role = document.getElementById('register-role').value;

    // Fallback for hidden input
    if (!role) {
        role = document.getElementById('register-role').getAttribute('value');
    }

    if (!role) {
        showMessage('Please select a role', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect based on role
            if (data.role === 'customer') {
                window.location.href = '/customer/dashboard';
            } else if (data.role === 'store_owner') {
                window.location.href = '/store/dashboard';
            }
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('An error occurred during registration', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}
