// Theme management for dark/light mode
const themes = {
    dark: {
        'color-bg': '#1a1a1a',
        'color-text': '#fff8f0',
        'color-text-muted': '#c4a77d',
        'color-accent': '#ff6b35',
        'color-accent-light': '#ffa366',
        'color-hover': '#ffcc99'
    },
    light: {
        'color-bg': '#fff8f0',
        'color-text': '#1a1a1a',
        'color-text-muted': '#5a5a5a',
        'color-accent': '#ff6b35',
        'color-accent-light': '#ff8c5a',
        'color-hover': '#ff6b35'
    }
};

// Get current theme from localStorage or default to dark
let currentTheme = localStorage.getItem('theme') || 'dark';

// Apply theme to page
function applyTheme(theme) {
    const root = document.documentElement;
    const themeColors = themes[theme];

    Object.keys(themeColors).forEach(key => {
        root.style.setProperty(`--${key}`, themeColors[key]);
    });

    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }

    currentTheme = theme;
    localStorage.setItem('theme', theme);
}

// Toggle between dark and light theme
function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    applyTheme(currentTheme);

    // Set up theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});
