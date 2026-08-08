/**
 * BillsnApp - Stripe Payment Integration
 */

const StripePayments = {
    stripe: null,
    initialized: false,

    /**
     * Initialize Stripe
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Load Stripe.js
            if (!window.Stripe) {
                await this.loadStripeJS();
            }

            // Initialize with publishable key
            if (CONFIG.stripe.publicKey && CONFIG.stripe.publicKey !== 'YOUR_STRIPE_PUBLIC_KEY') {
                this.stripe = window.Stripe(CONFIG.stripe.publicKey);
                this.initialized = true;
            }
        } catch (error) {
            console.log('Stripe not configured yet');
        }
    },

    /**
     * Load Stripe.js from CDN
     */
    async loadStripeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Create checkout session for subscription
     */
    async createCheckoutSession(planId) {
        // In production, this would call your backend to create a Stripe Checkout Session
        // For now, we'll simulate it
        
        const plan = CONFIG.pricing.cloud[planId];
        if (!plan) throw new Error('Invalid plan');

        // Simulate checkout
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    plan: planId,
                    message: `Suscripción al plan ${planId} activada (simulado)`
                });
            }, 1000);
        });
    },

    /**
     * Create payment for local license
     */
    async createLocalPayment(licenseType) {
        // In production, this would create a Stripe Payment Intent
        const prices = {
            basic: CONFIG.pricing.local.basic.price,
            pro: CONFIG.pricing.local.pro.price
        };

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    license: licenseType,
                    price: prices[licenseType],
                    message: `Licencia ${licenseType} activada (simulado)`
                });
            }, 1000);
        });
    },

    /**
     * Create payment for credits
     */
    async createCreditPayment(creditAmount) {
        const credit = CONFIG.pricing.credits[creditAmount];
        if (!credit) throw new Error('Invalid credit amount');

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    credits: credit.invoices,
                    price: credit.price,
                    message: `${credit.invoices} créditos añadidos (simulado)`
                });
            }, 1000);
        });
    },

    /**
     * Render subscription management
     */
    async renderSubscriptionManager(lang = 'es') {
        const isEs = lang === 'es';
        const sub = await SupabaseDB.getSubscription();
        const usage = await SupabaseDB.canProcessInvoice();

        return `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${isEs ? 'Tu Suscripción' : 'Your Subscription'}</span>
                </div>
                <div class="card-body">
                    ${sub ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Plan actual' : 'Current plan'}</div>
                                <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}</div>
                            </div>
                            <span class="badge ${sub.status === 'active' ? 'badge-green' : 'badge-orange'}">
                                ${sub.status === 'active' ? (isEs ? 'Activo' : 'Active') : sub.status}
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">
                                <span>${isEs ? 'Facturas usadas' : 'Invoices used'}</span>
                                <span>${sub.invoices_used || 0} / ${sub.invoices_limit === -1 ? '∞' : sub.invoices_limit}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${sub.invoices_limit === -1 ? 0 : Math.min(100, ((sub.invoices_used || 0) / sub.invoices_limit) * 100)}%"></div>
                            </div>
                        </div>
                    ` : `
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            ${isEs ? 'No tienes suscripción activa. Plan Free por defecto.' : 'No active subscription. Free plan by default.'}
                        </p>
                    `}
                    
                    <button class="btn btn-primary" style="width: 100%;" onclick="app.showSection('pricing')">
                        ${isEs ? 'Ver planes' : 'View plans'}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render credits manager (for local version)
     */
    async renderCreditsManager(lang = 'es') {
        const isEs = lang === 'es';
        const credits = await SupabaseDB.getCredits();

        return `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${isEs ? 'Créditos de Facturas' : 'Invoice Credits'}</span>
                </div>
                <div class="card-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; font-weight: 800; color: var(--accent-blue);">${credits}</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'facturas disponibles' : 'invoices available'}</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                        <button class="btn btn-secondary" onclick="StripePayments.buyCredits(500)">
                            500 ${isEs ? 'facturas' : 'invoices'} - 1€
                        </button>
                        <button class="btn btn-secondary" onclick="StripePayments.buyCredits(1000)">
                            1,000 ${isEs ? 'facturas' : 'invoices'} - 2€
                        </button>
                        <button class="btn btn-secondary" onclick="StripePayments.buyCredits(5000)">
                            5,000 ${isEs ? 'facturas' : 'invoices'} - 10€
                        </button>
                        <button class="btn btn-primary" onclick="StripePayments.buyCredits(10000)">
                            10,000 ${isEs ? 'facturas' : 'invoices'} - 20€
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Buy credits
     */
    async buyCredits(amount) {
        try {
            const result = await this.createCreditPayment(amount);
            if (result.success) {
                await SupabaseDB.addCredits(result.credits);
                app.showToast(`${result.credits} créditos añadidos`, 'success');
                app.showSection('settings');
            }
        } catch (error) {
            app.showToast('Error al comprar créditos', 'error');
        }
    },

    /**
     * Subscribe to plan
     */
    async subscribeToPlan(planId) {
        try {
            const result = await this.createCheckoutSession(planId);
            if (result.success) {
                await SupabaseDB.createSubscription({
                    plan: planId,
                    status: 'active',
                    invoices_limit: CONFIG.pricing.cloud[planId]?.invoices || 0,
                    invoices_used: 0
                });
                app.showToast(result.message, 'success');
                app.showSection('settings');
            }
        } catch (error) {
            app.showToast('Error al suscribirse', 'error');
        }
    }
};

// Make globally available
window.StripePayments = StripePayments;
