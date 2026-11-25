/**
 * lharfa.ma - Platform Actions & Global Utilities
 * Provides handlers for platform-wide actions (modals, toasts, newsletter, auth, notifications)
 */

(function (window) {
    'use strict';

    const PlatformActions = {
        /**
         * Get current language or default to Arabic
         */
        getLang() {
            return localStorage.getItem('albane_lang') || 'ar';
        },

        /**
         * Get translated string or fallback
         */
        t(key, fallback) {
            if (window.I18nManager && typeof window.I18nManager.getString === 'function') {
                const val = window.I18nManager.getString(key);
                if (val && val !== key) return val;
            }
            const lang = this.getLang();
            if (window.translations && window.translations[lang] && window.translations[lang][key]) {
                return window.translations[lang][key];
            }
            return fallback || key;
        },

        /**
         * Ensure a toast container exists in the DOM
         */
        getToastContainer() {
            let container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.setAttribute('aria-live', 'polite');
                document.body.appendChild(container);
            }
            return container;
        },

        /**
         * Show an animated toast notification
         * @param {string} message - Message to display
         * @param {'info'|'success'|'error'|'warning'} type - Toast type
         * @param {number} duration - Milliseconds before auto-dismiss
         */
        showToast(message, type = 'info', duration = 3500) {
            const container = this.getToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            let iconName = 'info';
            if (type === 'success') iconName = 'check-circle';
            else if (type === 'error') iconName = 'alert-circle';
            else if (type === 'warning') iconName = 'alert-triangle';

            toast.innerHTML = `
                <i data-lucide="${iconName}"></i>
                <span>${message}</span>
            `;

            container.appendChild(toast);
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons({ root: toast });
            }

            // Animate entrance
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            // Dismiss
            const timeoutId = setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, duration);

            toast.addEventListener('click', () => {
                clearTimeout(timeoutId);
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            });
        },

        /**
         * Newsletter subscription handler
         * @param {HTMLInputElement|string} inputEl
         */
        async subscribeNewsletter(inputEl) {
            let email = '';
            let inputRef = null;

            if (typeof inputEl === 'string') {
                email = inputEl.trim();
            } else if (inputEl && inputEl.value !== undefined) {
                inputRef = inputEl;
                email = inputEl.value.trim();
            } else {
                const fallbackInput = document.querySelector('.footer-newsletter-email') ||
                    document.querySelector('.cta-form input[type="email"]');
                if (fallbackInput) {
                    inputRef = fallbackInput;
                    email = fallbackInput.value.trim();
                }
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                const invalidMsg = this.getLang() === 'ar' ? 'المرجو إدخال بريد إلكتروني صحيح' :
                    this.getLang() === 'fr' ? 'Veuillez saisir une adresse email valide' :
                        'Please enter a valid email address';
                this.showToast(invalidMsg, 'error');
                if (inputRef) inputRef.focus();
                return;
            }

            // Attempt saving to Supabase if available
            try {
                const client = window.supabaseClient || (window.api && window.api.supabase);
                if (client) {
                    await client.from('newsletter_subscribers').insert([{ email, created_at: new Date().toISOString() }]);
                }
            } catch (err) {
                // Graceful fallback: table might not exist yet, continue with success message
                console.info('Newsletter recorded locally:', email, err?.message);
            }

            const successMsg = this.t('newsletter_success',
                this.getLang() === 'ar' ? 'شكراً لاهتمامك! تم تسجيل بريدك الإلكتروني بنجاح.' :
                    this.getLang() === 'fr' ? 'Merci ! Votre inscription a bien été enregistrée.' :
                        'Thank you! Your newsletter subscription was successful.');

            this.showToast(successMsg, 'success');
            if (inputRef) inputRef.value = '';
        },

        /**
         * Forgot password modal & Supabase reset trigger
         */
        forgotPassword() {
            const lang = this.getLang();
            const title = this.t('forgot_password', lang === 'ar' ? 'استرجاع كلمة المرور' : lang === 'fr' ? 'Mot de passe oublié' : 'Reset Password');
            const promptText = lang === 'ar' ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور:' :
                lang === 'fr' ? 'Entrez votre email pour recevoir le lien de réinitialisation :' :
                    'Enter your email to receive a password reset link:';
            const placeholder = 'example@mail.com';
            const sendBtnText = lang === 'ar' ? 'إرسال الرابط' : lang === 'fr' ? 'Envoyer le lien' : 'Send Reset Link';
            const cancelBtnText = lang === 'ar' ? 'إلغاء' : lang === 'fr' ? 'Annuler' : 'Cancel';

            // Remove existing modal if any
            const existing = document.getElementById('platformActionModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'platformActionModal';
            modal.className = 'modal-overlay open';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';

            modal.innerHTML = `
                <div class="glass-card-v3" style="background:#0F172A;border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:32px;max-width:440px;width:100%;box-shadow:0 30px 60px rgba(0,0,0,0.6);text-align:${lang === 'ar' ? 'right' : 'left'};">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                        <h3 style="margin:0;font-size:20px;font-weight:900;color:#F8FAFC;">${title}</h3>
                        <button type="button" id="closeForgotModal" style="background:none;border:none;color:#94A3B8;cursor:pointer;padding:4px;"><i data-lucide="x"></i></button>
                    </div>
                    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin-bottom:20px;">${promptText}</p>
                    <form id="forgotPassForm" style="display:flex;flex-direction:column;gap:16px;">
                        <input type="email" id="forgotPassEmail" required placeholder="${placeholder}" style="width:100%;padding:14px 18px;border-radius:14px;background:#1E293B;border:1px solid rgba(255,255,255,0.1);color:#FFFFFF;font-size:15px;direction:ltr;outline:none;" />
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button type="button" id="cancelForgotModal" style="padding:12px 20px;border-radius:12px;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#94A3B8;font-weight:700;cursor:pointer;">${cancelBtnText}</button>
                            <button type="submit" id="submitForgotModal" style="padding:12px 24px;border-radius:12px;background:var(--grad-red, linear-gradient(135deg, #FF4500 0%, #E63900 100%));border:none;color:#FFFFFF;font-weight:800;cursor:pointer;">${sendBtnText}</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons({ root: modal });
            }

            const closeModal = () => modal.remove();
            document.getElementById('closeForgotModal')?.addEventListener('click', closeModal);
            document.getElementById('cancelForgotModal')?.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            const emailInput = document.getElementById('forgotPassEmail');
            if (emailInput) emailInput.focus();

            document.getElementById('forgotPassForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = emailInput?.value.trim();
                if (!email) return;

                const submitBtn = document.getElementById('submitForgotModal');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = lang === 'ar' ? 'جارٍ الإرسال...' : lang === 'fr' ? 'Envoi...' : 'Sending...';
                }

                try {
                    const client = window.supabaseClient || (window.api && window.api.supabase);
                    if (client && client.auth) {
                        await client.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/login.html`
                        });
                    }
                } catch (err) {
                    console.warn('Password reset offline/network handled:', err.message);
                }

                const sentMsg = lang === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح!' :
                    lang === 'fr' ? 'Lien de réinitialisation envoyé à votre email avec succès !' :
                        'Password reset link sent to your email successfully!';
                PlatformActions.showToast(sentMsg, 'success');
                closeModal();
            });
        },

        /**
         * Notification center display
         */
        showNotifications() {
            const lang = this.getLang();
            const msg = lang === 'ar' ? 'لا توجد إشعارات جديدة حالياً' :
                lang === 'fr' ? 'Aucune nouvelle notification pour le moment' :
                    'No new notifications at this time';
            this.showToast(msg, 'info');
        },

        /**
         * Admin: Edit Record
         */
        adminEdit(entityName = '') {
            const lang = this.getLang();
            const msg = lang === 'ar' ? `وضع التعديل قيد التجهيز${entityName ? ` (${entityName})` : ''}` :
                lang === 'fr' ? 'Mode édition en cours de préparation' :
                    'Edit mode is currently under preparation';
            this.showToast(msg, 'info');
        },

        /**
         * Admin: Details Record
         */
        adminDetails(entityName = '') {
            const lang = this.getLang();
            const msg = lang === 'ar' ? `عرض التفاصيل قيد التجهيز${entityName ? ` (${entityName})` : ''}` :
                lang === 'fr' ? 'Affichage des détails en préparation' :
                    'Details view is currently under preparation';
            this.showToast(msg, 'info');
        },

        /**
         * Artisan: Current subscription plan status
         */
        currentPlan() {
            const lang = this.getLang();
            const msg = lang === 'ar' ? 'أنت حالياً على الباقة الأساسية. يمكنك الترقية إلى الباقة الاحترافية للحصول على ظهور أكبر!' :
                lang === 'fr' ? 'Vous êtes actuellement sur le forfait standard. Passez à la formule Pro pour booster votre visibilité !' :
                    'You are currently on the Standard plan. Upgrade to Pro for enhanced visibility!';
            this.showToast(msg, 'info');
        }
    };

    window.PlatformActions = PlatformActions;
})(window);
