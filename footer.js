/**
 * lharfa.ma - Official Brand Footer Component
 * Based on the professional Elite design system.
 */

document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.querySelector('.footer-container');
    if (!footerContainer) return;

    const currentLang = localStorage.getItem('albane_lang') || 'ar';
    const translations = window.translations || {};
    const strings = translations[currentLang] || translations.ar || translations.en || {};

    const getS = (key) => (strings && strings[key]) || (translations.en && translations.en[key]) || (translations.ar && translations.ar[key]) || key;

    footerContainer.innerHTML = `
        <!-- Top Section: CTA Banner -->
        <section class="footer-cta-banner">
            <div class="container footer-cta-container">
                <div class="cta-text">
                    <h2>${getS('newsletter_title')}</h2>
                    <p>${getS('newsletter_desc')}</p>
                </div>
                <div class="cta-form">
                    <div class="cta-input-box">
                        <input type="email" class="footer-newsletter-email" placeholder="example@mail.com" aria-label="Email Address">
                        <button class="footer-subscribe-btn" type="button" onclick="PlatformActions.subscribeNewsletter(this.closest('.cta-form').querySelector('input[type=email]'))">${getS('subscribe')}</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Footer Section -->
        <footer class="main-footer-elite">
            <div class="container">
                <div class="footer-grid-official">
                    
                    <!-- Brand Identity Column -->
                    <div class="footer-col-brand">
                        <div class="footer-logo-official">
                            <img src="logo1.png" alt="Logo">
                            <span>
                                <span style="color: var(--primary-red);">lharfa</span><span style="color: white;">.ma</span>
                            </span>
                        </div>
                        <p class="footer-brand-desc">
                            ${getS('footer_desc') || 'المنصة الأولى في المغرب لربط الحرفيين بالزبائن بجودة واحترافية عالية. نضمن لك السرعة، الموثوقية، والأمان في كل طلب.'}
                        </p>
                    </div>

                    <!-- Quick Links Column -->
                    <div class="footer-col-links">
                        <h4 class="footer-title-official">${getS('important_links')}
                            <span></span>
                        </h4>
                        <ul class="footer-links-list">
                            <li><a href="faq.html">${getS('faq')}</a></li>
                            <li><a href="terms.html">${getS('terms')}</a></li>
                            <li><a href="privacy.html">${getS('privacy')}</a></li>
                            <li><a href="contact.html">${getS('contact_us')}</a></li>
                        </ul>
                    </div>

                    <!-- Contact Info Column -->
                    <div class="footer-col-contact">
                        <h4 class="footer-title-official">${getS('contact_info_title')}
                            <span></span>
                        </h4>
                        <div class="footer-contact-list">
                            <a href="https://www.google.com/maps/search/?api=1&query=Taroudant%2C%20Morocco" target="_blank" rel="noopener" class="footer-contact-item">
                                <i data-lucide="map-pin" style="color: var(--primary-red); width: 18px;"></i>
                                <span>${getS('footer_location')}</span>
                            </a>
                            <a href="mailto:adminlharfa@gmail.com" class="footer-contact-item">
                                <i data-lucide="mail" style="color: var(--primary-red); width: 18px;"></i>
                                <span style="direction: ltr;">adminlharfa@gmail.com</span>
                            </a>
                        </div>
                        
                        <div class="footer-social-grid">
                            <a href="https://facebook.com" target="_blank" rel="noopener" class="social-circle-official" aria-label="Facebook">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                            <a href="https://www.instagram.com/lharfa.ma?igsh=N2NiZHE1YjNqOGUw" target="_blank" rel="noopener" class="social-circle-official" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener" class="social-circle-official" aria-label="LinkedIn">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            </a>
                            <a href="https://wa.me/212783086770" target="_blank" rel="noopener" class="social-circle-official" aria-label="WhatsApp">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </footer>

        <!-- Bottom Copyright Bar -->
        <div class="footer-bottom-bar">
            <div class="container">
                <p>&copy; ${new Date().getFullYear()} lharfa.ma - ${getS('rights_reserved')}</p>
                <p>${getS('proudly_from')}</p>
            </div>
        </div>
    `;

    // Initialize icons if lucide is available
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
});
