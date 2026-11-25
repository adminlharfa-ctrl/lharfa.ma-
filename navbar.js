/**
 * lharfa.ma - Global Navbar Component
 * Handles dynamic navigation based on user authentication, role, and language.
 */

document.addEventListener('DOMContentLoaded', () => {
    const navbarContainer = document.querySelector('.navbar');
    if (!navbarContainer) return;

    const user = JSON.parse(localStorage.getItem('albane_user') || 'null');
    const isLoggedIn = !!localStorage.getItem('albane_token') && user;
    const supportedLangs = ['ar', 'fr', 'en'];
    const currentLang = supportedLangs.includes(localStorage.getItem('albane_lang')) ? localStorage.getItem('albane_lang') : 'ar';
    const translations = window.translations || {};
    const strings = translations[currentLang] || translations.ar || translations.en || {};
    const t = (key, fallback) => strings[key] || (translations.ar && translations.ar[key]) || (translations.en && translations.en[key]) || fallback || key;

    let dashboardLink = 'login.html';
    if (isLoggedIn) {
        if (user.role === 'artisan') {
            dashboardLink = 'artisan-dashboard.html';
        } else if (user.role === 'admin') {
            dashboardLink = 'admin-dashboard.html';
        } else {
            dashboardLink = 'client-dashboard.html';
        }
    }

    const bottomLabels = {
        ar: { home: 'الرئيسية', browse: 'تصفح', shop: 'متجر', dashboard: 'لوحة' },
        fr: { home: 'Accueil', browse: 'Artisans', shop: 'Boutique', dashboard: 'Compte' },
        en: { home: 'Home', browse: 'Browse', shop: 'Shop', dashboard: 'Account' }
    };

    const navContent = `
        <div class="container nav-container">
            <a href="index.html" class="logo">
                <img src="logo1.png" alt="lharfa.ma Logo">
                <span>lharfa<span style="color: white;">.ma</span></span>
            </a>
            <div class="nav-links">
                <div class="mobile-nav-header">
                    <a href="index.html" class="logo">
                        <img src="logo1.png" alt="lharfa.ma Logo">
                        <span>lharfa<span style="color: white;">.ma</span></span>
                    </a>
                    <button id="closeMenu" class="btn-close-menu" aria-label="Close menu"><i data-lucide="x"></i></button>
                </div>
                <a href="index.html#services" class="nav-link"><i data-lucide="wrench"></i> ${t('services_link', 'خدماتنا')}</a>
                <a href="artisans.html" class="nav-link"><i data-lucide="users"></i> ${t('artisans_link', 'تصفح الحرفيين')}</a>
                ${(isLoggedIn && user.role === 'artisan') ? `<a href="shop.html" class="nav-link"><i data-lucide="shopping-bag"></i> ${t('dashboard_shop', 'متجر المعدات')}</a>` : ''}
                ${isLoggedIn ? `
                    <div class="user-profile-nav">
                        <div class="user-info" onclick="window.location.href='${dashboardLink}'">
                            <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" class="user-avatar-sm" alt="${user.name}">
                            <div class="user-details">
                                <span class="user-name-small">${user.name}</span>
                                <span class="user-role-small">${t('dashboard', 'Dashboard')}</span>
                            </div>
                        </div>
                        <button onclick="logout()" class="btn btn-outline-danger nav-logout-btn" title="${t('logout', 'خروج')}">
                            <i data-lucide="log-out"></i> ${t('logout', 'خروج')}
                        </button>
                    </div>
                ` : `
                    <a href="register.html" class="nav-link"><i data-lucide="user-plus"></i> ${t('join_us', 'كن شريكاً معنا')}</a>
                    <div class="nav-auth-btns">
                        <a href="login.html" class="btn-elite-secondary">${t('login', 'تسجيل الدخول')}</a>
                        <a href="register.html" class="btn-elite-primary">${t('start_now', 'ابدأ الآن')}</a>
                    </div>
                `}
                <div class="lang-switcher" id="mainLangSwitcher">
                    <button class="lang-btn" onclick="I18nManager.toggleLanguageDropdown(event)" aria-label="Change language" aria-expanded="false">
                        <i data-lucide="globe" class="lang-globe-icon"></i>
                        <span class="current-lang-code">${currentLang.toUpperCase()}</span>
                        <i data-lucide="chevron-down" class="lang-chevron-icon"></i>
                    </button>
                    <div id="langDropdown" class="lang-dropdown">
                        <div class="lang-dropdown-header">
                            <i data-lucide="languages" style="width: 13px; height: 13px;"></i>
                            <span data-i18n="switch_lang">${t('switch_lang', 'تغيير اللغة')}</span>
                        </div>
                        <div class="lang-dropdown-list">
                            <a href="#" class="lang-option ${currentLang === 'ar' ? 'active' : ''}" data-lang-option="ar" onclick="I18nManager.setLanguage('ar'); return false;">
                                <div class="lang-option-info">
                                    <span class="lang-flag">🇲🇦</span>
                                    <span class="lang-name">العربية</span>
                                </div>
                                <div class="lang-option-meta">
                                    <span class="lang-badge">AR</span>
                                    <i data-lucide="check" class="lang-check"></i>
                                </div>
                            </a>
                            <a href="#" class="lang-option ${currentLang === 'fr' ? 'active' : ''}" data-lang-option="fr" onclick="I18nManager.setLanguage('fr'); return false;">
                                <div class="lang-option-info">
                                    <span class="lang-flag">🇫🇷</span>
                                    <span class="lang-name">Français</span>
                                </div>
                                <div class="lang-option-meta">
                                    <span class="lang-badge">FR</span>
                                    <i data-lucide="check" class="lang-check"></i>
                                </div>
                            </a>
                            <a href="#" class="lang-option ${currentLang === 'en' ? 'active' : ''}" data-lang-option="en" onclick="I18nManager.setLanguage('en'); return false;">
                                <div class="lang-option-info">
                                    <span class="lang-flag">🇬🇧</span>
                                    <span class="lang-name">English</span>
                                </div>
                                <div class="lang-option-meta">
                                    <span class="lang-badge">EN</span>
                                    <i data-lucide="check" class="lang-check"></i>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-toggle" id="menuToggle" aria-label="Open menu">
                <i data-lucide="menu"></i>
            </div>
        </div>
    `;

    navbarContainer.innerHTML = navContent;
    if (window.I18nManager && typeof window.I18nManager.updateLanguageControls === 'function') {
        window.I18nManager.updateLanguageControls();
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    const toggle = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeMenu');
    const navLinks = navbarContainer.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.onclick = () => navLinks.classList.add('active');
    }
    if (closeBtn && navLinks) {
        closeBtn.onclick = () => navLinks.classList.remove('active');
    }

    navbarContainer.querySelectorAll('.nav-link, .btn-elite-primary, .btn-elite-secondary').forEach((link) => {
        link.addEventListener('click', () => navLinks && navLinks.classList.remove('active'));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks) navLinks.classList.remove('active');
    });

    renderEliteBottomNav();

    function renderEliteBottomNav() {
        const existing = document.querySelector('.mobile-bottom-nav-elite');
        if (existing) existing.remove();

        const bottomNav = document.createElement('nav');
        bottomNav.className = 'mobile-bottom-nav-elite';

        const path = window.location.pathname;
        const isHome = path === '/' || path.includes('index.html');
        const isArtisans = path.includes('artisans.html');
        const isShop = path.includes('shop.html') || path.includes('product-detail.html');
        const isDashboard = path.includes('dashboard') || path.includes('login') || path.includes('register');
        const labels = bottomLabels[currentLang] || bottomLabels.ar;

        bottomNav.innerHTML = `
            <a href="index.html" class="elite-m-nav-item ${isHome ? 'active' : ''}">
                <i data-lucide="home"></i>
                <span>${labels.home}</span>
            </a>
            <a href="artisans.html" class="elite-m-nav-item ${isArtisans ? 'active' : ''}">
                <i data-lucide="search"></i>
                <span>${labels.browse}</span>
            </a>
            ${(isLoggedIn && user.role === 'artisan') ? `
            <a href="shop.html" class="elite-m-nav-item ${isShop ? 'active' : ''}">
                <i data-lucide="shopping-bag"></i>
                <span>${labels.shop}</span>
            </a>` : ''}
            <a href="${dashboardLink}" class="elite-m-nav-item ${isDashboard ? 'active' : ''}">
                <i data-lucide="user"></i>
                <span>${labels.dashboard}</span>
            </a>
        `;

        document.body.appendChild(bottomNav);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }
});

function logout() {
    if (window.DashboardManager && typeof window.DashboardManager.logout === 'function') {
        window.DashboardManager.logout();
    } else {
        localStorage.removeItem('albane_token');
        localStorage.removeItem('albane_user');
        window.location.href = 'index.html';
    }
}
