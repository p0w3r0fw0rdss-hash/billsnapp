/**
 * BillSnap - Accounting Module
 * Classifies invoices as INCOME or EXPENSE
 * Tracks IVA, categories, and generates reports
 */

const Accounting = {
    // Company data (our company)
    companyData: null,

    // Categories
    categories: {
        expense: [
            { id: 'luz', name: 'Luz', nameEn: 'Electricity', icon: '⚡' },
            { id: 'telefono', name: 'Teléfono/Internet', nameEn: 'Phone/Internet', icon: '📱' },
            { id: 'alquiler', name: 'Alquiler', nameEn: 'Rent', icon: '🏢' },
            { id: 'material', name: 'Material/Suministros', nameEn: 'Materials/Supplies', icon: '📦' },
            { id: 'servicios', name: 'Servicios profesionales', nameEn: 'Professional services', icon: '👔' },
            { id: 'transporte', name: 'Transporte', nameEn: 'Transport', icon: '🚗' },
            { id: 'seguros', name: 'Seguros', nameEn: 'Insurance', icon: '🛡️' },
            { id: 'software', name: 'Software/SaaS', nameEn: 'Software/SaaS', icon: '💻' },
            { id: 'hosting', name: 'Hosting/Dominios', nameEn: 'Hosting/Domains', icon: '🌐' },
            { id: 'marketing', name: 'Marketing/Publicidad', nameEn: 'Marketing/Advertising', icon: '📢' },
            { id: 'formacion', name: 'Formación', nameEn: 'Training', icon: '📚' },
            { id: 'comidas', name: 'Comidas/Restauración', nameEn: 'Meals/Restaurants', icon: '🍽️' },
            { id: 'otros_gasto', name: 'Otros gastos', nameEn: 'Other expenses', icon: '📋' }
        ],
        income: [
            { id: 'ventas', name: 'Ventas', nameEn: 'Sales', icon: '💰' },
            { id: 'servicios_cobro', name: 'Servicios prestados', nameEn: 'Services provided', icon: '🔧' },
            { id: 'consultoria', name: 'Consultoría', nameEn: 'Consulting', icon: '💡' },
            { id: 'comisiones', name: 'Comisiones', nameEn: 'Commissions', icon: '📈' },
            { id: 'alquileres', name: 'Alquileres cobrados', nameEn: 'Rent collected', icon: '🏠' },
            { id: 'otros_ingreso', name: 'Otros ingresos', nameEn: 'Other income', icon: '📋' }
        ]
    },

    /**
     * Initialize accounting
     */
    async init() {
        // Load company data
        this.companyData = {
            name: await DB.getSetting('company_name') || '',
            nif: await DB.getSetting('company_nif') || ''
        };
    },

    /**
     * Classify invoice as INCOME or EXPENSE
     */
    classifyInvoice(invoice) {
        // If the issuer is us, it's an INCOME (we issued it to a client)
        // If the issuer is someone else, it's an EXPENSE (we received it from a supplier)
        
        const ourNIF = this.companyData?.nif?.toUpperCase()?.replace(/[\s\-]/g, '') || '';
        const issuerNIF = invoice.issuer?.nif?.toUpperCase()?.replace(/[\s\-]/g, '') || '';
        const ourName = this.companyData?.name?.toLowerCase() || '';
        const issuerName = invoice.issuer?.name?.toLowerCase() || '';

        // Check if issuer is us
        const isIssuerUs = (
            (ourNIF && issuerNIF && ourNIF === issuerNIF) ||
            (ourName && issuerName && ourName === issuerName)
        );

        return isIssuerUs ? 'income' : 'expense';
    },

    /**
     * Auto-categorize invoice based on description/issuer
     */
    autoCategorize(invoice, type = 'expense') {
        const text = (
            (invoice.description || '') + ' ' + 
            (invoice.issuer?.name || '') + ' ' + 
            (invoice.receiver?.name || '')
        ).toLowerCase();

        const categoryList = type === 'expense' ? this.categories.expense : this.categories.income;

        // Keyword matching
        const keywords = {
            'luz': ['iberdrola', 'endesa', 'naturgy', 'gas natural', 'luz', 'electricidad', 'electric'],
            'telefono': ['movistar', 'vodafone', 'orange', 'telefonica', 'teléfono', 'internet', 'fibra', 'adsl'],
            'alquiler': ['alquiler', 'renta', 'arrendamiento', 'property'],
            'material': ['amazon', 'papeleria', 'papelería', 'material', 'suministros', 'ferreteria'],
            'servicios': ['abogado', 'abogados', 'asesor', 'consultor', 'notario', 'gestor'],
            'transporte': ['gasolina', 'gasolinera', 'repsol', 'cepsa', 'uber', 'taxi', 'renfe', 'ave'],
            'seguros': ['seguro', 'seguros', 'mapfre', 'axa', 'allianz', 'zurich'],
            'software': ['microsoft', 'google workspace', 'adobe', 'slack', 'notion', 'figma', 'github'],
            'hosting': ['hosting', 'dominio', 'cloudflare', 'vercel', 'netlify', 'aws', 'azure'],
            'marketing': ['facebook ads', 'google ads', 'publicidad', 'marketing', 'mailchimp'],
            'formacion': ['curso', 'formación', 'udemy', 'coursera', 'masterclass'],
            'comidas': ['restaurante', 'bar', 'cafetería', 'mcdonald', 'burger', 'telepizza'],
            'ventas': ['venta', 'factura emitida', 'cliente'],
            'servicios_cobro': ['servicio', 'trabajo', 'proyecto'],
            'consultoria': ['consultoría', 'consulting', 'asesoramiento'],
            'comisiones': ['comisión', 'comision', 'affiliate'],
            'alquileres': ['alquiler cobrado', 'renta cobrada']
        };

        for (const [categoryId, words] of Object.entries(keywords)) {
            for (const word of words) {
                if (text.includes(word)) {
                    const category = categoryList.find(c => c.id === categoryId);
                    if (category) return category.id;
                }
            }
        }

        // Default category
        return type === 'expense' ? 'otros_gasto' : 'otros_ingreso';
    },

    /**
     * Process invoice with accounting classification
     */
    async processInvoice(invoiceData) {
        await this.init();

        // Classify as income or expense
        const type = this.classifyInvoice(invoiceData);
        
        // Auto-categorize
        const category = this.autoCategorize(invoiceData, type);

        return {
            ...invoiceData,
            type, // 'income' or 'expense'
            category,
            accountingProcessed: true
        };
    },

    /**
     * Get accounting summary for a period
     */
    async getSummary(startDate, endDate, companyId = null) {
        let invoices = await DB.getAllInvoices();
        
        // Filter by date
        if (startDate) {
            invoices = invoices.filter(inv => inv.date >= startDate);
        }
        if (endDate) {
            invoices = invoices.filter(inv => inv.date <= endDate);
        }

        // Separate income and expenses
        const incomeInvoices = invoices.filter(inv => inv.type === 'income');
        const expenseInvoices = invoices.filter(inv => inv.type === 'expense' || !inv.type);

        // Calculate totals
        const totalIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalBaseIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalBaseExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalIVAIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
        const totalIVAExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);

        return {
            // Ingresos
            income: {
                count: incomeInvoices.length,
                total: totalIncome,
                base: totalBaseIncome,
                iva: totalIVAIncome // IVA repercutido
            },
            // Gastos
            expenses: {
                count: expenseInvoices.length,
                total: totalExpenses,
                base: totalBaseExpenses,
                iva: totalIVAExpenses // IVA soportado
            },
            // Resultado
            profit: totalIncome - totalExpenses,
            profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0,
            // IVA
            ivaToPay: totalIVAIncome - totalIVAExpenses, // IVA a pagar a Hacienda
            // Totales
            totalInvoices: invoices.length,
            invoices
        };
    },

    /**
     * Get summary by category
     */
    async getSummaryByCategory(type = 'expense', startDate = null, endDate = null) {
        let invoices = await DB.getAllInvoices();
        
        // Filter by type
        invoices = invoices.filter(inv => {
            if (type === 'expense') return inv.type === 'expense' || !inv.type;
            return inv.type === 'income';
        });

        // Filter by date
        if (startDate) invoices = invoices.filter(inv => inv.date >= startDate);
        if (endDate) invoices = invoices.filter(inv => inv.date <= endDate);

        // Group by category
        const byCategory = {};
        invoices.forEach(inv => {
            const cat = inv.category || 'sin_categoria';
            if (!byCategory[cat]) {
                byCategory[cat] = { count: 0, total: 0, base: 0, iva: 0 };
            }
            byCategory[cat].count++;
            byCategory[cat].total += inv.total || 0;
            byCategory[cat].base += inv.baseAmount || 0;
            byCategory[cat].iva += inv.ivaAmount || 0;
        });

        return byCategory;
    },

    /**
     * Get summary by month
     */
    async getSummaryByMonth(year) {
        const invoices = await DB.getAllInvoices();
        const yearInvoices = invoices.filter(inv => inv.date && inv.date.startsWith(year));

        const monthly = {};
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            monthly[month] = {
                income: { count: 0, total: 0, iva: 0 },
                expenses: { count: 0, total: 0, iva: 0 },
                profit: 0
            };
        }

        yearInvoices.forEach(inv => {
            const month = inv.date.substring(5, 7);
            if (!monthly[month]) return;

            if (inv.type === 'income') {
                monthly[month].income.count++;
                monthly[month].income.total += inv.total || 0;
                monthly[month].income.iva += inv.ivaAmount || 0;
            } else {
                monthly[month].expenses.count++;
                monthly[month].expenses.total += inv.total || 0;
                monthly[month].expenses.iva += inv.ivaAmount || 0;
            }
        });

        // Calculate profit
        Object.values(monthly).forEach(m => {
            m.profit = m.income.total - m.expenses.total;
        });

        return monthly;
    },

    /**
     * Get category display info
     */
    getCategoryInfo(categoryId, type = 'expense') {
        const list = type === 'expense' ? this.categories.expense : this.categories.income;
        return list.find(c => c.id === categoryId) || { 
            id: categoryId, 
            name: categoryId, 
            nameEn: categoryId, 
            icon: '📋' 
        };
    },

    /**
     * Get all categories for a type
     */
    getCategories(type = 'expense') {
        return type === 'expense' ? this.categories.expense : this.categories.income;
    },

    /**
     * Render accounting summary for dashboard
     */
    async renderDashboardSummary(lang = 'es') {
        const isEs = lang === 'es';
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const quarter = Math.ceil((now.getMonth() + 1) / 3);

        // Get current quarter dates
        const quarterStart = `${year}-${((quarter - 1) * 3 + 1).toString().padStart(2, '0')}-01`;
        const quarterEnd = `${year}-${(quarter * 3).toString().padStart(2, '0')}-31`;

        const monthSummary = await this.getSummary(`${year}-${month}-01`, `${year}-${month}-31`);
        const quarterSummary = await this.getSummary(quarterStart, quarterEnd);
        const yearSummary = await this.getSummary(`${year}-01-01`, `${year}-12-31`);

        return `
            <!-- Monthly Summary -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">${isEs ? 'Ingresos mes' : 'Monthly income'}</span>
                        <div class="stat-icon" style="background: var(--accent-green-light);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" style="color: var(--accent-green);">${Helpers.formatCurrency(monthSummary.income.total)}</div>
                    <div class="stat-change positive">${monthSummary.income.count} ${isEs ? 'facturas' : 'invoices'}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">${isEs ? 'Gastos mes' : 'Monthly expenses'}</span>
                        <div class="stat-icon" style="background: var(--accent-red-light);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" style="color: var(--accent-red);">${Helpers.formatCurrency(monthSummary.expenses.total)}</div>
                    <div class="stat-change">${monthSummary.expenses.count} ${isEs ? 'facturas' : 'invoices'}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">${isEs ? 'Beneficio mes' : 'Monthly profit'}</span>
                        <div class="stat-icon" style="background: ${monthSummary.profit >= 0 ? 'var(--accent-green-light)' : 'var(--accent-red-light)'};">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${monthSummary.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}" stroke-width="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" style="color: ${monthSummary.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${Helpers.formatCurrency(monthSummary.profit)}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">${isEs ? 'IVA a pagar' : 'VAT to pay'}</span>
                        <div class="stat-icon" style="background: var(--accent-purple-light);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2">
                                <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value">${Helpers.formatCurrency(Math.abs(monthSummary.ivaToPay))}</div>
                    <div class="stat-change ${monthSummary.ivaToPay > 0 ? 'negative' : 'positive'}">
                        ${monthSummary.ivaToPay > 0 ? (isEs ? 'A pagar' : 'To pay') : (isEs ? 'A devolver' : 'To receive')}
                    </div>
                </div>
            </div>

            <!-- Quarterly Summary -->
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <span class="card-title">${isEs ? `Resumen Q${quarter} ${year}` : `Q${quarter} ${year} Summary`}</span>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; text-align: center;">
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">${isEs ? 'Ingresos' : 'Income'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-green);">${Helpers.formatCurrency(quarterSummary.income.total)}</div>
                        </div>
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">${isEs ? 'Gastos' : 'Expenses'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-red);">${Helpers.formatCurrency(quarterSummary.expenses.total)}</div>
                        </div>
                        <div>
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">${isEs ? 'Beneficio' : 'Profit'}</div>
                            <div style="font-size: 24px; font-weight: 700; color: ${quarterSummary.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${Helpers.formatCurrency(quarterSummary.profit)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Make globally available
window.Accounting = Accounting;
