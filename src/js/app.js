/**
 * BillSnap - Main Application Controller
 * Professional invoicing app with AI-powered OCR
 */

const app = {
    // State
    currentSection: 'upload',
    uploadQueue: [],
    extractedInvoices: [],
    processingInProgress: false,
    sortField: 'date',
    sortAscending: true,
    darkMode: false,
    charts: { monthly: null, categories: null },

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize i18n
            await i18n.init();

            // Initialize database
            await DB.init();

            // Load theme preference
            this.darkMode = localStorage.getItem('billsnap_dark') === 'true';
            this.applyTheme();

            // Initialize authentication
            const currentUser = await Auth.init();

            // Check if user is logged in
            if (!Auth.isLoggedIn()) {
                this.renderLoginScreen();
                return;
            }

            // Initialize billing
            await Billing.init();

            // Initialize companies
            await Companies.init();

            // Initialize email
            await Email.loadConfig();

            // Initialize accounting
            await Accounting.init();

            // Detect available AI engines
            await this.detectAIEngines();

            // Load configurations
            await AIAPI.loadConfig();
            await GoogleSheets.loadConfig();

            // Render main app
            this.renderApp();

            // Load data
            const count = await DB.getInvoiceCount();
            if (count > 0) {
                await this.loadDashboard();
                await this.loadInvoices();
            }

            // Show AI status
            const aiStatus = this.getAIStatusText();
            this.showToast(`${i18n.t('auth.welcome', { name: currentUser.name })} · ${aiStatus}`, 'success');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showToast('Error initializing application', 'error');
        }
    },

    /**
     * Detect available AI engines
     */
    async detectAIEngines() {
        this.aiEngines = {
            webllm: false,
            ollama: false,
            visionai: false,
            webgpu: false
        };

        // Check WebGPU
        const gpuCheck = await WebLLMAI.checkWebGPU();
        this.aiEngines.webgpu = gpuCheck.available;

        // Check Ollama
        try {
            const response = await fetch('http://localhost:11434/api/tags', { 
                signal: AbortSignal.timeout(2000) 
            });
            this.aiEngines.ollama = response.ok;
        } catch {}

        // Check Vision AI
        await VisionAI.init();
        this.aiEngines.visionai = VisionAI.isAvailable();

        // Check WebLLM (needs WebGPU)
        if (this.aiEngines.webgpu) {
            this.aiEngines.webllm = true; // Available but not loaded yet
        }

        console.log('AI Engines detected:', this.aiEngines);
    },

    /**
     * Get AI status text
     */
    getAIStatusText() {
        const isEs = i18n.getLang() === 'es';
        
        if (this.aiEngines.ollama || this.aiEngines.visionai) {
            return isEs ? '🧠 Vision AI lista' : '🧠 Vision AI ready';
        }
        if (this.aiEngines.webllm) {
            return isEs ? '⚡ WebLLM disponible' : '⚡ WebLLM available';
        }
        return isEs ? '💡 Configura IA en Ajustes' : '💡 Configure AI in Settings';
    },

    /**
     * Pre-load native AI in background
     */
    async preloadNativeAI() {
        try {
            // Check if device supports native AI
            const memory = navigator.deviceMemory || 4;
            if (memory >= 4) {
                console.log('Pre-loading native AI...');
                await NativeAI.init('auto');
                console.log('Native AI ready');
            }
        } catch (error) {
            console.log('Native AI pre-load skipped:', error.message);
        }
    },

    /**
     * Apply theme
     */
    applyTheme() {
        document.documentElement.classList.toggle('dark', this.darkMode);
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('billsnap_dark', this.darkMode);
        this.applyTheme();
    },

    /**
     * Switch language
     */
    async switchLang(lang) {
        await i18n.setLang(lang);
        this.renderApp();
        this.showToast(lang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English', 'info');
    },

    /**
     * Render login screen
     */
    renderLoginScreen() {
        const appEl = document.getElementById('app');
        appEl.innerHTML = `
            <div class="login-container">
                <div class="login-card animate-in">
                    <div class="login-logo">
                        <div style="width: 56px; height: 56px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <img src="public/icons/logo.png" alt="BillSnap" style="width: 40px; height: 40px; object-fit: contain;">
                        </div>
                    </div>
                    <h1 class="login-title">BillSnap</h1>
                    <p class="login-subtitle">${i18n.t('app.tagline')}</p>
                    
                    <form id="login-form" onsubmit="app.handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label">${i18n.t('auth.username')}</label>
                            <input type="text" id="login-username" class="form-input" placeholder="${i18n.t('auth.username')}" required autofocus>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('auth.password')}</label>
                            <input type="password" id="login-password" class="form-input" placeholder="${i18n.t('auth.password')}" required>
                        </div>
                        <div id="login-error" class="hidden" style="color: var(--accent-red); font-size: 13px; margin-bottom: 16px; text-align: center;"></div>
                        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
                            ${i18n.t('auth.login')}
                        </button>
                    </form>
                    
                    <p style="text-align: center; font-size: 13px; color: var(--text-tertiary); margin-top: 24px;">
                        ${i18n.t('auth.default')}
                    </p>
                    
                    <div style="display: flex; justify-content: center; gap: 8px; margin-top: 16px;">
                        <button onclick="app.switchLang('es')" class="lang-selector">🇪🇸 Español</button>
                        <button onclick="app.switchLang('en')" class="lang-selector">🇬🇧 English</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Handle login
     */
    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            await Auth.login(username, password);
            window.location.reload();
        } catch (error) {
            errorEl.textContent = i18n.t('auth.invalid');
            errorEl.classList.remove('hidden');
        }
    },

    /**
     * Render main application
     */
    renderApp() {
        const user = Auth.getCurrentUser();
        const appEl = document.getElementById('app');
        
        appEl.innerHTML = `
            <!-- Sidebar -->
            <aside class="sidebar ${this.sidebarOpen ? 'open' : ''}" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <div style="width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <img src="public/icons/logo.png" alt="BillSnap" style="width: 24px; height: 24px; object-fit: contain;">
                        </div>
                        <span class="sidebar-logo-text">BillSnap</span>
                    </div>
                </div>

                <nav class="sidebar-nav">
                    <div class="nav-section">
                        <div class="nav-section-title">${i18n.getLang() === 'es' ? 'Principal' : 'Main'}</div>
                        ${this.renderNavItem('dashboard', i18n.t('nav.dashboard'), 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6')}
                        ${this.renderNavItem('upload', i18n.t('nav.upload'), 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12')}
                        ${this.renderNavItem('invoices', i18n.t('nav.invoices'), 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
                    </div>

                    <div class="nav-section">
                        <div class="nav-section-title">${i18n.getLang() === 'es' ? 'Análisis' : 'Analytics'}</div>
                        ${this.renderNavItem('reports', i18n.t('nav.reports'), 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
                    </div>

                    <div class="nav-section">
                        <div class="nav-section-title">${i18n.getLang() === 'es' ? 'Sistema' : 'System'}</div>
                        ${this.renderNavItem('pricing', i18n.getLang() === 'es' ? 'Planes' : 'Pricing', 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z')}
                        ${this.renderNavItem('settings', i18n.t('nav.settings'), 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z')}
                    </div>
                </nav>

                <div class="sidebar-footer">
                    <div class="user-info" onclick="app.showSection('settings')">
                        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <div class="user-name">${user.name}</div>
                            <div class="user-role">${Auth.roles[user.role]?.name || user.role}</div>
                        </div>
                        <button onclick="event.stopPropagation(); app.handleLogout()" class="btn btn-ghost btn-icon" title="${i18n.t('auth.logout')}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="main-content">
                <!-- Top Bar -->
                <header class="top-bar">
                    <div class="top-bar-left">
                        <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div class="search-bar">
                            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                            <input type="text" class="search-input" placeholder="${i18n.t('misc.search')}" onkeyup="app.handleSearch(this.value)">
                        </div>
                    </div>
                    <div class="top-bar-right">
                        <button class="lang-selector" onclick="app.switchLang(i18n.getLang() === 'es' ? 'en' : 'es')">
                            ${i18n.getLang() === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
                        </button>
                        <div class="theme-toggle" onclick="app.toggleTheme()">
                            <div class="theme-toggle-knob"></div>
                        </div>
                        <button class="btn btn-primary" onclick="app.showSection('upload')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            ${i18n.t('misc.new_invoice')}
                        </button>
                    </div>
                </header>

                <!-- Content Area -->
                <div class="content-area" id="content-area">
                    <!-- Sections will be rendered here -->
                </div>
            </main>
        `;

        // Show current section
        this.showSection(this.currentSection);
    },

    /**
     * Render navigation item
     */
    renderNavItem(section, label, iconPath) {
        const isActive = this.currentSection === section;
        return `
            <a class="nav-item ${isActive ? 'active' : ''}" onclick="app.showSection('${section}')">
                <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="${iconPath}"/>
                </svg>
                <span>${label}</span>
            </a>
        `;
    },

    /**
     * Show a section
     */
    showSection(sectionId) {
        if (!Auth.hasPermission('view') && sectionId !== 'settings') {
            this.showToast(i18n.t('msg.no_permission'), 'error');
            return;
        }

        this.currentSection = sectionId;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.onclick.toString().includes(`'${sectionId}'`)) {
                item.classList.add('active');
            }
        });

        // Render section content
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        switch (sectionId) {
            case 'dashboard':
                this.renderDashboard(contentArea);
                break;
            case 'upload':
                await this.renderUpload(contentArea);
                break;
            case 'invoices':
                this.renderInvoices(contentArea);
                break;
            case 'reports':
                this.renderReports(contentArea);
                break;
            case 'pricing':
                contentArea.innerHTML = Billing.renderPricingPage(i18n.getLang());
                break;
            case 'settings':
                await this.renderSettings(contentArea);
                break;
        }
    },

    /**
     * Render Dashboard
     */
    async renderDashboard(container) {
        const isEs = i18n.getLang() === 'es';
        
        // Get accounting summary
        const accountingSummary = await Accounting.renderDashboardSummary(i18n.getLang());
        
        // Get recent invoices
        const invoices = await DB.getAllInvoices();
        const recentInvoices = invoices.slice(0, 5);
        
        container.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title">${i18n.t('dashboard.title')}</h1>
                    <p class="page-subtitle">${isEs ? 'Tu contabilidad automática' : 'Your automatic accounting'}</p>
                </div>

                <!-- Accounting Summary -->
                ${accountingSummary}

                <!-- Charts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${isEs ? 'Ingresos vs Gastos por mes' : 'Income vs Expenses by month'}</span>
                        </div>
                        <div class="card-body">
                            <canvas id="chart-monthly" height="200"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${isEs ? 'Gastos por categoría' : 'Expenses by category'}</span>
                        </div>
                        <div class="card-body">
                            <canvas id="chart-categories" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Invoices -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">${isEs ? 'Últimas facturas' : 'Recent invoices'}</span>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>${i18n.t('invoices.date')}</th>
                                    <th>${isEs ? 'Tipo' : 'Type'}</th>
                                    <th>${i18n.t('invoices.issuer')}</th>
                                    <th>${isEs ? 'Categoría' : 'Category'}</th>
                                    <th class="right">${i18n.t('invoices.total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentInvoices.map(inv => {
                                    const type = inv.type || 'expense';
                                    const categoryInfo = Accounting.getCategoryInfo(inv.category, type);
                                    return `
                                        <tr onclick="app.viewInvoice('${inv.id}')" style="cursor: pointer;">
                                            <td>${i18n.formatDate(inv.date)}</td>
                                            <td>
                                                <span class="badge ${type === 'income' ? 'badge-green' : 'badge-red'}">
                                                    ${type === 'income' ? (isEs ? 'Ingreso' : 'Income') : (isEs ? 'Gasto' : 'Expense')}
                                                </span>
                                            </td>
                                            <td>${inv.issuer?.name || '-'}</td>
                                            <td>${categoryInfo.icon} ${isEs ? categoryInfo.name : categoryInfo.nameEn}</td>
                                            <td class="right"><strong>${i18n.formatCurrency(inv.total)}</strong></td>
                                        </tr>
                                    `;
                                }).join('') || `
                                    <tr>
                                        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                                            ${i18n.t('invoices.empty')}
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Load charts
        await this.loadCharts();
    },

    /**
     * Render status badge
     */
    renderStatusBadge(status) {
        const badges = {
            'issued': { class: 'badge-blue', label: i18n.t('status.issued') },
            'pending': { class: 'badge-orange', label: i18n.t('status.pending') },
            'paid': { class: 'badge-green', label: i18n.t('status.paid') },
            'overdue': { class: 'badge-red', label: i18n.t('status.overdue') }
        };
        const badge = badges[status] || badges['issued'];
        return `<span class="badge ${badge.class}">${badge.label}</span>`;
    },

    /**
     * Load charts
     */
    async loadCharts() {
        const currentYear = new Date().getFullYear().toString();
        const monthlyData = await Accounting.getSummaryByMonth(currentYear);
        const categoriesData = await Accounting.getSummaryByCategory('expense');

        const isDark = this.darkMode;
        const textColor = isDark ? '#a1a1a6' : '#6e6e73';
        const gridColor = isDark ? '#2c2c2e' : '#e5e5ea';

        // Monthly chart (Income vs Expenses)
        const monthlyCtx = document.getElementById('chart-monthly');
        if (monthlyCtx) {
            if (this.charts.monthly) this.charts.monthly.destroy();

            let monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (isEs) {
                monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            }

            this.charts.monthly = new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: monthNames,
                    datasets: [
                        {
                            label: isEs ? 'Ingresos' : 'Income',
                            data: monthNames.map((_, i) => {
                                const month = (i + 1).toString().padStart(2, '0');
                                return monthlyData[month]?.income?.total || 0;
                            }),
                            backgroundColor: 'rgba(52, 199, 89, 0.5)',
                            borderColor: 'rgb(52, 199, 89)',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: isEs ? 'Gastos' : 'Expenses',
                            data: monthNames.map((_, i) => {
                                const month = (i + 1).toString().padStart(2, '0');
                                return monthlyData[month]?.expenses?.total || 0;
                            }),
                            backgroundColor: 'rgba(255, 59, 48, 0.5)',
                            borderColor: 'rgb(255, 59, 48)',
                            borderWidth: 1,
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: textColor }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: textColor, callback: v => Helpers.formatCurrency(v) },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textColor },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // Categories chart (Expenses by category)
        const categoriesCtx = document.getElementById('chart-categories');
        if (categoriesCtx) {
            if (this.charts.categories) this.charts.categories.destroy();

            const categoryNames = Object.keys(categoriesData).map(key => {
                const info = Accounting.getCategoryInfo(key, 'expense');
                return info.icon + ' ' + (i18n.getLang() === 'es' ? info.name : info.nameEn);
            });
            const categoryValues = Object.values(categoriesData).map(v => v.total);
            const colors = ['#0071e3', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5856d6', '#00c7be', '#ff2d55', '#ff6482', '#30b0c7', '#5ac8fa', '#ffcc00'];

            this.charts.categories = new Chart(categoriesCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryNames,
                    datasets: [{
                        data: categoryValues,
                        backgroundColor: colors.slice(0, categoryNames.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: textColor, font: { size: 11 } }
                        }
                    }
                }
            });
        }
    },

    /**
     * Render Upload section
     */
    async renderUpload(container) {
        const plan = Billing.getCurrentPlan();
        const isEs = i18n.getLang() === 'es';
        const visionReady = VisionAI.isAvailable();
        const recommendedModel = VisionAI.getRecommendedModel();
        
        container.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title">${i18n.t('upload.title')}</h1>
                    <p class="page-subtitle">${i18n.t('app.description')}</p>
                </div>

                <!-- Usage Indicator -->
                ${await Billing.renderUsageIndicator()}

                <!-- AI Engine Selection -->
                <div class="card" style="margin-bottom: 24px; border: ${visionReady ? '2px solid var(--accent-green)' : '1px solid var(--border-secondary)'};">
                    <div class="card-header">
                        <span class="card-title">${isEs ? 'Motor de IA' : 'AI Engine'}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${visionReady ? 
                                `<span class="badge badge-green">${isEs ? '✅ Conectado' : '✅ Connected'}</span>` :
                                `<span class="badge badge-orange">${isEs ? '⚠️ No conectado' : '⚠️ Not connected'}</span>`
                            }
                        </div>
                    </div>
                    <div class="card-body">
                        ${!visionReady ? `
                            <!-- Setup Instructions -->
                            <div style="background: var(--accent-blue-light); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                                <h4 style="font-weight: 600; margin-bottom: 8px;">
                                    ${isEs ? '🚀 Configura IA para empezar' : '🚀 Setup AI to get started'}
                                </h4>
                                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                                    ${isEs ? 
                                        'BillSnap usa modelos de IA que RAZONAN sobre tus facturas. Sin entrenar, sin complicaciones.' :
                                        'BillSnap uses AI models that REASON about your invoices. No training, no complications.'
                                    }
                                </p>
                                
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
                                    <!-- Ollama Option -->
                                    <div style="background: var(--bg-primary); border-radius: 8px; padding: 16px; border: 1px solid var(--border-secondary);">
                                        <div style="font-weight: 600; margin-bottom: 4px;">${isEs ? 'Ollama (Recomendado)' : 'Ollama (Recommended)'}</div>
                                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                                            ${isEs ? '100% local · Gratis · Privado' : '100% local · Free · Private'}
                                        </div>
                                        <code style="display: block; background: var(--bg-secondary); padding: 8px; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">
                                            ollama pull qwen2.5vl:7b
                                        </code>
                                        <a href="https://ollama.com" target="_blank" style="font-size: 13px; color: var(--accent-blue);">
                                            ${isEs ? 'Descargar Ollama →' : 'Download Ollama →'}
                                        </a>
                                    </div>
                                    
                                    <!-- API Option -->
                                    <div style="background: var(--bg-primary); border-radius: 8px; padding: 16px; border: 1px solid var(--border-secondary);">
                                        <div style="font-weight: 600; margin-bottom: 4px;">${isEs ? 'API Externa' : 'External API'}</div>
                                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                                            ${isEs ? 'OpenAI · Gemini · HuggingFace' : 'OpenAI · Gemini · HuggingFace'}
                                        </div>
                                        <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="app.showSection('settings')">
                                            ${isEs ? 'Configurar API Key' : 'Configure API Key'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Engine Selector -->
                        <div class="ocr-selector">
                            <label class="ocr-option" style="${!visionReady ? 'opacity: 0.5; pointer-events: none;' : ''}">
                                <input type="radio" name="ocr-engine" value="vision_ai" ${visionReady ? 'checked' : ''} ${!visionReady ? 'disabled' : ''}>
                                <div class="ocr-option-card" style="${visionReady ? 'border-color: var(--accent-green); background: var(--accent-green-light);' : ''}">
                                    <div class="ocr-option-name">🧠 Vision AI</div>
                                    <div class="ocr-option-desc">${isEs ? 'Razona sobre el documento' : 'Reasons about the document'}</div>
                                    <div class="ocr-option-accuracy">⭐⭐⭐⭐⭐ ${isEs ? 'La mejor precisión' : 'Best accuracy'}</div>
                                </div>
                            </label>
                            <label class="ocr-option">
                                <input type="radio" name="ocr-engine" value="tesseract" ${!visionReady ? 'checked' : ''}>
                                <div class="ocr-option-card">
                                    <div class="ocr-option-name">🔤 Tesseract</div>
                                    <div class="ocr-option-desc">${isEs ? 'OCR básico, sin IA' : 'Basic OCR, no AI'}</div>
                                    <div class="ocr-option-accuracy">⭐⭐⭐ ${isEs ? 'Precisión media' : 'Medium accuracy'}</div>
                                </div>
                            </label>
                            <label class="ocr-option" style="${!plan.ocrEngines.includes('native') ? 'opacity: 0.5; pointer-events: none;' : ''}">
                                <input type="radio" name="ocr-engine" value="native" ${!plan.ocrEngines.includes('native') ? 'disabled' : ''}>
                                <div class="ocr-option-card">
                                    <div class="ocr-option-name">⚡ ${isEs ? 'IA Nativa' : 'Native AI'}
                                        ${!plan.ocrEngines.includes('native') ? `<span style="font-size: 11px; color: var(--accent-orange);"> 🔒</span>` : ''}
                                    </div>
                                    <div class="ocr-option-desc">${isEs ? 'IA en el navegador' : 'Browser-based AI'}</div>
                                    <div class="ocr-option-accuracy">⭐⭐⭐⭐ ${isEs ? 'Buena precisión' : 'Good accuracy'}</div>
                                </div>
                            </label>
                        </div>

                        ${visionReady ? `
                            <div style="margin-top: 12px; padding: 12px; background: var(--accent-green-light); border-radius: 8px; font-size: 13px;">
                                ✅ <strong>${isEs ? 'Vision AI activa' : 'Vision AI active'}</strong> - 
                                ${isEs ? 
                                    'Sube una factura y la IA extraerá todos los datos automáticamente. Sin entrenar, sin complicaciones.' :
                                    'Upload an invoice and the AI will extract all data automatically. No training, no complications.'
                                }
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Drop Zone -->
                <div id="drop-zone" class="drop-zone" onclick="document.getElementById('file-input').click()">
                    <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <div class="drop-zone-title">${i18n.t('upload.dropzone')}</div>
                    <div class="drop-zone-subtitle">${i18n.t('upload.formats')}</div>
                    <button class="btn btn-primary btn-lg" onclick="event.stopPropagation(); document.getElementById('file-input').click()">
                        ${i18n.t('upload.select')}
                    </button>
                </div>
                <input type="file" id="file-input" multiple accept="image/*,.pdf" style="display: none;" onchange="app.handleFileSelect(event)">

                <!-- Upload Queue -->
                <div id="upload-queue" style="display: none; margin-top: 24px;">
                    <!-- Will be rendered dynamically -->
                </div>

                <!-- Extracted Preview -->
                <div id="extracted-preview" style="display: none; margin-top: 24px;">
                    <!-- Will be rendered dynamically -->
                </div>
            </div>
        `;

        // Set up drag and drop
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                this.handleFiles(e.dataTransfer.files);
            });
        }
    },

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        this.handleFiles(event.target.files);
        event.target.value = '';
    },

    /**
     * Handle multiple files
     */
    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            return file.type.match(/image|pdf/) || file.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i);
        });

        if (validFiles.length === 0) {
            this.showToast('No valid files found', 'error');
            return;
        }

        if (this.uploadQueue.length + validFiles.length > 30) {
            this.showToast('Maximum 30 files per batch', 'error');
            return;
        }

        validFiles.forEach(file => {
            this.uploadQueue.push({
                id: Helpers.generateId(),
                file,
                name: file.name,
                size: file.size,
                status: 'pending',
                progress: 0,
                result: null,
                error: null
            });
        });

        this.renderUploadQueue();
        document.getElementById('upload-queue').style.display = 'block';
        this.showToast(`${validFiles.length} files added to queue`, 'info');
    },

    /**
     * Render upload queue
     */
    renderUploadQueue() {
        const queueEl = document.getElementById('upload-queue');
        if (!queueEl) return;

        const done = this.uploadQueue.filter(i => i.status === 'done').length;
        const total = this.uploadQueue.length;

        queueEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${i18n.getLang() === 'es' ? 'Cola de procesamiento' : 'Processing Queue'}</span>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <span style="font-size: 14px; color: var(--text-secondary);">${done}/${total} ${i18n.getLang() === 'es' ? 'procesadas' : 'processed'}</span>
                        <button class="btn btn-primary" onclick="app.processQueue()" ${this.processingInProgress ? 'disabled' : ''}>
                            ${this.processingInProgress ? i18n.t('upload.processing') : i18n.t('upload.process_all')}
                        </button>
                    </div>
                </div>
                <div class="card-body" style="padding: 0;">
                    ${this.uploadQueue.map(item => `
                        <div style="display: flex; align-items: center; gap: 16px; padding: 12px 20px; border-bottom: 1px solid var(--border-secondary);">
                            <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                ${item.status === 'pending' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' : ''}
                                ${item.status === 'processing' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2" class="animate-spin"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>' : ''}
                                ${item.status === 'done' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : ''}
                                ${item.status === 'error' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' : ''}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                                <div style="font-size: 12px; color: var(--text-tertiary);">${this.formatFileSize(item.size)}</div>
                                ${item.status === 'processing' ? `
                                    <div class="progress-bar" style="margin-top: 8px;">
                                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                                    </div>
                                ` : ''}
                                ${item.error ? `<div style="font-size: 12px; color: var(--accent-red); margin-top: 4px;">${item.error}</div>` : ''}
                            </div>
                            ${item.status === 'pending' ? `
                                <button class="btn btn-ghost btn-icon" onclick="app.removeFromQueue('${item.id}')">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Remove from queue
     */
    removeFromQueue(fileId) {
        this.uploadQueue = this.uploadQueue.filter(i => i.id !== fileId);
        this.renderUploadQueue();
        if (this.uploadQueue.length === 0) {
            document.getElementById('upload-queue').style.display = 'none';
        }
    },

    /**
     * Process queue
     */
    async processQueue() {
        if (this.processingInProgress) return;

        // Check billing limits
        const canProcess = await Billing.canProcessInvoice();
        const pendingCount = this.uploadQueue.filter(i => i.status === 'pending').length;
        
        if (!canProcess.allowed || (canProcess.remaining !== -1 && pendingCount > canProcess.remaining)) {
            Billing.checkAndPromptUpgrade();
            return;
        }

        this.processingInProgress = true;

        const selectedEngine = document.querySelector('input[name="ocr-engine"]:checked')?.value || 'tesseract';
        
        // Check if engine is available for current plan
        if (!Billing.isEngineAvailable(selectedEngine)) {
            this.showToast(
                i18n.getLang() === 'es' ? 
                    `Motor ${selectedEngine} no disponible en tu plan actual` :
                    `Engine ${selectedEngine} not available in your current plan`, 
                'error'
            );
            this.processingInProgress = false;
            return;
        }

        let processed = 0;
        const total = pendingCount;

        for (const item of this.uploadQueue) {
            if (item.status !== 'pending') continue;

            try {
                item.status = 'processing';
                item.progress = 10;
                this.renderUploadQueue();

                const base64 = await this.readFileAsDataURL(item.file);
                item.progress = 30;

                let result;
                if (selectedEngine === 'vision_ai') {
                    // Vision AI - VLM (Ollama or API) that reasons about the document
                    result = await VisionAI.processInvoice(base64);
                } else if (selectedEngine === 'webllm') {
                    // WebLLM - AI in browser, no install needed
                    result = await WebLLMAI.processInvoice(base64);
                } else if (selectedEngine === 'native') {
                    // Native AI (browser-based OCR)
                    result = await NativeAI.processInvoice(base64);
                } else if (selectedEngine === 'tesseract') {
                    // Basic OCR fallback
                    result = await TesseractOCR.processInvoice(base64);
                } else {
                    // External APIs (OpenAI, Gemini, HuggingFace)
                    const base64Data = base64.split(',')[1];
                    result = await AIAPI.processInvoice(base64Data, selectedEngine);
                }

                // Record usage
                await Billing.recordInvoiceProcessed();

                item.progress = 90;
                item.result = result;
                item.status = 'done';

                this.extractedInvoices.push({
                    ...result,
                    sourceFile: item.name,
                    thumbnail: base64
                });
            } catch (error) {
                item.status = 'error';
                item.error = error.message;
            }

            item.progress = 100;
            processed++;
            this.renderUploadQueue();
        }

        this.processingInProgress = false;

        if (this.extractedInvoices.length > 0) {
            this.renderExtractedPreview();
            this.showToast(`${this.extractedInvoices.length} invoices processed`, 'success');
        }
    },

    /**
     * Read file as Data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Render extracted preview
     */
    renderExtractedPreview() {
        const previewEl = document.getElementById('extracted-preview');
        if (!previewEl) return;

        previewEl.style.display = 'block';
        previewEl.innerHTML = `
            <div class="card animate-in">
                <div class="card-header">
                    <span class="card-title">${i18n.getLang() === 'es' ? 'Datos extraídos' : 'Extracted Data'}</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" onclick="app.saveExtracted()">
                            ${i18n.getLang() === 'es' ? 'Guardar todas' : 'Save all'}
                        </button>
                        <button class="btn btn-secondary" onclick="app.discardExtracted()">
                            ${i18n.getLang() === 'es' ? 'Descartar' : 'Discard'}
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                <th>${i18n.t('invoices.date')}</th>
                                <th>${i18n.t('invoices.number')}</th>
                                <th>${i18n.t('invoices.issuer')}</th>
                                <th class="right">${i18n.t('invoices.base')}</th>
                                <th class="right">${i18n.t('invoices.iva_amount')}</th>
                                <th class="right">${i18n.t('invoices.total')}</th>
                                <th>${i18n.t('ocr.precision')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.extractedInvoices.map((inv, idx) => `
                                <tr>
                                    <td>
                                        <div style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: var(--bg-secondary);">
                                            <img src="${inv.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">
                                        </div>
                                    </td>
                                    <td class="editable-cell" onclick="app.editExtracted(${idx}, 'date')">${i18n.formatDate(inv.date) || '<span style="color: var(--text-tertiary)">-</span>'}</td>
                                    <td class="editable-cell" onclick="app.editExtracted(${idx}, 'invoiceNumber')">${inv.invoiceNumber || '<span style="color: var(--text-tertiary)">-</span>'}</td>
                                    <td class="editable-cell" onclick="app.editExtracted(${idx}, 'issuer')">${inv.issuer?.name || '<span style="color: var(--text-tertiary)">-</span>'}</td>
                                    <td class="right editable-cell" onclick="app.editExtracted(${idx}, 'baseAmount')">${i18n.formatCurrency(inv.baseAmount)}</td>
                                    <td class="right editable-cell" onclick="app.editExtracted(${idx}, 'ivaAmount')">${i18n.formatCurrency(inv.ivaAmount)}</td>
                                    <td class="right editable-cell" onclick="app.editExtracted(${idx}, 'total')"><strong>${i18n.formatCurrency(inv.total)}</strong></td>
                                    <td>
                                        <span class="badge badge-green">${Math.round((inv.confidence || 0.75) * 100)}%</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Edit extracted data
     */
    editExtracted(index, field) {
        const inv = this.extractedInvoices[index];
        let currentValue = '';
        switch (field) {
            case 'date': currentValue = inv.date || ''; break;
            case 'invoiceNumber': currentValue = inv.invoiceNumber || ''; break;
            case 'issuer': currentValue = inv.issuer?.name || ''; break;
            case 'baseAmount': currentValue = inv.baseAmount || ''; break;
            case 'ivaAmount': currentValue = inv.ivaAmount || ''; break;
            case 'total': currentValue = inv.total || ''; break;
        }

        const newValue = prompt(`Edit ${field}:`, currentValue);
        if (newValue === null) return;

        switch (field) {
            case 'date': inv.date = Helpers.parseDate(newValue) || newValue; break;
            case 'invoiceNumber': inv.invoiceNumber = newValue; break;
            case 'issuer': if (!inv.issuer) inv.issuer = {}; inv.issuer.name = newValue; break;
            case 'baseAmount':
                inv.baseAmount = Helpers.parseCurrency(newValue);
                inv.ivaAmount = Helpers.calculateIVA(inv.baseAmount, inv.ivaPercent);
                inv.total = Helpers.calculateTotal(inv.baseAmount, inv.ivaAmount, inv.irpfAmount);
                break;
            case 'ivaAmount': inv.ivaAmount = Helpers.parseCurrency(newValue); break;
            case 'total': inv.total = Helpers.parseCurrency(newValue); break;
        }

        this.renderExtractedPreview();
    },

    /**
     * Save extracted invoices
     */
    async saveExtracted() {
        if (this.extractedInvoices.length === 0) return;

        try {
            const existingCount = await DB.getInvoiceCount();
            
            for (let i = 0; i < this.extractedInvoices.length; i++) {
                const inv = this.extractedInvoices[i];
                if (!inv.invoiceNumber) inv.invoiceNumber = Helpers.generateInvoiceNumber(existingCount + i);
                if (!inv.date) inv.date = new Date().toISOString().split('T')[0];
                inv.status = 'issued';

                // Classify as income or expense and categorize
                const classified = await Accounting.processInvoice(inv);
                
                await DB.addInvoice(classified);
            }

            this.showToast(`${this.extractedInvoices.length} invoices saved and classified`, 'success');

            this.uploadQueue = [];
            this.extractedInvoices = [];
            document.getElementById('upload-queue').style.display = 'none';
            document.getElementById('extracted-preview').style.display = 'none';

            this.showSection('dashboard');
        } catch (error) {
            this.showToast('Error saving invoices', 'error');
        }
    },

    /**
     * Discard extracted data
     */
    discardExtracted() {
        this.extractedInvoices = [];
        document.getElementById('extracted-preview').style.display = 'none';
        this.showToast('Data discarded', 'info');
    },

    /**
     * Render Invoices section
     */
    async renderInvoices(container) {
        const isEs = i18n.getLang() === 'es';
        const invoices = await DB.getAllInvoices(this.sortField, this.sortAscending);
        
        // Separate by type
        const incomeInvoices = invoices.filter(inv => inv.type === 'income');
        const expenseInvoices = invoices.filter(inv => inv.type === 'expense' || !inv.type);
        
        const totalIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

        container.innerHTML = `
            <div class="animate-in">
                <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="page-title">${isEs ? 'Facturas' : 'Invoices'}</h1>
                        <p class="page-subtitle">${invoices.length} ${isEs ? 'facturas en total' : 'total invoices'}</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="app.exportCSV()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            CSV
                        </button>
                        <button class="btn btn-secondary" onclick="app.exportJSON()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            JSON
                        </button>
                        <button class="btn btn-primary" onclick="app.generatePDFReport()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                            PDF
                        </button>
                    </div>
                </div>

                <!-- Summary cards -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="border-left: 4px solid var(--accent-green);">
                        <div class="card-body" style="padding: 16px;">
                            <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Total Ingresos' : 'Total Income'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-green);">${Helpers.formatCurrency(totalIncome)}</div>
                            <div style="font-size: 12px; color: var(--text-tertiary);">${incomeInvoices.length} ${isEs ? 'facturas' : 'invoices'}</div>
                        </div>
                    </div>
                    <div class="card" style="border-left: 4px solid var(--accent-red);">
                        <div class="card-body" style="padding: 16px;">
                            <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Total Gastos' : 'Total Expenses'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-red);">${Helpers.formatCurrency(totalExpenses)}</div>
                            <div style="font-size: 12px; color: var(--text-tertiary);">${expenseInvoices.length} ${isEs ? 'facturas' : 'invoices'}</div>
                        </div>
                    </div>
                    <div class="card" style="border-left: 4px solid ${totalIncome - totalExpenses >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                        <div class="card-body" style="padding: 16px;">
                            <div style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Beneficio' : 'Profit'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: ${totalIncome - totalExpenses >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${Helpers.formatCurrency(totalIncome - totalExpenses)}</div>
                        </div>
                    </div>
                </div>

                <!-- Filter tabs -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button class="btn ${this.invoiceFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="app.filterInvoicesByType('all')">
                        ${isEs ? 'Todas' : 'All'} (${invoices.length})
                    </button>
                    <button class="btn ${this.invoiceFilter === 'income' ? 'btn-primary' : 'btn-secondary'}" onclick="app.filterInvoicesByType('income')" style="${this.invoiceFilter === 'income' ? 'background: var(--accent-green);' : ''}">
                        ${isEs ? 'Ingresos' : 'Income'} (${incomeInvoices.length})
                    </button>
                    <button class="btn ${this.invoiceFilter === 'expense' ? 'btn-primary' : 'btn-secondary'}" onclick="app.filterInvoicesByType('expense')" style="${this.invoiceFilter === 'expense' ? 'background: var(--accent-red);' : ''}">
                        ${isEs ? 'Gastos' : 'Expenses'} (${expenseInvoices.length})
                    </button>
                </div>

                <div class="card">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>${isEs ? 'Fecha' : 'Date'}</th>
                                    <th>${isEs ? 'Tipo' : 'Type'}</th>
                                    <th>${isEs ? 'Emisor' : 'Issuer'}</th>
                                    <th>${isEs ? 'Categoría' : 'Category'}</th>
                                    <th>${isEs ? 'Concepto' : 'Description'}</th>
                                    <th class="right">${isEs ? 'Base' : 'Base'}</th>
                                    <th class="right">IVA</th>
                                    <th class="right">${isEs ? 'Total' : 'Total'}</th>
                                    <th>${isEs ? 'Acciones' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.getFilteredInvoices(invoices).map(inv => {
                                    const type = inv.type || 'expense';
                                    const categoryInfo = Accounting.getCategoryInfo(inv.category, type);
                                    return `
                                        <tr>
                                            <td>${i18n.formatDate(inv.date)}</td>
                                            <td>
                                                <span class="badge ${type === 'income' ? 'badge-green' : 'badge-red'}">
                                                    ${type === 'income' ? (isEs ? 'Ingreso' : 'Income') : (isEs ? 'Gasto' : 'Expense')}
                                                </span>
                                            </td>
                                            <td>${(inv.issuer?.name || '-').substring(0, 20)}</td>
                                            <td>${categoryInfo.icon} ${isEs ? categoryInfo.name : categoryInfo.nameEn}</td>
                                            <td>${(inv.description || '-').substring(0, 25)}</td>
                                            <td class="right">${Helpers.formatCurrency(inv.baseAmount)}</td>
                                            <td class="right">${Helpers.formatCurrency(inv.ivaAmount)}</td>
                                            <td class="right"><strong>${Helpers.formatCurrency(inv.total)}</strong></td>
                                            <td>
                                                <div style="display: flex; gap: 4px;">
                                                    <button class="btn btn-ghost btn-icon btn-sm" onclick="app.viewInvoice('${inv.id}')" title="${isEs ? 'Ver' : 'View'}">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </button>
                                                    <button class="btn btn-ghost btn-icon btn-sm" onclick="app.editInvoice('${inv.id}')" title="${isEs ? 'Editar' : 'Edit'}">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                    <button class="btn btn-ghost btn-icon btn-sm" onclick="app.deleteInvoice('${inv.id}')" title="${isEs ? 'Eliminar' : 'Delete'}">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('') || `
                                    <tr>
                                        <td colspan="9" style="text-align: center; padding: 60px; color: var(--text-tertiary);">
                                            ${isEs ? 'No hay facturas. ¡Sube tu primera factura!' : 'No invoices. Upload your first invoice!'}
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // Invoice filter state
    invoiceFilter: 'all',

    /**
     * Filter invoices by type
     */
    filterInvoicesByType(type) {
        this.invoiceFilter = type;
        this.renderInvoices(document.getElementById('content-area'));
    },

    /**
     * Get filtered invoices
     */
    getFilteredInvoices(invoices) {
        if (this.invoiceFilter === 'all') return invoices;
        if (this.invoiceFilter === 'income') return invoices.filter(inv => inv.type === 'income');
        return invoices.filter(inv => inv.type === 'expense' || !inv.type);
    },

    /**
     * View invoice details
     */
    async viewInvoice(id) {
        const invoice = await DB.getInvoice(id);
        if (!invoice) return;

        const isEs = i18n.getLang() === 'es';
        const type = invoice.type || 'expense';
        const categoryInfo = Accounting.getCategoryInfo(invoice.category, type);

        const modal = document.getElementById('modal-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Detalle de Factura' : 'Invoice Details'}</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <!-- Type and Category -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <span class="badge ${type === 'income' ? 'badge-green' : 'badge-red'}">
                        ${type === 'income' ? (isEs ? 'Ingreso' : 'Income') : (isEs ? 'Gasto' : 'Expense')}
                    </span>
                    <span class="badge badge-blue">${categoryInfo.icon} ${isEs ? categoryInfo.name : categoryInfo.nameEn}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div>
                        <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 4px;">${isEs ? 'Número' : 'Number'}</div>
                        <div style="font-size: 16px; font-weight: 600;">${invoice.invoiceNumber || '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 4px;">${isEs ? 'Fecha' : 'Date'}</div>
                        <div style="font-size: 16px; font-weight: 600;">${i18n.formatDate(invoice.date)}</div>
                    </div>
                </div>

                <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px;">${isEs ? 'Emisor' : 'Issuer'}</div>
                    <div style="font-weight: 600;">${invoice.issuer?.name || '-'}</div>
                    <div style="font-size: 14px; color: var(--text-secondary);">${invoice.issuer?.nif ? `NIF: ${invoice.issuer.nif}` : ''}</div>
                </div>

                ${invoice.description ? `
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 4px;">${isEs ? 'Concepto' : 'Description'}</div>
                        <div>${invoice.description}</div>
                    </div>
                ` : ''}

                <div style="border-top: 1px solid var(--border-secondary); padding-top: 16px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span style="color: var(--text-secondary);">${isEs ? 'Base imponible' : 'Base amount'}:</span>
                        <span>${i18n.formatCurrency(invoice.baseAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span style="color: var(--text-secondary);">IVA (${invoice.ivaPercent || 21}%):</span>
                        <span>${i18n.formatCurrency(invoice.ivaAmount)}</span>
                    </div>
                    ${invoice.irpfPercent > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                            <span style="color: var(--text-secondary);">IRPF (-${invoice.irpfPercent}%):</span>
                            <span>-${i18n.formatCurrency(invoice.irpfAmount)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 2px solid var(--accent-blue); margin-top: 8px;">
                        <span style="font-size: 18px; font-weight: 700;">${isEs ? 'Total' : 'Total'}:</span>
                        <span style="font-size: 18px; font-weight: 700; color: var(--accent-blue);">${i18n.formatCurrency(invoice.total)}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">${isEs ? 'Cerrar' : 'Close'}</button>
                <button class="btn btn-secondary" onclick="app.emailInvoice('${invoice.id}')" title="${isEs ? 'Enviar por email' : 'Send via email'}">
                    ✉️
                </button>
                <button class="btn btn-primary" onclick="app.downloadInvoicePDF('${invoice.id}')">
                    📄 ${isEs ? 'Descargar PDF' : 'Download PDF'}
                </button>
            </div>
        `;

        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Edit invoice
     */
    async editInvoice(id) {
        const invoice = await DB.getInvoice(id);
        if (!invoice) return;

        const modal = document.getElementById('modal-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${i18n.t('action.edit')} ${i18n.t('invoices.title')}</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.number')}</label>
                        <input type="text" id="edit-invoiceNumber" class="form-input" value="${invoice.invoiceNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.date')}</label>
                        <input type="date" id="edit-date" class="form-input" value="${invoice.date || ''}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.issuer')}</label>
                        <input type="text" id="edit-issuer" class="form-input" value="${invoice.issuer?.name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.issuer')} NIF</label>
                        <input type="text" id="edit-issuerNif" class="form-input" value="${invoice.issuer?.nif || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">${i18n.t('invoices.concept')}</label>
                    <input type="text" id="edit-description" class="form-input" value="${invoice.description || ''}">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.base')}</label>
                        <input type="number" step="0.01" id="edit-base" class="form-input" value="${invoice.baseAmount || 0}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.iva_percent')}</label>
                        <input type="number" id="edit-ivaPercent" class="form-input" value="${invoice.ivaPercent || 21}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${i18n.t('invoices.total')}</label>
                        <input type="number" step="0.01" id="edit-total" class="form-input" value="${invoice.total || 0}">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">${i18n.t('action.cancel')}</button>
                <button class="btn btn-primary" onclick="app.saveInvoiceEdit('${invoice.id}')">${i18n.t('action.save')}</button>
            </div>
        `;

        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Save invoice edits
     */
    async saveInvoiceEdit(id) {
        try {
            const invoice = await DB.getInvoice(id);
            invoice.invoiceNumber = document.getElementById('edit-invoiceNumber').value;
            invoice.date = document.getElementById('edit-date').value;
            invoice.issuer = { ...invoice.issuer, name: document.getElementById('edit-issuer').value, nif: document.getElementById('edit-issuerNif').value };
            invoice.description = document.getElementById('edit-description').value;
            invoice.baseAmount = parseFloat(document.getElementById('edit-base').value) || 0;
            invoice.ivaPercent = parseFloat(document.getElementById('edit-ivaPercent').value) || 21;
            invoice.total = parseFloat(document.getElementById('edit-total').value) || 0;
            invoice.ivaAmount = Helpers.calculateIVA(invoice.baseAmount, invoice.ivaPercent);

            await DB.updateInvoice(invoice);
            this.closeModal();
            this.showSection('invoices');
            this.showToast(i18n.t('msg.saved'), 'success');
        } catch (error) {
            this.showToast(i18n.t('msg.error'), 'error');
        }
    },

    /**
     * Delete invoice
     */
    async deleteInvoice(id) {
        if (!confirm(i18n.t('msg.confirm_delete'))) return;
        try {
            await DB.deleteInvoice(id);
            this.showSection('invoices');
            this.showToast(i18n.t('msg.deleted'), 'success');
        } catch (error) {
            this.showToast(i18n.t('msg.error'), 'error');
        }
    },

    /**
     * Download invoice PDF
     */
    async downloadInvoicePDF(id) {
        try {
            await PDFGenerator.downloadInvoice(id);
            this.showToast('PDF downloaded', 'success');
        } catch (error) {
            this.showToast('Error generating PDF', 'error');
        }
    },

    /**
     * Render Reports section
     */
    renderReports(container) {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

        container.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title">${i18n.t('reports.title')}</h1>
                    <p class="page-subtitle">${i18n.getLang() === 'es' ? 'Genera informes profesionales en PDF' : 'Generate professional PDF reports'}</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <!-- Monthly Report -->
                    <div class="card">
                        <div class="card-body">
                            <div style="width: 48px; height: 48px; background: var(--accent-blue-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <h3 style="font-weight: 600; margin-bottom: 4px;">${i18n.t('reports.monthly')}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">${i18n.t('reports.monthly_desc')}</p>
                            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                <select id="report-month" class="form-input form-select" style="flex: 1;">
                                    ${Array.from({length: 12}, (_, i) => `<option value="${(i+1).toString().padStart(2,'0')}">${i18n.t('month.' + (i+1))}</option>`).join('')}
                                </select>
                                <select id="report-year" class="form-input form-select" style="flex: 1;">
                                    ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                                </select>
                            </div>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.generateMonthlyReport()">${i18n.t('reports.generate')}</button>
                        </div>
                    </div>

                    <!-- Quarterly Report -->
                    <div class="card">
                        <div class="card-body">
                            <div style="width: 48px; height: 48px; background: var(--accent-green-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <h3 style="font-weight: 600; margin-bottom: 4px;">${i18n.t('reports.quarterly')}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">${i18n.t('reports.quarterly_desc')}</p>
                            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                <select id="report-quarter" class="form-input form-select" style="flex: 1;">
                                    <option value="1">${i18n.t('quarter.1')}</option>
                                    <option value="2">${i18n.t('quarter.2')}</option>
                                    <option value="3">${i18n.t('quarter.3')}</option>
                                    <option value="4">${i18n.t('quarter.4')}</option>
                                </select>
                                <select id="report-quarter-year" class="form-input form-select" style="flex: 1;">
                                    ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                                </select>
                            </div>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.generateQuarterlyReport()">${i18n.t('reports.generate')}</button>
                        </div>
                    </div>

                    <!-- Annual Report -->
                    <div class="card">
                        <div class="card-body">
                            <div style="width: 48px; height: 48px; background: var(--accent-purple-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                            </div>
                            <h3 style="font-weight: 600; margin-bottom: 4px;">${i18n.t('reports.annual')}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">${i18n.t('reports.annual_desc')}</p>
                            <select id="report-annual-year" class="form-input form-select" style="margin-bottom: 12px;">
                                ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.generateAnnualReport()">${i18n.t('reports.generate')}</button>
                        </div>
                    </div>

                    <!-- Tax Report -->
                    <div class="card">
                        <div class="card-body">
                            <div style="width: 48px; height: 48px; background: var(--accent-red-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                            </div>
                            <h3 style="font-weight: 600; margin-bottom: 4px;">${i18n.t('reports.tax')}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">${i18n.t('reports.tax_desc')}</p>
                            <select id="report-tax-year" class="form-input form-select" style="margin-bottom: 12px;">
                                ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.generateTaxReport()">${i18n.t('reports.generate')}</button>
                        </div>
                    </div>

                    <!-- Accounting Book -->
                    <div class="card">
                        <div class="card-body">
                            <div style="width: 48px; height: 48px; background: var(--accent-orange-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                            </div>
                            <h3 style="font-weight: 600; margin-bottom: 4px;">${i18n.t('reports.accounting')}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">${i18n.t('reports.accounting_desc')}</p>
                            <select id="report-book-year" class="form-input form-select" style="margin-bottom: 12px;">
                                ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.generateAccountingBook()">${i18n.t('reports.generate')}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Settings section
     */
    async renderSettings(container) {
        const isEs = i18n.getLang() === 'es';
        const recommendedModel = VisionAI.getRecommendedModel();
        const currentCompany = Companies.getCurrentCompany();
        
        container.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title">${i18n.t('settings.title')}</h1>
                </div>

                <!-- Company Selector -->
                <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 14px; color: var(--text-secondary);">${isEs ? 'Empresa activa:' : 'Active company:'}</span>
                    ${Companies.renderSelector(i18n.getLang())}
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 16px;">
                    <!-- Company Data -->
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${i18n.t('settings.company')} - ${currentCompany?.name || ''}</span>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">${i18n.t('settings.company_name')}</label>
                                <input type="text" id="company-name" class="form-input" value="${currentCompany?.name || ''}" placeholder="My Company S.L.">
                            </div>
                            <div class="form-group">
                                <label class="form-label">${i18n.t('settings.company_nif')}</label>
                                <input type="text" id="company-nif" class="form-input" value="${currentCompany?.nif || ''}" placeholder="B-12345678">
                            </div>
                            <div class="form-group">
                                <label class="form-label">${i18n.t('settings.company_address')}</label>
                                <input type="text" id="company-address" class="form-input" value="${currentCompany?.address || ''}" placeholder="123 Main St, City">
                            </div>
                            <div class="form-group">
                                <label class="form-label">${i18n.t('settings.company_email')}</label>
                                <input type="email" id="company-email" class="form-input" value="${currentCompany?.email || ''}" placeholder="info@company.com">
                            </div>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.saveCompanyData()">${i18n.t('settings.save')}</button>
                        </div>
                    </div>

                    <!-- AI Configuration -->
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${isEs ? 'Configuración IA' : 'AI Configuration'}</span>
                            <span class="badge ${VisionAI.isAvailable() ? 'badge-green' : 'badge-orange'}">
                                ${VisionAI.isAvailable() ? (isEs ? 'Conectado' : 'Connected') : (isEs ? 'No conectado' : 'Not connected')}
                            </span>
                        </div>
                        <div class="card-body">
                            <!-- Vision AI Status -->
                            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                                <h4 style="font-weight: 600; margin-bottom: 8px;">🧠 ${isEs ? 'Vision AI (Recomendado)' : 'Vision AI (Recommended)'}</h4>
                                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                                    ${isEs ? 
                                        'Usa modelos de IA que razonan sobre tus facturas. Sin entrenar, sin complicaciones.' :
                                        'Uses AI models that reason about your invoices. No training, no complications.'
                                    }
                                </p>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <code style="background: var(--bg-primary); padding: 6px 12px; border-radius: 4px; font-size: 12px;">
                                        ollama pull qwen2.5vl:7b
                                    </code>
                                    <a href="https://ollama.com" target="_blank" class="btn btn-secondary btn-sm">
                                        ${isEs ? 'Descargar Ollama' : 'Download Ollama'}
                                    </a>
                                    <button class="btn btn-ghost btn-sm" onclick="VisionAI.init().then(() => app.showSection('settings'))">
                                        ${isEs ? 'Verificar conexión' : 'Test connection'}
                                    </button>
                                </div>
                            </div>

                            <!-- Ollama Model Selection -->
                            <div class="form-group">
                                <label class="form-label">${isEs ? 'Modelo Ollama' : 'Ollama Model'}</label>
                                <select id="ollama-vision-model" class="form-input form-select">
                                    <option value="qwen2.5vl:7b" selected>Qwen2.5-VL 7B - ${isEs ? 'El mejor para facturas' : 'Best for invoices'}</option>
                                    <option value="llama3.2-vision:11b">Llama 3.2 Vision 11B - ${isEs ? 'La mejor calidad' : 'Best quality'}</option>
                                    <option value="minicpm-v:latest">MiniCPM-V - ${isEs ? 'Compacto y eficiente' : 'Compact & efficient'}</option>
                                    <option value="moondream:latest">Moondream - ${isEs ? 'Ultra-ligero' : 'Ultra-light'}</option>
                                    <option value="gemma3:4b">Gemma 3 4B - ${isEs ? 'Buen equilibrio' : 'Good balance'}</option>
                                </select>
                                <div class="form-help">${isEs ? 'Modelo recomendado para tu dispositivo' : 'Recommended model for your device'}: <strong>${recommendedModel?.model || 'qwen2.5vl:7b'}</strong></div>
                            </div>

                            <hr style="margin: 16px 0; border-color: var(--border-secondary);">
                            
                            <!-- External API -->
                            <h4 style="font-weight: 600; margin-bottom: 12px;">${isEs ? 'API Externa (alternativa)' : 'External API (alternative)'}</h4>
                            
                            <div class="form-group">
                                <label class="form-label">${isEs ? 'Proveedor' : 'Provider'}</label>
                                <select id="ai-provider" class="form-input form-select">
                                    <option value="">${isEs ? 'Seleccionar' : 'Select'}</option>
                                    <option value="openai">OpenAI (GPT-4o)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="huggingface">HuggingFace</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">API Key</label>
                                <input type="password" id="ai-api-key" class="form-input" placeholder="sk-...">
                                <div class="form-help">${isEs ? 'Tu API key se guarda localmente en tu navegador' : 'Your API key is stored locally in your browser'}</div>
                            </div>
                            <button class="btn btn-primary" style="width: 100%;" onclick="app.saveAIConfig()">
                                ${isEs ? 'Guardar configuración' : 'Save configuration'}
                            </button>
                        </div>
                    </div>

                    <!-- Google Sheets -->
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${i18n.t('settings.sheets')}</span>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">${i18n.t('settings.sheets_url')}</label>
                                <input type="url" id="sheets-url" class="form-input" placeholder="https://docs.google.com/spreadsheets/d/...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">${i18n.t('settings.sheets_key')}</label>
                                <input type="password" id="sheets-api-key" class="form-input" placeholder="AIza...">
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-primary" style="flex: 1;" onclick="app.connectSheets()">${i18n.t('settings.sheets_connect')}</button>
                                <button class="btn btn-secondary" onclick="app.openSheetsView()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Data Management -->
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${i18n.t('settings.data')}</span>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <button class="btn btn-secondary" style="width: 100%;" onclick="app.exportJSON()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    ${i18n.t('settings.export')}
                                </button>
                                <button class="btn btn-secondary" style="width: 100%;" onclick="document.getElementById('import-input').click()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    ${i18n.t('settings.import')}
                                </button>
                                <input type="file" id="import-input" accept=".json" style="display: none;" onchange="app.importJSON(event)">
                                <button class="btn btn-danger" style="width: 100%;" onclick="app.clearAllData()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                    ${i18n.t('settings.delete_all')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Company Management -->
                <div style="margin-top: 24px;">
                    ${Companies.renderManagement(i18n.getLang())}
                </div>

                ${Auth.hasPermission('users') ? `
                    <div style="margin-top: 24px;" id="user-management">
                        ${Auth.renderUserManagement()}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Handle search
     */
    async handleSearch(query) {
        if (!query || query.length < 2) return;
        
        const isEs = i18n.getLang() === 'es';
        const invoices = await DB.getAllInvoices();
        
        const results = invoices.filter(inv => {
            const searchStr = (
                (inv.invoiceNumber || '') + ' ' +
                (inv.issuer?.name || '') + ' ' +
                (inv.receiver?.name || '') + ' ' +
                (inv.description || '') + ' ' +
                (inv.category || '')
            ).toLowerCase();
            return searchStr.includes(query.toLowerCase());
        });

        // Show results in a modal
        const modal = document.getElementById('modal-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Resultados de búsqueda' : 'Search results'}: "${query}"</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                ${results.length === 0 ? `
                    <p style="text-align: center; color: var(--text-tertiary); padding: 40px;">
                        ${isEs ? 'No se encontraron resultados' : 'No results found'}
                    </p>
                ` : `
                    <p style="margin-bottom: 16px; color: var(--text-secondary);">${results.length} ${isEs ? 'resultados' : 'results'}</p>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${results.slice(0, 20).map(inv => {
                            const type = inv.type || 'expense';
                            return `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border-secondary); cursor: pointer;" onclick="app.closeModal(); app.viewInvoice('${inv.id}')">
                                    <span class="badge ${type === 'income' ? 'badge-green' : 'badge-red'}" style="min-width: 60px; text-align: center;">
                                        ${type === 'income' ? (isEs ? 'Ingreso' : 'Income') : (isEs ? 'Gasto' : 'Expense')}
                                    </span>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500;">${inv.issuer?.name || '-'}</div>
                                        <div style="font-size: 12px; color: var(--text-tertiary);">${i18n.formatDate(inv.date)} · ${inv.description || ''}</div>
                                    </div>
                                    <div style="font-weight: 600;">${Helpers.formatCurrency(inv.total)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        if (confirm(i18n.t('auth.logout') + '?')) {
            await Auth.logout();
            window.location.reload();
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : ''}
                ${type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' : ''}
                ${type === 'info' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>' : ''}
            </svg>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Generate reports
     */
    async generateMonthlyReport() {
        const year = document.getElementById('report-year').value;
        const month = document.getElementById('report-month').value;
        try {
            await PDFGenerator.downloadMonthlyReport(year, month);
            this.showToast('Monthly report generated', 'success');
        } catch (error) {
            this.showToast('Error generating report', 'error');
        }
    },

    async generateQuarterlyReport() {
        const year = document.getElementById('report-quarter-year').value;
        const quarter = document.getElementById('report-quarter').value;
        try {
            await PDFGenerator.downloadQuarterlyReport(year, quarter);
            this.showToast('Quarterly report generated', 'success');
        } catch (error) {
            this.showToast('Error generating report', 'error');
        }
    },

    async generateAnnualReport() {
        const year = document.getElementById('report-annual-year').value;
        try {
            await PDFGenerator.downloadAnnualReport(year);
            this.showToast('Annual report generated', 'success');
        } catch (error) {
            this.showToast('Error generating report', 'error');
        }
    },

    async generateTaxReport() {
        const year = document.getElementById('report-tax-year').value;
        try {
            await PDFGenerator.downloadTaxReport(year);
            this.showToast('Tax report generated', 'success');
        } catch (error) {
            this.showToast('Error generating report', 'error');
        }
    },

    async generateAccountingBook() {
        const year = document.getElementById('report-book-year').value;
        try {
            await PDFGenerator.downloadAccountingBook(year);
            this.showToast('Accounting book generated', 'success');
        } catch (error) {
            this.showToast('Error generating report', 'error');
        }
    },

    async generatePDFReport() {
        const year = new Date().getFullYear().toString();
        try {
            await PDFGenerator.downloadAnnualReport(year);
            this.showToast('PDF report generated', 'success');
        } catch (error) {
            this.showToast('Error generating PDF', 'error');
        }
    },

    /**
     * Export functions
     */
    async exportCSV() {
        try {
            const invoices = await DB.getAllInvoices();
            const headers = ['Date', 'Invoice #', 'Issuer', 'Issuer NIF', 'Receiver', 'Receiver NIF', 'Description', 'Base', 'VAT%', 'VAT', 'Withholding%', 'Withholding', 'Total', 'Status'];
            const rows = invoices.map(inv => [
                inv.date || '', inv.invoiceNumber || '', inv.issuer?.name || '', inv.issuer?.nif || '',
                inv.receiver?.name || '', inv.receiver?.nif || '', inv.description || '',
                inv.baseAmount || 0, inv.ivaPercent || 21, inv.ivaAmount || 0,
                inv.irpfPercent || 0, inv.irpfAmount || 0, inv.total || 0, inv.status || ''
            ]);

            const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `BillSnap_Invoices_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            this.showToast('CSV exported', 'success');
        } catch (error) {
            this.showToast('Error exporting CSV', 'error');
        }
    },

    async exportJSON() {
        try {
            const data = await DB.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `BillSnap_Backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            this.showToast('Backup exported', 'success');
        } catch (error) {
            this.showToast('Error exporting', 'error');
        }
    },

    async importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await DB.importAll(data);
            this.showSection('invoices');
            this.showToast('Data imported successfully', 'success');
        } catch (error) {
            this.showToast('Error importing data', 'error');
        }
        event.target.value = '';
    },

    async clearAllData() {
        if (!confirm(i18n.t('msg.confirm_delete_all'))) return;
        try {
            await DB.clearAll();
            this.showSection('upload');
            this.showToast('All data deleted', 'info');
        } catch (error) {
            this.showToast('Error deleting data', 'error');
        }
    },

    /**
     * Settings functions
     */
    async saveCompanyData() {
        const currentCompany = Companies.getCurrentCompany();
        if (currentCompany) {
            await Companies.updateCompany(currentCompany.id, {
                name: document.getElementById('company-name').value,
                nif: document.getElementById('company-nif').value,
                address: document.getElementById('company-address').value,
                email: document.getElementById('company-email').value
            });
        }
        
        // Also save to general settings for backward compatibility
        const fields = { 'company-name': 'company_name', 'company-nif': 'company_nif', 'company-address': 'company_address', 'company-email': 'company_email' };
        for (const [elId, key] of Object.entries(fields)) {
            const value = document.getElementById(elId)?.value;
            if (value) await DB.saveSetting(key, value);
        }
        
        this.showToast(i18n.t('msg.saved'), 'success');
    },

    async saveAIConfig() {
        const provider = document.getElementById('ai-provider').value;
        const apiKey = document.getElementById('ai-api-key').value;
        const ollamaModel = document.getElementById('ollama-vision-model')?.value;
        
        await AIAPI.saveConfig(provider, apiKey, 'http://localhost:11434');
        
        if (ollamaModel) {
            await DB.saveSetting('ollama_vision_model', ollamaModel);
        }
        
        // Re-test Vision AI connection
        await VisionAI.init();
        
        this.showToast(i18n.t('msg.saved'), 'success');
    },

    async connectSheets() {
        try {
            const url = document.getElementById('sheets-url').value;
            const apiKey = document.getElementById('sheets-api-key').value;
            if (!url) { this.showToast('Enter Google Sheet URL', 'error'); return; }
            const spreadsheetId = GoogleSheets.extractSpreadsheetId(url);
            await GoogleSheets.saveConfig(spreadsheetId, apiKey);
            await GoogleSheets.initializeSheet();
            const result = await GoogleSheets.syncAllInvoices();
            this.showToast(`Connected to Google Sheets. ${result.count} invoices synced.`, 'success');
        } catch (error) {
            this.showToast('Error connecting to Sheets: ' + error.message, 'error');
        }
    },

    openSheetsView() {
        const url = GoogleSheets.generateSheetViewUrl();
        if (url) window.open(url, '_blank');
        else this.showToast('Connect Google Sheets first', 'error');
    },

    /**
     * Switch company
     */
    async switchCompany(companyId) {
        try {
            await Companies.switchCompany(companyId);
            await Accounting.init(); // Reload accounting for new company
            this.renderApp();
            this.loadDashboard();
            this.showToast(i18n.getLang() === 'es' ? 'Empresa cambiada' : 'Company switched', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    /**
     * Show add company modal
     */
    showAddCompanyModal() {
        const isEs = i18n.getLang() === 'es';
        const modal = document.getElementById('modal-content');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Añadir empresa' : 'Add company'}</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">${isEs ? 'Nombre de la empresa' : 'Company name'} *</label>
                    <input type="text" id="new-company-name" class="form-input" placeholder="${isEs ? 'Mi Empresa S.L.' : 'My Company Ltd.'}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">NIF/CIF</label>
                    <input type="text" id="new-company-nif" class="form-input" placeholder="B12345678">
                </div>
                <div class="form-group">
                    <label class="form-label">${isEs ? 'Dirección' : 'Address'}</label>
                    <input type="text" id="new-company-address" class="form-input" placeholder="${isEs ? 'Calle Mayor 1, Madrid' : '123 Main St, City'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" id="new-company-email" class="form-input" placeholder="info@empresa.com">
                </div>
                <div id="add-company-error" class="hidden" style="color: var(--accent-red); font-size: 13px; margin-bottom: 16px;"></div>
                <button class="btn btn-primary" style="width: 100%;" onclick="app.addCompany()">
                    ${isEs ? 'Añadir empresa' : 'Add company'}
                </button>
            </div>
        `;
        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Add company
     */
    async addCompany() {
        const isEs = i18n.getLang() === 'es';
        const errorEl = document.getElementById('add-company-error');
        
        try {
            const name = document.getElementById('new-company-name').value;
            if (!name) {
                errorEl.textContent = isEs ? 'El nombre es obligatorio' : 'Name is required';
                errorEl.classList.remove('hidden');
                return;
            }

            await Companies.addCompany({
                name,
                nif: document.getElementById('new-company-nif').value,
                address: document.getElementById('new-company-address').value,
                email: document.getElementById('new-company-email').value
            });

            this.closeModal();
            this.renderApp();
            this.showToast(isEs ? 'Empresa añadida' : 'Company added', 'success');
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    },

    /**
     * Edit company
     */
    async editCompany(companyId) {
        const isEs = i18n.getLang() === 'es';
        const company = Companies.getAllCompanies().find(c => c.id === companyId);
        if (!company) return;

        const modal = document.getElementById('modal-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Editar empresa' : 'Edit company'}</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">${isEs ? 'Nombre de la empresa' : 'Company name'} *</label>
                    <input type="text" id="edit-company-name" class="form-input" value="${company.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">NIF/CIF</label>
                    <input type="text" id="edit-company-nif" class="form-input" value="${company.nif || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">${isEs ? 'Dirección' : 'Address'}</label>
                    <input type="text" id="edit-company-address" class="form-input" value="${company.address || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" id="edit-company-email" class="form-input" value="${company.email || ''}">
                </div>
                <button class="btn btn-primary" style="width: 100%;" onclick="app.saveCompanyEdit('${companyId}')">
                    ${isEs ? 'Guardar' : 'Save'}
                </button>
            </div>
        `;
        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Save company edit
     */
    async saveCompanyEdit(companyId) {
        try {
            await Companies.updateCompany(companyId, {
                name: document.getElementById('edit-company-name').value,
                nif: document.getElementById('edit-company-nif').value,
                address: document.getElementById('edit-company-address').value,
                email: document.getElementById('edit-company-email').value
            });

            this.closeModal();
            this.renderApp();
            this.showToast(i18n.getLang() === 'es' ? 'Empresa actualizada' : 'Company updated', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    /**
     * Email invoice
     */
    async emailInvoice(invoiceId) {
        const isEs = i18n.getLang() === 'es';
        const invoice = await DB.getInvoice(invoiceId);
        if (!invoice) return;

        const modal = document.getElementById('modal-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEs ? 'Enviar factura por email' : 'Send invoice via email'}</h3>
                <button class="btn btn-ghost btn-icon" onclick="app.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">${isEs ? 'Email del destinatario' : 'Recipient email'}</label>
                    <input type="email" id="email-recipient" class="form-input" value="${invoice.receiver?.email || invoice.issuer?.email || ''}" placeholder="email@ejemplo.com">
                </div>
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <div style="font-weight: 500;">${invoice.invoiceNumber || '-'}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${invoice.issuer?.name || '-'} · ${Helpers.formatCurrency(invoice.total)}</div>
                </div>
                <button class="btn btn-primary" style="width: 100%;" onclick="app.sendInvoiceEmail('${invoiceId}')">
                    ${isEs ? 'Enviar' : 'Send'}
                </button>
            </div>
        `;
        document.getElementById('modal-overlay').classList.add('active');
    },

    /**
     * Send invoice email
     */
    async sendInvoiceEmail(invoiceId) {
        const isEs = i18n.getLang() === 'es';
        try {
            const invoice = await DB.getInvoice(invoiceId);
            const recipient = document.getElementById('email-recipient').value;
            
            if (!recipient) {
                this.showToast(isEs ? 'Introduce un email' : 'Enter an email', 'error');
                return;
            }

            await Email.sendInvoice(invoice, recipient);
            this.closeModal();
            this.showToast(isEs ? 'Email enviado' : 'Email sent', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    /**
     * Show company management in settings
     */
    renderCompanyManagement() {
        return Companies.renderManagement(i18n.getLang());
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
