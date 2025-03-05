document.addEventListener('DOMContentLoaded', () => {
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const htmlElement = document.documentElement;
    const icon = darkModeBtn.querySelector('i');
    const darkModeStylesheet = document.getElementById('dark-mode-stylesheet');
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Check if user prefers dark mode
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            applyTheme('dark');
        }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only apply automatically if user hasn't set a preference
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
        }
    });
    
    // Toggle theme when button is clicked with animation
    darkModeBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Add transition animation
        document.body.classList.add('theme-transition');
        
        // Add button animation
        darkModeBtn.classList.add('animated');
        
        // Apply the theme change
        applyTheme(newTheme);
        
        // Show a quick notification about theme change
        showThemeNotification(newTheme);
        
        // Remove transition class after animation completes
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
            darkModeBtn.classList.remove('animated');
        }, 400);
    });
    
    // Apply theme and update all related elements
    function applyTheme(theme) {
        // Update HTML attribute
        htmlElement.setAttribute('data-theme', theme);
        
        // Enable/disable stylesheet
        darkModeStylesheet.disabled = (theme !== 'dark');
        
        // Save preference
        localStorage.setItem('theme', theme);
        
        // Update icon
        updateIcon(theme);
        
        // Update status bar for iOS
        if (theme === 'dark') {
            document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
                .setAttribute('content', 'black-translucent');
        } else {
            document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
                .setAttribute('content', 'default');
        }
        
        // Apply transition to all cards for a staggered effect
        applyCardTransitions();
    }
    
    // Update icon based on current theme
    function updateIcon(theme) {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            darkModeBtn.setAttribute('aria-label', 'Switch to light mode');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            darkModeBtn.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
    
    // Apply staggered transitions to cards
    function applyCardTransitions() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('card-transition');
                setTimeout(() => {
                    card.classList.remove('card-transition');
                }, 500);
            }, index * 50); // Stagger the animations
        });
    }
    
    // Show a notification about theme change
    function showThemeNotification(theme) {
        const message = theme === 'dark' 
            ? 'Dark mode activated! 🌙' 
            : 'Light mode activated! ☀️';
        
        // Use the UI notification system if it exists
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(message, 'info');
        } else {
            // Simple fallback notification
            const notification = document.createElement('div');
            notification.className = `notification info`;
            notification.innerHTML = `
                <div class="notification-content">
                    <p>${message}</p>
                    <button class="notification-close">&times;</button>
                </div>
            `;
            
            const container = document.getElementById('notification-container');
            container.appendChild(notification);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
            
            // Close button
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
    }
    
    // Add CSS for the transition effects
    const style = document.createElement('style');
    style.textContent = `
        .animated {
            animation: rotate 0.4s ease-in-out;
        }
        
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .card-transition {
            transform: translateY(-5px);
            transition: transform 0.4s ease;
        }
    `;
    document.head.appendChild(style);
});
