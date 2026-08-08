/**
 * BillsnApp - Authentication with Supabase
 */

const SupabaseAuth = {
    user: null,
    session: null,

    /**
     * Initialize auth
     */
    async init() {
        try {
            // Initialize Supabase client
            await SupabaseClient.init();
            
            // Check existing session
            this.session = await SupabaseClient.getSession();
            if (this.session) {
                this.user = await SupabaseClient.getUser();
            }

            // Listen for auth changes
            SupabaseClient.onAuthStateChange((event, session) => {
                this.session = session;
                this.user = session?.user || null;
                
                if (event === 'SIGNED_IN') {
                    console.log('User signed in:', this.user?.email);
                } else if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                    window.location.reload();
                }
            });

            return this.user;
        } catch (error) {
            console.error('Auth init error:', error);
            return null;
        }
    },

    /**
     * Sign up
     */
    async signUp(email, password, name) {
        try {
            const data = await SupabaseClient.signUp(email, password, name);
            this.user = data.user;
            this.session = data.session;
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Sign in
     */
    async signIn(email, password) {
        try {
            const data = await SupabaseClient.signIn(email, password);
            this.user = data.user;
            this.session = data.session;
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            const data = await SupabaseClient.signInWithGoogle();
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        await SupabaseClient.signOut();
        this.user = null;
        this.session = null;
    },

    /**
     * Check if logged in
     */
    isLoggedIn() {
        return !!this.user;
    },

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    },

    /**
     * Get user ID
     */
    getUserId() {
        return this.user?.id;
    },

    /**
     * Render login form
     */
    renderLoginForm() {
        const isEs = i18n?.getLang() === 'es';
        
        return `
            <div class="login-container">
                <div class="login-card">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <img src="/public/icons/logo.png" alt="BillsnApp" style="width: 64px; height: 64px; border-radius: 16px; margin-bottom: 16px;">
                        <h1 style="font-size: 28px; font-weight: 800; color: #1d1d1f; margin-bottom: 4px;">BillsnApp</h1>
                        <p style="font-size: 14px; color: #6e6e73;">${isEs ? 'Inicia sesión para continuar' : 'Sign in to continue'}</p>
                    </div>
                    
                    <form id="login-form" onsubmit="SupabaseAuth.handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label">${isEs ? 'Email' : 'Email'}</label>
                            <input type="email" id="login-email" class="form-input" placeholder="tu@email.com" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${isEs ? 'Contraseña' : 'Password'}</label>
                            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
                        </div>
                        <div id="login-error" class="hidden" style="color: #ff3b30; font-size: 13px; margin-bottom: 16px; text-align: center;"></div>
                        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
                            ${isEs ? 'Iniciar sesión' : 'Sign in'}
                        </button>
                    </form>
                    
                    <div style="text-align: center; margin-top: 16px;">
                        <button onclick="SupabaseAuth.handleGoogleLogin()" class="btn btn-secondary" style="width: 100%;">
                            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            ${isEs ? 'Continuar con Google' : 'Continue with Google'}
                        </button>
                    </div>
                    
                    <p style="text-align: center; font-size: 13px; color: #86868b; margin-top: 24px;">
                        ${isEs ? '¿No tienes cuenta?' : "Don't have an account?"} 
                        <a href="#" onclick="SupabaseAuth.showRegister(); return false;" style="color: #0071e3; text-decoration: none; font-weight: 500;">
                            ${isEs ? 'Regístrate' : 'Sign up'}
                        </a>
                    </p>
                </div>
            </div>
        `;
    },

    /**
     * Show register form
     */
    showRegister() {
        const isEs = i18n?.getLang() === 'es';
        const modal = document.getElementById('modal-content');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Crear cuenta' : 'Create account'}</h3>
                <button class="btn btn-ghost btn-icon" onclick="document.getElementById('modal-overlay').classList.remove('active')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="register-form" onsubmit="SupabaseAuth.handleRegister(event)">
                    <div class="form-group">
                        <label class="form-label">${isEs ? 'Nombre' : 'Name'}</label>
                        <input type="text" id="register-name" class="form-input" placeholder="${isEs ? 'Tu nombre' : 'Your name'}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" id="register-email" class="form-input" placeholder="tu@email.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${isEs ? 'Contraseña' : 'Password'}</label>
                        <input type="password" id="register-password" class="form-input" placeholder="••••••••" required minlength="6">
                    </div>
                    <div id="register-error" class="hidden" style="color: #ff3b30; font-size: 13px; margin-bottom: 16px;"></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        ${isEs ? 'Crear cuenta' : 'Create account'}
                    </button>
                </form>
            </div>
        `;
        
        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Handle login
     */
    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            errorEl.classList.add('hidden');
            await this.signIn(email, password);
            window.location.reload();
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    },

    /**
     * Handle register
     */
    async handleRegister(event) {
        event.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');

        try {
            errorEl.classList.add('hidden');
            await this.signUp(email, password, name);
            document.getElementById('modal-overlay').classList.remove('active');
            window.location.reload();
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    },

    /**
     * Handle Google login
     */
    async handleGoogleLogin() {
        try {
            await this.signInWithGoogle();
        } catch (error) {
            console.error('Google login error:', error);
        }
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        await this.signOut();
    }
};

// Make globally available
window.SupabaseAuth = SupabaseAuth;
