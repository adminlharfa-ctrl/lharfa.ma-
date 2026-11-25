/**
 * lharfa.ma - Shared Dashboard Logic
 * Handles common tasks for both Artisan, Client, and Admin dashboards.
 */

const DashboardManager = {
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('albane_user') || '{}');
        } catch (e) {
            return {};
        }
    },
    getToken() {
        return localStorage.getItem('albane_token');
    },

    init(requiredRole) {
        const token = this.getToken();
        const user = this.getUser();

        if (!token || !user.email) {
            window.location.href = 'login.html';
            return;
        }

        // Check role permission if specified
        if (requiredRole && user.role && user.role !== requiredRole && user.role !== 'admin') {
            if (user.role === 'artisan') {
                window.location.href = 'artisan-dashboard.html';
                return;
            } else if (user.role === 'client') {
                window.location.href = 'client-dashboard.html';
                return;
            }
        }

        this.updateHeader();
        this.updateLangLabel();
        this.setupEventListeners();
        if (window.I18nManager && typeof window.I18nManager.updateDOM === 'function') {
            window.I18nManager.updateDOM();
        }
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    },

    updateLangLabel() {
        const lang = localStorage.getItem('albane_lang') || 'ar';
        const label = document.getElementById('currentLangLabel');
        if (label) {
            label.textContent = lang.toUpperCase();
        }
    },

    updateHeader() {
        const user = this.getUser();
        const nameHeader = document.getElementById('userNameHeader');
        const initialHeader = document.getElementById('userInitialHeader');
        if (nameHeader && user && user.name) {
            nameHeader.textContent = user.name.split(' ')[0];
        }
        if (initialHeader && user && user.name) {
            initialHeader.textContent = user.name.charAt(0).toUpperCase();
        }
    },

    switchTab(tabId, el) {
        document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');

        if (el) {
            el.classList.add('active');
        } else {
            const link = document.querySelector(`.nav-item[data-tab="${tabId}"]`) || 
                         document.querySelector(`.nav-item[onclick*="${tabId}"]`);
            if (link) link.classList.add('active');
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Mobile Sidebar Auto-Close
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    },

    showToast(msgKey, type = 'info') {
        if (window.PlatformActions && typeof window.PlatformActions.showToast === 'function') {
            const msg = (window.I18nManager && window.I18nManager.getString(msgKey)) || msgKey;
            window.PlatformActions.showToast(msg, type);
            return;
        }

        const msg = (window.I18nManager && window.I18nManager.getString(msgKey)) || msgKey;
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
        
        toast.innerHTML = `<i data-lucide="${icon}"></i><span>${msg}</span>`;
        container.appendChild(toast);
        
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons({ root: toast });
        }

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    logout() {
        localStorage.removeItem('albane_token');
        localStorage.removeItem('albane_user');
        window.location.href = 'index.html';
    },

    setupEventListeners() {
        // Toggle Sidebar for mobile
        const toggleBtn = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.onclick = () => sidebar.classList.toggle('active');
        }

        // Close Modals on overlay click
        window.onclick = (event) => {
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('open');
            }
        };
    }
};

// Global logout helper for backward compatibility
window.logout = function() {
    DashboardManager.logout();
};

// Initialize Dashboard Manager
document.addEventListener('DOMContentLoaded', () => DashboardManager.init());
