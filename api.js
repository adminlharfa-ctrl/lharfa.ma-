class APIClient {
    constructor() {
        this.storagePrefix = 'albane_';
        this.supabase = this.createSupabaseClient();
        this.isSupabaseEnabled = Boolean(this.supabase);
        if (!this.isSupabaseEnabled) this.ensureRequiredAccounts();
        console.info(this.isSupabaseEnabled ? 'lharfa.ma API: Supabase enabled' : 'lharfa.ma API: Supabase offline/local mode');
    }

    ensureRequiredAccounts() {
        if (typeof localStorage === 'undefined') return;
        const password = 'Lharfa@2026';
        const requiredAccounts = [
            {
                id: 'client_mohamed_6a6b6s',
                email: 'mohamed6a6b6s@gmail.com',
                name: 'Mohamed',
                phone: '',
                role: 'client',
                city: 'Taroudant',
                specialty: '',
                avatar: '',
                verified: true
            },
            {
                id: 'artisan_mohamed_aitbensaid',
                email: 'mohamedaitbensaid8@gmail.com',
                name: 'Mohamed Ait Bensaid',
                phone: '',
                role: 'artisan',
                city: 'Taroudant',
                specialty: 'general',
                avatar: '',
                verified: true
            },
            {
                id: 'admin_lharfa',
                email: 'adminlharfa@gmail.com',
                name: 'المدير العام',
                phone: '',
                role: 'admin',
                city: 'Taroudant',
                specialty: '',
                avatar: '',
                verified: true
            }
        ];

        try {
            const accounts = JSON.parse(localStorage.getItem('lharfa_local_accounts') || '[]');
            for (const account of requiredAccounts) {
                const existingIndex = accounts.findIndex((item) =>
                    String(item.email || '').toLowerCase() === account.email
                );
                const accountWithPassword = {
                    ...account,
                    passwordHash: this.hashPassword(password)
                };
                delete accountWithPassword.password;
                if (existingIndex >= 0) accounts[existingIndex] = accountWithPassword;
                else accounts.push(accountWithPassword);
            }
            localStorage.setItem('lharfa_local_accounts', JSON.stringify(accounts));

            const artisans = JSON.parse(localStorage.getItem('lharfa_local_artisans') || '[]');
            const artisan = requiredAccounts[1];
            if (!artisans.some((item) => item.user_id === artisan.id || item.id === artisan.id)) {
                artisans.unshift({
                    id: artisan.id,
                    user_id: artisan.id,
                    name: artisan.name,
                    city: artisan.city,
                    spec: artisan.specialty,
                    category: artisan.specialty,
                    phone: '',
                    rating: 5,
                    verified: true,
                    status: 'active'
                });
                localStorage.setItem('lharfa_local_artisans', JSON.stringify(artisans));
            }
        } catch (e) {
            console.warn('Could not ensure required local accounts:', e.message);
        }
    }

    hashPassword(password) {
        let hash = 2166136261;
        const value = String(password || '');
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16);
    }

    createSupabaseClient() {
        try {
            const cfg = window.SUPABASE_CONFIG || {};
            const validUrl = typeof cfg.url === 'string'
                && /^https?:\/\//i.test(cfg.url)
                && !cfg.url.includes('YOUR_')
                && cfg.url !== '******';
            const validKey = typeof cfg.anonKey === 'string'
                && cfg.anonKey !== '******'
                && cfg.anonKey.length >= 20
                && !cfg.anonKey.includes('YOUR_');
            const canUseSupabase = Boolean(window.LHARFA_USE_SUPABASE && window.supabase && validUrl && validKey);
            if (!canUseSupabase) return null;
            return window.supabase.createClient(cfg.url, cfg.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
        } catch (e) {
            console.warn('Supabase client init failed, local mode active:', e.message);
            return null;
        }
    }

    saveLocalAccount(account) {
        try {
            const { password, passwordHash, ...safeAccount } = account;
            if (password) safeAccount.passwordHash = this.hashPassword(password);
            if (passwordHash) safeAccount.passwordHash = passwordHash;
            const accounts = JSON.parse(localStorage.getItem('lharfa_local_accounts') || '[]');
            const idx = accounts.findIndex(a => a.email && a.email.toLowerCase() === (safeAccount.email || '').toLowerCase());
            if (idx >= 0) accounts[idx] = safeAccount;
            else accounts.push(safeAccount);
            localStorage.setItem('lharfa_local_accounts', JSON.stringify(accounts));
        } catch (e) {}
    }

    checkLocalLogin(email, password) {
        try {
            const accounts = JSON.parse(localStorage.getItem('lharfa_local_accounts') || '[]');
            const found = accounts.find(a => a.email && a.email.toLowerCase() === (email || '').toLowerCase());
            if (found && (
                found.passwordHash === this.hashPassword(password) ||
                found.password === password
            )) {
                const user = {
                    id: found.id || 'usr_' + Date.now(),
                    email: found.email,
                    name: found.name || found.email.split('@')[0],
                    role: found.role || 'client',
                    city: found.city || 'تارودانت',
                    phone: found.phone || '',
                    specialty: found.specialty || '',
                    verified: Boolean(found.verified)
                };
                localStorage.setItem('albane_token', 'local-token-' + Date.now());
                localStorage.setItem('albane_user', JSON.stringify(user));
                return { success: true, token: 'local-token-' + Date.now(), user };
            }
        } catch (e) {}
        return null;
    }

    notConfigured(data = []) {
        return { success: false, message: 'Supabase is not configured. Fill supabase-config.js first.', data };
    }

    getLocalUser() {
        try { return JSON.parse(localStorage.getItem('albane_user') || '{}'); }
        catch (e) { return {}; }
    }

    async getCurrentUser() {
        if (!this.isSupabaseEnabled) {
            const user = this.getLocalUser();
            if (!user.email) return { success: false, message: 'No active local session.', user: null };
            return { success: true, user, data: user };
        }
        const { data: authData, error: authError } = await this.supabase.auth.getUser();
        if (authError || !authData.user) {
            localStorage.removeItem('albane_token');
            localStorage.removeItem('albane_user');
            return { success: false, message: authError?.message || 'No active Supabase session.', user: null };
        }

        const fallback = {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.name,
            role: authData.user.user_metadata?.role || 'client',
            phone: authData.user.user_metadata?.phone || '',
            city: authData.user.user_metadata?.city || '',
            specialty: authData.user.user_metadata?.specialty || ''
        };

        let { data: profile, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (!profile && !error) {
            const upsert = await this.supabase.from('profiles').upsert(fallback).select('*').single();
            profile = upsert.data;
            error = upsert.error;
        }

        if (error) return { success: false, message: error.message, user: this.normalizeProfile(null, fallback) };
        const user = this.normalizeProfile(profile, fallback);
        if (user.role === 'artisan') await this.ensureArtisanProfile(user);
        localStorage.setItem('albane_user', JSON.stringify(user));
        return { success: true, user, data: user };
    }

    normalizeProfile(profile, fallback = {}) {
        const data = profile || fallback || {};
        return {
            id: data.id || fallback.id || '',
            name: data.name || fallback.name || (data.email ? data.email.split('@')[0] : 'User'),
            email: data.email || fallback.email || '',
            phone: data.phone || fallback.phone || '',
            role: data.role || fallback.role || 'client',
            city: data.city || fallback.city || '',
            specialty: data.specialty || data.spec || fallback.specialty || '',
            avatar: data.avatar || fallback.avatar || ''
        };
    }

    normalizeArtisan(row) {
        if (!row) return row;
        return {
            ...row,
            avatar: row.avatar || row.image || '',
            isElite: row.isElite ?? row.is_elite ?? false,
            exp: row.exp ?? row.experience_years ?? row.experience ?? 0,
            experience: row.experience ?? row.experience_years ?? row.exp ?? 0,
            spec: row.spec || row.category || row.specialty || '',
            portfolio: row.portfolio || row.gallery || []
        };
    }

    normalizeArtisanPayload(data = {}) {
        const specialty = data.specialty || data.category || data.spec || 'general';
        return {
            user_id: data.id || data.user_id || data.userId || null,
            name: data.name || data.email?.split('@')[0] || 'Artisan',
            city: data.city || 'marrakech',
            category: specialty,
            spec: specialty,
            bio: data.bio || '',
            experience_years: Number(data.experience || data.experience_years || 1),
            image: data.avatar || data.image || '',
            verified: Boolean(data.verified),
            is_elite: Boolean(data.isElite || data.is_elite),
            status: data.status || 'active'
        };
    }

    async ensureArtisanProfile(user) {
        if (!this.isSupabaseEnabled || !user || user.role !== 'artisan') return { success: true, data: null };
        const payload = this.normalizeArtisanPayload(user);
        const { data, error } = await this.supabase
            .from('artisans')
            .upsert(payload, { onConflict: 'user_id' })
            .select('*')
            .single();
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeArtisan(data) };
    }

    normalizeTool(row) {
        if (!row) return row;
        return { ...row, categoryLabel: (row.categoryLabel ?? row.category_label ?? row.category) || '' };
    }

    normalizeBooking(row) {
        if (!row) return row;
        const displayName = row.client || row.artisan || 'U';
        return {
            ...row,
            artisan: row.artisan || row.artisan_name || row.artisanName || 'حرفي',
            client: row.client || row.client_name || row.clientName || 'زبون',
            service: row.service || row.category || 'خدمة',
            location: row.location || row.city || '',
            date: row.date || (row.created_at ? row.created_at.slice(0, 10) : ''),
            status: row.status || 'pending',
            avatar: row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF4500&color=fff`
        };
    }

    async login(email, password) {
        if (this.isSupabaseEnabled) {
            try {
                const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
                if (!error && data && data.user) {
                    let profile = null;
                    try {
                        const profileRes = await this.supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
                        profile = profileRes.data;
                    } catch (e) {}

                    const user = this.normalizeProfile(profile, {
                        id: data.user?.id,
                        email,
                        name: data.user?.user_metadata?.name,
                        role: data.user?.user_metadata?.role || 'client'
                    });
                    localStorage.setItem('albane_token', data.session?.access_token || 'session-' + Date.now());
                    localStorage.setItem('albane_user', JSON.stringify(user));
                    return { success: true, token: localStorage.getItem('albane_token'), user };
                }
                if (error) {
                    const message = error.message?.toLowerCase().includes('email not confirmed')
                        ? 'خاصك تأكد البريد الإلكتروني من الرابط اللي تصيفط ليك قبل تسجيل الدخول.'
                        : error.message;
                    return { success: false, message };
                }
            } catch (networkErr) {
                return { success: false, message: networkErr.message || 'تعذر الاتصال بخدمة تسجيل الدخول.' };
            }
        }

        const localMatch = this.checkLocalLogin(email, password);
        if (localMatch) return localMatch;
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
    }

    async register(form) {
        const validCities = ['taroudant', 'agadir', 'marrakech'];
        const city = String(form.city || '').trim().toLowerCase();
        if (!validCities.includes(city)) {
            return { success: false, message: 'اختار المدينة من المدن المتاحة: تارودانت، أكادير، أو مراكش.' };
        }

        const name = String(form.name || '').normalize('NFC').trim().replace(/\s+/g, ' ');
        const nameParts = name.split(' ');
        if (nameParts.length < 2 || nameParts.some((part) => !/^\p{L}+(?:['’-]\p{L}+)*$/u.test(part))) {
            return { success: false, message: 'دخل الاسم الشخصي والعائلي بحروف عربية أو لاتينية.' };
        }

        let phone = String(form.phone || '').replace(/[^\d+]/g, '');
        if (phone.startsWith('+212')) phone = '0' + phone.slice(4);
        else if (phone.startsWith('00212')) phone = '0' + phone.slice(5);
        else if (phone.startsWith('212')) phone = '0' + phone.slice(3);
        if (!/^0[5-7]\d{8}$/.test(phone)) {
            return { success: false, message: 'دخل رقم هاتف مغربي صحيح، مثال: 0612345678 أو +212612345678.' };
        }

        const metadata = {
            name,
            phone: '+212' + phone.slice(1),
            role: form.role || 'client',
            city,
            specialty: form.specialty || form.category || ''
        };

        if (this.isSupabaseEnabled) {
            try {
                const signupOptions = { data: metadata };
                if (window.location.protocol !== 'file:') {
                    signupOptions.emailRedirectTo = new URL('login.html?verified=1', window.location.href).toString();
                }
                const { data, error } = await this.supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: signupOptions
                });

                if (error) {
                    const message = error.message?.toLowerCase().includes('rate limit')
                        ? 'تجاوزنا مؤقتاً الحد ديال إرسال رسائل التأكيد. تسنى شوية وعاود المحاولة.'
                        : error.message;
                    return { success: false, message };
                }
                if (!data.user) {
                    return { success: false, message: 'تعذر إنشاء الحساب. عاود المحاولة.' };
                }

                if (!data.session) {
                    return {
                        success: true,
                        verificationRequired: true,
                        email: form.email
                    };
                }

                const user = this.normalizeProfile({
                    id: data.user.id,
                    email: data.user.email || form.email,
                    ...metadata
                });
                const { error: profileError } = await this.supabase
                    .from('profiles')
                    .upsert({ id: data.user.id, email: user.email, ...metadata });
                if (profileError) {
                    await this.supabase.auth.signOut();
                    return { success: false, message: profileError.message };
                }
                if (metadata.role === 'artisan') {
                    const artisanResult = await this.ensureArtisanProfile({ id: data.user.id, email: user.email, ...metadata });
                    if (!artisanResult.success) {
                        await this.supabase.auth.signOut();
                        return { success: false, message: artisanResult.message };
                    }
                }
                localStorage.setItem('albane_token', data.session.access_token);
                localStorage.setItem('albane_user', JSON.stringify(user));
                return { success: true, verificationRequired: false, token: data.session.access_token, user };
            } catch (error) {
                return { success: false, message: error.message || 'تعذر الاتصال بخدمة التسجيل.' };
            }
        }

        const localUser = {
            id: 'usr_' + Date.now(),
            email: form.email,
            name: metadata.name,
            phone: form.phone || '',
            role: form.role || 'client',
            city,
            specialty: form.specialty || form.category || '',
            avatar: '',
            verified: false,
            created_at: new Date().toISOString()
        };

        this.saveLocalAccount({ ...localUser, password: form.password });
        localStorage.setItem('albane_token', 'local-token-' + Date.now());
        localStorage.setItem('albane_user', JSON.stringify(localUser));

        if (localUser.role === 'artisan') {
            try {
                const localArtisans = JSON.parse(localStorage.getItem('lharfa_local_artisans') || '[]');
                localArtisans.unshift({
                    id: localUser.id,
                    name: localUser.name,
                    city: localUser.city,
                    spec: localUser.specialty,
                    category: localUser.specialty,
                    phone: localUser.phone,
                    rating: 5.0,
                    verified: false,
                    status: 'نشط'
                });
                localStorage.setItem('lharfa_local_artisans', JSON.stringify(localArtisans));
            } catch (e) {}
        }

        return { success: true, token: 'local-token-' + Date.now(), user: localUser };
    }

    async updateProfile(data) {
        const user = this.getLocalUser();
        if (!user.id) return { success: false, message: 'No logged in user.' };
        const payload = {
            id: user.id,
            email: data.email || user.email || '',
            name: data.name || user.name || '',
            phone: data.phone || '',
            city: data.city || '',
            specialty: data.specialty || data.category || '',
            avatar: data.avatar || user.avatar || '',
            role: data.role || user.role || 'client'
        };
        if (!this.isSupabaseEnabled) {
            const normalized = this.normalizeProfile(payload, payload);
            localStorage.setItem('albane_user', JSON.stringify(normalized));
            this.saveLocalAccount(normalized);
            return { success: true, data: normalized, user: normalized };
        }

        const { data: profile, error } = await this.supabase.from('profiles').upsert(payload).select('*').single();
        if (error) return { success: false, message: error.message };

        if (payload.role === 'artisan') {
            await this.ensureArtisanProfile({ ...user, ...payload, bio: data.bio || '', experience: data.experience || data.experience_years || 1 });
        }

        const normalized = this.normalizeProfile(profile, payload);
        localStorage.setItem('albane_user', JSON.stringify(normalized));
        return { success: true, data: normalized, user: normalized };
    }

    async updatePassword(newPassword) {
        if (!this.isSupabaseEnabled) {
            const user = this.getLocalUser();
            if (!user.email) return { success: false, message: 'No logged in user.' };
            this.saveLocalAccount({ ...user, password: newPassword });
            return { success: true };
        }
        const { error } = await this.supabase.auth.updateUser({ password: newPassword });
        return error ? { success: false, message: error.message } : { success: true };
    }

    async getArtisans(params = {}) {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_artisans') || '[]');
            const filtered = local.filter((row) => {
                if (params.category && row.category !== params.category && row.spec !== params.category) return false;
                if (params.city && row.city !== params.city) return false;
                if (params.q && !String(row.name || '').toLowerCase().includes(String(params.q).toLowerCase())) return false;
                return true;
            });
            return { success: true, data: filtered.map((row) => this.normalizeArtisan(row)) };
        }
        let query = this.supabase.from('artisans').select('*').order('rating', { ascending: false });
        if (params.category) query = query.or(`category.eq.${params.category},spec.eq.${params.category}`);
        if (params.city) query = query.eq('city', params.city);
        if (params.q) query = query.ilike('name', `%${params.q}%`);
        const { data, error } = await query;
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: (data || []).map((row) => this.normalizeArtisan(row)) };
    }

    async getArtisanById(id) {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_artisans') || '[]');
            const user = this.getLocalUser();
            const row = id === 'me'
                ? local.find((item) => item.user_id === user.id || item.id === user.id)
                : local.find((item) => String(item.id) === String(id));
            return { success: Boolean(row), data: this.normalizeArtisan(row), message: row ? undefined : 'Artisan not found.' };
        }
        let query = this.supabase.from('artisans').select('*');
        if (id === 'me') query = query.eq('user_id', this.getLocalUser().id);
        else query = query.eq('id', id);
        const { data, error } = await query.maybeSingle();
        return { success: !error && Boolean(data), data: this.normalizeArtisan(data), message: error?.message };
    }

    async addArtisan(data) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const payload = {
            user_id: data.user_id || data.userId || null,
            name: data.name,
            city: data.city,
            category: data.category || data.specialty,
            spec: data.spec || data.specialty || data.category,
            bio: data.bio || '',
            verified: Boolean(data.verified),
            is_elite: Boolean(data.isElite || data.is_elite),
            status: data.status || 'pending'
        };
        const { data: row, error } = await this.supabase.from('artisans').insert(payload).select('*').single();
        if (!error) await this.addActivity('user-plus', `تسجيل حرفي جديد: ${payload.name}`, 'الآن', '#10B981');
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeArtisan(row) };
    }

    async getTools(params = {}) {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_tools') || '[]');
            return { success: true, data: local.map((row) => this.normalizeTool(row)) };
        }
        let query = this.supabase.from('tools').select('*').order('created_at', { ascending: false });
        if (params.category) query = query.eq('category', params.category);
        if (params.brand) query = query.ilike('brand', params.brand);
        if (params.q) query = query.ilike('name', `%${params.q}%`);
        const { data, error } = await query;
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: (data || []).map((row) => this.normalizeTool(row)) };
    }

    async getToolById(id) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { data, error } = await this.supabase.from('tools').select('*').eq('id', id).maybeSingle();
        return { success: !error && Boolean(data), data: this.normalizeTool(data), message: error?.message };
    }

    async addTool(data) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const payload = {
            name: data.name,
            brand: data.brand,
            category: data.category,
            category_label: data.categoryLabel || data.category_label || data.category,
            description: data.description,
            price: Number(data.price || 0),
            spec: data.spec || '',
            image: data.image,
            badge: data.badge || '',
            stock: Number(data.stock || 0)
        };
        const { data: row, error } = await this.supabase.from('tools').insert(payload).select('*').single();
        if (!error) await this.addActivity('package', `منتج جديد في المتجر: ${payload.name}`, 'الآن', '#FF3F00');
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeTool(row) };
    }

    async deleteTool(id) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { error } = await this.supabase.from('tools').delete().eq('id', id);
        return { success: !error, message: error?.message };
    }

    async getClients() {
        if (!this.isSupabaseEnabled) {
            const accounts = JSON.parse(localStorage.getItem('lharfa_local_accounts') || '[]');
            return { success: true, data: accounts.filter((item) => (item.role || 'client') === 'client') };
        }
        const { data, error } = await this.supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false });
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: data || [] };
    }

    async getBookings(params = {}) {
        if (!this.isSupabaseEnabled) {
            let local = JSON.parse(localStorage.getItem('lharfa_local_bookings') || '[]');
            if (params.status && params.status !== 'all') local = local.filter((row) => row.status === params.status);
            if (params.client_id) local = local.filter((row) => String(row.client_id || '') === String(params.client_id));
            if (params.artisan_id) local = local.filter((row) => String(row.artisan_id || '') === String(params.artisan_id));
            return { success: true, data: local.map((row) => this.normalizeBooking(row)) };
        }
        let query = this.supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (params.status && params.status !== 'all') query = query.eq('status', params.status);
        if (params.client_id) query = query.eq('client_id', params.client_id);
        if (params.artisan_id) query = query.eq('artisan_id', params.artisan_id);
        const { data, error } = await query;
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: (data || []).map((row) => this.normalizeBooking(row)) };
    }

    async addBooking(data) {
        const user = this.getLocalUser();
        const payload = {
            artisan_id: data.artisan_id || data.artisanId,
            client_id: data.client_id || user.id || null,
            artisan: data.artisan || data.artisanName || '',
            client: data.client || data.clientName || user.name || '',
            service: data.service || '',
            city: data.city || user.city || '',
            date: data.date || null,
            notes: data.notes || data.message || '',
            status: data.status || 'pending'
        };
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_bookings') || '[]');
            const row = { ...payload, id: 'BK-' + Date.now(), created_at: new Date().toISOString() };
            local.unshift(row);
            localStorage.setItem('lharfa_local_bookings', JSON.stringify(local));
            return { success: true, data: this.normalizeBooking(row) };
        }
        const { data: row, error } = await this.supabase.from('bookings').insert(payload).select('*').single();
        if (!error) await this.addActivity('calendar-check', `حجز جديد: ${payload.service || payload.artisan}`, 'الآن', '#6366F1');
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeBooking(row) };
    }

    async updateBookingStatus(id, status) {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_bookings') || '[]');
            const idx = local.findIndex((row) => String(row.id) === String(id));
            if (idx < 0) return { success: false, message: 'Booking not found.' };
            local[idx].status = status;
            localStorage.setItem('lharfa_local_bookings', JSON.stringify(local));
            return { success: true, data: this.normalizeBooking(local[idx]) };
        }
        const { data, error } = await this.supabase.from('bookings').update({ status }).eq('id', id).select('*').single();
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeBooking(data) };
    }

    async cancelBooking(id) {
        return this.updateBookingStatus(id, 'cancelled');
    }

    async getActivities() {
        if (!this.isSupabaseEnabled) return this.notConfigured([]);
        const { data, error } = await this.supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(20);
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: data || [] };
    }

    async addActivity(icon, text, time = 'الآن', color = '#FF3F00') {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        await this.supabase.from('activities').insert({ icon, text, time, color });
        return { success: true };
    }

    async getMessages() {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_messages') || '[]');
            return { success: true, data: local };
        }
        const { data, error } = await this.supabase.from('messages').select('*').order('created_at', { ascending: true });
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: data || [] };
    }

    async addMessage(message) {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_messages') || '[]');
            const row = {
                ...message,
                id: message.id || Date.now(),
                timestamp: message.timestamp || new Date().toISOString(),
                created_at: message.created_at || new Date().toISOString()
            };
            local.push(row);
            localStorage.setItem('lharfa_local_messages', JSON.stringify(local));
            return { success: true, data: row };
        }
        const { data, error } = await this.supabase.from('messages').insert(message).select('*').single();
        return error ? { success: false, message: error.message } : { success: true, data };
    }

    async getReviews(artisanId) {
        if (!this.isSupabaseEnabled) {
            let local = JSON.parse(localStorage.getItem('lharfa_local_reviews') || '[]');
            if (artisanId) local = local.filter((row) => String(row.artisan_id || row.artisanId || '') === String(artisanId));
            return { success: true, data: local };
        }
        let query = this.supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (artisanId) query = query.eq('artisan_id', artisanId);
        const { data, error } = await query;
        return error ? { success: false, message: error.message, data: [] } : { success: true, data: data || [] };
    }

    // ==========================================
    // ADMIN PLATFORM MANAGEMENT METHODS
    // ==========================================

    async updateArtisan(id, updates) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { data, error } = await this.supabase.from('artisans').update(updates).eq('id', id).select('*').single();
        if (!error && updates.status === 'banned') {
            await this.addActivity('slash', `تم حظر حرفي (معرف: ${id})`, 'الآن', '#EF4444');
        } else if (!error && updates.verified === true) {
            await this.addActivity('check-circle', `تم توثيق الحرفي (معرف: ${id})`, 'الآن', '#10B981');
        }
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeArtisan(data) };
    }

    async deleteArtisan(id) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { error } = await this.supabase.from('artisans').delete().eq('id', id);
        if (!error) await this.addActivity('trash-2', `حذف حساب حرفي (معرف: ${id})`, 'الآن', '#EF4444');
        return { success: !error, message: error?.message };
    }

    async updateClient(id, updates) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { data, error } = await this.supabase.from('profiles').update(updates).eq('id', id).select('*').single();
        return error ? { success: false, message: error.message } : { success: true, data };
    }

    async deleteClient(id) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { error } = await this.supabase.from('profiles').delete().eq('id', id);
        if (!error) await this.addActivity('user-x', `حذف حساب زبون (معرف: ${id})`, 'الآن', '#EF4444');
        return { success: !error, message: error?.message };
    }

    async updateTool(id, updates) {
        if (!this.isSupabaseEnabled) return this.notConfigured(null);
        const { data, error } = await this.supabase.from('tools').update(updates).eq('id', id).select('*').single();
        return error ? { success: false, message: error.message } : { success: true, data: this.normalizeTool(data) };
    }

    async deleteBooking(id) {
        if (!this.isSupabaseEnabled) {
            const local = JSON.parse(localStorage.getItem('lharfa_local_bookings') || '[]');
            localStorage.setItem('lharfa_local_bookings', JSON.stringify(local.filter((row) => String(row.id) !== String(id))));
            return { success: true };
        }
        const { error } = await this.supabase.from('bookings').delete().eq('id', id);
        return { success: !error, message: error?.message };
    }

    async getNewsletterSubscribers() {
        if (!this.isSupabaseEnabled) return { success: true, data: [] };
        try {
            const { data, error } = await this.supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
            return error ? { success: false, message: error.message, data: [] } : { success: true, data: data || [] };
        } catch (e) {
            return { success: true, data: [] };
        }
    }


}

const api = new APIClient();
window.api = api;
