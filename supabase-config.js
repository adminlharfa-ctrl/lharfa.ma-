/**
 * Supabase public configuration for lharfa.ma.
 * anon/publishable keys are safe to expose in frontend code.
 */
window.SUPABASE_CONFIG = {
    url: 'https://wlhimgwtbnzkjzlmsqnh.supabase.co',
    anonKey: 'sb_publishable_-9LU4OSr0ZiAXLZ5qmyZFA_-32AGPDi'
};

window.LHARFA_USE_SUPABASE = Boolean(
    window.SUPABASE_CONFIG.url &&
    window.SUPABASE_CONFIG.anonKey &&
    /^https?:\/\//i.test(window.SUPABASE_CONFIG.url) &&
    !window.SUPABASE_CONFIG.url.includes('YOUR_') &&
    window.SUPABASE_CONFIG.anonKey.length >= 20 &&
    !window.SUPABASE_CONFIG.anonKey.includes('YOUR_')
);
