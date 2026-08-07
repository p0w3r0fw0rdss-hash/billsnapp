/**
 * BillSnap - Billing & Subscription System
 * Manages plans, limits, and payment integration
 */

const Billing = {
    // Current plan
    currentPlan: null,
    
    // Available plans
    plans: {
        free: {
            id: 'free',
            name: 'Free',
            nameEs: 'Gratis',
            price: 0,
            currency: 'EUR',
            interval: 'month',
            invoicesPerMonth: 25,
            features: [
                'Tesseract OCR (local)',
                '25 facturas/mes',
                'Exportar CSV/JSON',
                'Informes básicos',
                '1 usuario'
            ],
            featuresEs: [
                'Tesseract OCR (local)',
                '25 facturas/mes',
                'Exportar CSV/JSON',
                'Informes básicos',
                '1 usuario'
            ],
            ocrEngines: ['tesseract'],
            users: 1,
            storage: '5MB'
        },
        starter: {
            id: 'starter',
            name: 'Starter',
            nameEs: 'Inicial',
            price: 4.99,
            currency: 'EUR',
            interval: 'month',
            invoicesPerMonth: 200,
            features: [
                'IA Nativa (alta precisión)',
                '200 facturas/mes',
                'Exportar CSV/JSON/PDF',
                'Todos los informes',
                'Google Sheets',
                '3 usuarios'
            ],
            featuresEs: [
                'IA Nativa (alta precisión)',
                '200 facturas/mes',
                'Exportar CSV/JSON/PDF',
                'Todos los informes',
                'Google Sheets',
                '3 usuarios'
            ],
            ocrEngines: ['tesseract', 'native'],
            users: 3,
            storage: '50MB'
        },
        pro: {
            id: 'pro',
            name: 'Pro',
            nameEs: 'Profesional',
            price: 9.99,
            currency: 'EUR',
            interval: 'month',
            invoicesPerMonth: 1000,
            popular: true,
            features: [
                'IA Nativa + API externa',
                '1,000 facturas/mes',
                'Exportar todos los formatos',
                'Informes avanzados',
                'Google Sheets',
                'Envío email',
                '10 usuarios',
                'Soporte prioritario'
            ],
            featuresEs: [
                'IA Nativa + API externa',
                '1,000 facturas/mes',
                'Exportar todos los formatos',
                'Informes avanzados',
                'Google Sheets',
                'Envío email',
                '10 usuarios',
                'Soporte prioritario'
            ],
            ocrEngines: ['tesseract', 'native', 'api'],
            users: 10,
            storage: '500MB'
        },
        business: {
            id: 'business',
            name: 'Business',
            nameEs: 'Negocio',
            price: 24.99,
            currency: 'EUR',
            interval: 'month',
            invoicesPerMonth: 5000,
            features: [
                'Todo de Pro',
                '5,000 facturas/mes',
                'API REST',
                'Usuarios ilimitados',
                'Personalización',
                'Soporte 24/7'
            ],
            featuresEs: [
                'Todo de Pro',
                '5,000 facturas/mes',
                'API REST',
                'Usuarios ilimitados',
                'Personalización',
                'Soporte 24/7'
            ],
            ocrEngines: ['tesseract', 'native', 'api', 'ollama'],
            users: -1, // Unlimited
            storage: '5GB'
        },
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            nameEs: 'Empresa',
            price: 49.99,
            currency: 'EUR',
            interval: 'month',
            invoicesPerMonth: -1, // Unlimited
            features: [
                'Todo ilimitado',
                'IA personalizada',
                'Modelos fine-tuned',
                'SLA garantizado',
                'On-premise disponible',
                'Manager dedicado'
            ],
            featuresEs: [
                'Todo ilimitado',
                'IA personalizada',
                'Modelos fine-tuned',
                'SLA garantizado',
                'On-premise disponible',
                'Manager dedicado'
            ],
            ocrEngines: ['tesseract', 'native', 'api', 'ollama', 'custom'],
            users: -1,
            storage: 'Unlimited'
        }
    },

    /**
     * Initialize billing system
     */
    async init() {
        // Load current plan from settings
        const savedPlan = await DB.getSetting('billing_plan');
        this.currentPlan = savedPlan || 'free';
        
        // Load usage data
        await this.loadUsage();
        
        return this.currentPlan;
    },

    /**
     * Load current month usage
     */
    async loadUsage() {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const usage = await DB.getSetting(`usage_${monthKey}`);
        this.currentUsage = usage || {
            invoicesProcessed: 0,
            month: monthKey
        };
        
        return this.currentUsage;
    },

    /**
     * Get current plan details
     */
    getCurrentPlan() {
        return this.plans[this.currentPlan] || this.plans.free;
    },

    /**
     * Get all plans
     */
    getAllPlans() {
        return Object.values(this.plans);
    },

    /**
     * Check if user can process more invoices
     */
    async canProcessInvoice() {
        const plan = this.getCurrentPlan();
        const usage = await this.loadUsage();
        
        if (plan.invoicesPerMonth === -1) {
            return { allowed: true, remaining: -1 }; // Unlimited
        }
        
        const remaining = plan.invoicesPerMonth - usage.invoicesProcessed;
        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            limit: plan.invoicesPerMonth,
            used: usage.invoicesProcessed
        };
    },

    /**
     * Record invoice processing
     */
    async recordInvoiceProcessed() {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const usage = await this.loadUsage();
        usage.invoicesProcessed++;
        
        await DB.saveSetting(`usage_${monthKey}`, usage);
        this.currentUsage = usage;
        
        return usage;
    },

    /**
     * Check if OCR engine is available for current plan
     */
    isEngineAvailable(engine) {
        const plan = this.getCurrentPlan();
        return plan.ocrEngines.includes(engine);
    },

    /**
     * Upgrade plan
     */
    async upgradePlan(planId) {
        if (!this.plans[planId]) {
            throw new Error('Invalid plan');
        }
        
        this.currentPlan = planId;
        await DB.saveSetting('billing_plan', planId);
        
        return this.plans[planId];
    },

    /**
     * Get usage stats for dashboard
     */
    async getUsageStats() {
        const plan = this.getCurrentPlan();
        const usage = await this.loadUsage();
        
        return {
            plan: plan,
            invoicesUsed: usage.invoicesProcessed,
            invoicesLimit: plan.invoicesPerMonth,
            invoicesRemaining: plan.invoicesPerMonth === -1 ? -1 : 
                Math.max(0, plan.invoicesPerMonth - usage.invoicesProcessed),
            percentage: plan.invoicesPerMonth === -1 ? 0 : 
                Math.round((usage.invoicesProcessed / plan.invoicesPerMonth) * 100)
        };
    },

    /**
     * Render pricing page
     */
    renderPricingPage(lang = 'es') {
        const plans = this.getAllPlans();
        const isEs = lang === 'es';
        
        return `
            <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 48px;">
                    <h1 style="font-size: 36px; font-weight: 700; margin-bottom: 12px;">
                        ${isEs ? 'Elige tu plan' : 'Choose your plan'}
                    </h1>
                    <p style="font-size: 18px; color: var(--text-secondary);">
                        ${isEs ? 'Comienza gratis, escala cuando necesites' : 'Start free, scale when you need'}
                    </p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                    ${plans.map(plan => `
                        <div class="card ${plan.popular ? 'card-popular' : ''}" style="position: relative; ${plan.popular ? 'border: 2px solid var(--accent-blue); transform: scale(1.05);' : ''}">
                            ${plan.popular ? `
                                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent-blue); color: white; padding: 4px 16px; border-radius: 100px; font-size: 12px; font-weight: 600;">
                                    ${isEs ? 'Popular' : 'Popular'}
                                </div>
                            ` : ''}
                            
                            <div class="card-body" style="text-align: center;">
                                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">
                                    ${isEs ? plan.nameEs : plan.name}
                                </h3>
                                
                                <div style="margin-bottom: 20px;">
                                    <span style="font-size: 36px; font-weight: 700;">${plan.price === 0 ? (isEs ? 'Gratis' : 'Free') : '€' + plan.price}</span>
                                    ${plan.price > 0 ? `<span style="font-size: 14px; color: var(--text-tertiary);">/${isEs ? 'mes' : 'month'}</span>` : ''}
                                </div>
                                
                                <ul style="text-align: left; list-style: none; padding: 0; margin-bottom: 24px;">
                                    ${(isEs ? plan.featuresEs : plan.features).map(f => `
                                        <li style="padding: 6px 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                            ${f}
                                        </li>
                                    `).join('')}
                                </ul>
                                
                                <button class="btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;" onclick="Billing.selectPlan('${plan.id}')">
                                    ${this.currentPlan === plan.id ? 
                                        (isEs ? 'Plan actual' : 'Current plan') : 
                                        (isEs ? 'Seleccionar' : 'Select')}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Select a plan
     */
    async selectPlan(planId) {
        if (planId === this.currentPlan) {
            return;
        }

        const plan = this.plans[planId];
        if (!plan) return;

        if (plan.price === 0) {
            // Free plan - just switch
            await this.upgradePlan(planId);
            window.location.reload();
            return;
        }

        // Show payment modal
        this.showPaymentModal(plan);
    },

    /**
     * Show payment modal
     */
    showPaymentModal(plan) {
        const isEs = i18n.getLang() === 'es';
        const modal = document.getElementById('modal-content');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Completar suscripción' : 'Complete subscription'}</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div style="background: var(--bg-secondary); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Plan' : 'Plan'}</div>
                            <div style="font-size: 20px; font-weight: 600;">${isEs ? plan.nameEs : plan.name}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Precio' : 'Price'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-blue);">€${plan.price}/${isEs ? 'mes' : 'month'}</div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">${isEs ? 'Número de tarjeta' : 'Card number'}</label>
                    <input type="text" class="form-input" placeholder="4242 4242 4242 4242" maxlength="19">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">${isEs ? 'Fecha expiración' : 'Expiry date'}</label>
                        <input type="text" class="form-input" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">CVC</label>
                        <input type="text" class="form-input" placeholder="123" maxlength="4">
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <img src="https://js.stripe.com/v3/fingerprinted/img/visa-36760ba3aa7e6dc5cb4c3607977ba381.svg" height="24" alt="Visa">
                    <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-48e5aa2d2e9b7ad3f047c0dd5ca82191.svg" height="24" alt="Mastercard">
                </div>

                <div id="payment-error" class="hidden" style="color: var(--accent-red); font-size: 13px; margin-bottom: 16px;"></div>

                <button class="btn btn-primary btn-lg" style="width: 100%;" onclick="Billing.processPayment('${plan.id}')">
                    ${isEs ? `Pagar €${plan.price}/mes` : `Pay €${plan.price}/month`}
                </button>

                <p style="text-align: center; font-size: 12px; color: var(--text-tertiary); margin-top: 16px;">
                    ${isEs ? 'Pago seguro procesado por Stripe' : 'Secure payment processed by Stripe'}
                </p>
            </div>
        `;

        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Process payment (demo - in production use Stripe)
     */
    async processPayment(planId) {
        const isEs = i18n.getLang() === 'es';
        const errorEl = document.getElementById('payment-error');
        
        try {
            // In production, this would integrate with Stripe
            // For demo, we'll simulate a successful payment
            
            // Simulate processing
            const btn = document.querySelector('.btn-primary.btn-lg');
            btn.disabled = true;
            btn.textContent = isEs ? 'Procesando...' : 'Processing...';
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Upgrade plan
            await this.upgradePlan(planId);
            
            // Close modal
            app.closeModal();
            
            // Show success
            app.showToast(
                isEs ? `¡Plan ${this.plans[planId].nameEs} activado!` : 
                       `${this.plans[planId].name} plan activated!`, 
                'success'
            );
            
            // Reload to show new features
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    },

    /**
     * Render usage indicator for sidebar/header
     */
    async renderUsageIndicator() {
        const stats = await this.getUsageStats();
        const isEs = i18n.getLang() === 'es';
        const plan = stats.plan;
        
        if (plan.invoicesPerMonth === -1) {
            return `
                <div style="padding: 12px; background: var(--accent-green-light); border-radius: 8px; font-size: 13px;">
                    <strong>${isEs ? 'Facturas ilimitadas' : 'Unlimited invoices'}</strong>
                </div>
            `;
        }

        const percentage = stats.percentage;
        const color = percentage > 90 ? 'var(--accent-red)' : 
                      percentage > 70 ? 'var(--accent-orange)' : 'var(--accent-green)';

        return `
            <div style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                    <span style="color: var(--text-secondary);">${isEs ? 'Facturas este mes' : 'Invoices this month'}</span>
                    <span style="font-weight: 600;">${stats.invoicesUsed}/${stats.invoicesLimit}</span>
                </div>
                <div class="progress-bar" style="height: 6px;">
                    <div class="progress-fill" style="width: ${percentage}%; background: ${color};"></div>
                </div>
                ${percentage > 80 ? `
                    <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: 8px;" onclick="app.showSection('pricing')">
                        ${isEs ? 'Mejorar plan' : 'Upgrade plan'}
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Check and show upgrade prompt if needed
     */
    async checkAndPromptUpgrade() {
        const canProcess = await this.canProcessInvoice();
        
        if (!canProcess.allowed) {
            const isEs = i18n.getLang() === 'es';
            
            // Show upgrade modal
            const modal = document.getElementById('modal-content');
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">${isEs ? 'Límite alcanzado' : 'Limit reached'}</h3>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="1.5" style="margin: 0 auto 20px;">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <p style="font-size: 16px; margin-bottom: 8px;">
                        ${isEs ? 'Has alcanzado el límite de facturas de tu plan' : 
                                 'You have reached your plan invoice limit'}
                    </p>
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px;">
                        ${isEs ? `Has procesado ${canProcess.used} de ${canProcess.limit} facturas este mes` :
                                 `You have processed ${canProcess.used} of ${canProcess.limit} invoices this month`}
                    </p>
                    <button class="btn btn-primary btn-lg" style="width: 100%;" onclick="app.showSection('pricing')">
                        ${isEs ? 'Ver planes' : 'View plans'}
                    </button>
                </div>
            `;
            
            document.getElementById('modal-overlay').classList.add('active');
            return false;
        }
        
        return true;
    }
};

// Make globally available
window.Billing = Billing;
