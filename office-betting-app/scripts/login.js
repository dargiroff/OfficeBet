document.addEventListener('DOMContentLoaded', function() {
    // Add UI notification functions if they don't exist
    if (!window.UI) {
        window.UI = {
            showSuccess: function(message) {
                const notificationContainer = document.getElementById('notification-container');
                const notification = document.createElement('div');
                notification.className = 'notification success';
                notification.innerHTML = `
                    <span>${message}</span>
                    <button class="notification-close">&times;</button>
                `;
                notificationContainer.appendChild(notification);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 5000);
                
                // Add close button functionality
                notification.querySelector('.notification-close').addEventListener('click', function() {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                });
            },
            
            showError: function(message) {
                const notificationContainer = document.getElementById('notification-container');
                const notification = document.createElement('div');
                notification.className = 'notification error';
                notification.innerHTML = `
                    <span>${message}</span>
                    <button class="notification-close">&times;</button>
                `;
                notificationContainer.appendChild(notification);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 5000);
                
                // Add close button functionality
                notification.querySelector('.notification-close').addEventListener('click', function() {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                });
            }
        };
    }
    
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const formContents = document.querySelectorAll('.form-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            formContents.forEach(form => form.classList.remove('active'));
            
            // Add active class to current tab and form
            this.classList.add('active');
            document.getElementById(`${tabId}-form`).classList.add('active');
            
            // Clear error messages
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('signup-error').style.display = 'none';
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Login button click
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    function handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        
        // Validate inputs
        if (!username || !password) {
            errorElement.textContent = 'Please enter both username and password';
            errorElement.style.display = 'block';
            return;
        }
        
        // Authenticate user
        const result = DataStore.authenticateUser(username, password);
        
        if (result.success) {
            // Show success notification
            UI.showSuccess(`Welcome back, ${username}!`);
            
            // Redirect to main page with minimal delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        } else {
            // Show error message
            errorElement.textContent = result.message;
            errorElement.style.display = 'block';
        }
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signup-form-element');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSignup();
        });
    }
    
    // Signup button click
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleSignup();
        });
    }
    
    function handleSignup() {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const errorElement = document.getElementById('signup-error');
        
        // Validate inputs
        if (!username || !password || !confirmPassword) {
            errorElement.textContent = 'Please fill in all fields';
            errorElement.style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.display = 'block';
            return;
        }
        
        if (password.length < 4) {
            errorElement.textContent = 'Password must be at least 4 characters long';
            errorElement.style.display = 'block';
            return;
        }
        
        // Create user
        const result = DataStore.createUser(username, password);
        
        if (result.success) {
            // Show success notification
            UI.showSuccess(`Account created successfully! Welcome, ${username}!`);
            
            // Redirect to login page with minimal delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 100);
        } else {
            // Show error message
            errorElement.textContent = result.message;
            errorElement.style.display = 'block';
        }
    }
    
    // Check if user is already logged in and redirect if needed
    const currentUser = DataStore.getCurrentUser();
    if (currentUser) {
        console.log('User already logged in, redirecting to index.html');
        window.location.href = 'index.html';
    }
    
    // Handle dark mode toggle
    const darkModeBtn = document.getElementById('dark-mode-btn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', function() {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Add transition animation
            document.body.classList.add('theme-transition');
            
            // Add button animation
            darkModeBtn.classList.add('animated');
            
            // Apply the theme change
            document.body.setAttribute('data-theme', newTheme);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (newTheme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
            
            // Toggle stylesheet
            const darkModeStylesheet = document.getElementById('dark-mode-stylesheet');
            darkModeStylesheet.disabled = (newTheme !== 'dark');
            
            // Save preference
            localStorage.setItem('theme', newTheme);
            
            // Remove transition class after animation completes
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
                darkModeBtn.classList.remove('animated');
            }, 400);
        });
        
        // Apply saved dark mode preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            const icon = darkModeBtn.querySelector('i');
            
            if (savedTheme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                document.getElementById('dark-mode-stylesheet').disabled = false;
            }
        } else {
            // Check if user prefers dark mode
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDarkMode) {
                document.body.setAttribute('data-theme', 'dark');
                const icon = darkModeBtn.querySelector('i');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                document.getElementById('dark-mode-stylesheet').disabled = false;
            }
        }
    }
}); 