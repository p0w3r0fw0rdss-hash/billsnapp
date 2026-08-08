/**
 * BillsnApp - Supabase Database Operations
 * CRUD operations for all entities
 */

const SupabaseDB = {
    /**
     * ==================== COMPANIES ====================
     */
    
    async getCompanies() {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.get('companies', { user_id: userId }, { orderBy: 'name' });
    },

    async getCompany(id) {
        return await SupabaseClient.getById('companies', id);
    },

    async createCompany(data) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('companies', {
            ...data,
            user_id: userId
        });
    },

    async updateCompany(id, data) {
        return await SupabaseClient.update('companies', id, data);
    },

    async deleteCompany(id) {
        return await SupabaseClient.delete('companies', id);
    },

    /**
     * ==================== CLIENTS ====================
     */
    
    async getClients(companyId = null) {
        const userId = SupabaseAuth.getUserId();
        const filters = { user_id: userId };
        if (companyId) filters.company_id = companyId;
        return await SupabaseClient.get('clients', filters, { orderBy: 'name' });
    },

    async getClient(id) {
        return await SupabaseClient.getById('clients', id);
    },

    async createClient(data) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('clients', {
            ...data,
            user_id: userId
        });
    },

    async updateClient(id, data) {
        return await SupabaseClient.update('clients', id, data);
    },

    async deleteClient(id) {
        return await SupabaseClient.delete('clients', id);
    },

    /**
     * ==================== INVOICES (Received) ====================
     */
    
    async getInvoices(filters = {}) {
        const userId = SupabaseAuth.getUserId();
        const queryFilters = { user_id: userId };
        
        if (filters.company_id) queryFilters.company_id = filters.company_id;
        if (filters.type) queryFilters.type = filters.type;
        if (filters.status) queryFilters.status = filters.status;
        if (filters.category) queryFilters.category = filters.category;

        const options = {
            orderBy: filters.orderBy || 'date',
            ascending: filters.ascending ?? false
        };

        return await SupabaseClient.get('invoices', queryFilters, options);
    },

    async getInvoice(id) {
        return await SupabaseClient.getById('invoices', id);
    },

    async createInvoice(data) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('invoices', {
            ...data,
            user_id: userId,
            created_at: new Date().toISOString()
        });
    },

    async updateInvoice(id, data) {
        return await SupabaseClient.update('invoices', id, data);
    },

    async deleteInvoice(id) {
        return await SupabaseClient.delete('invoices', id);
    },

    async getInvoicesByDateRange(startDate, endDate, companyId = null) {
        const userId = SupabaseAuth.getUserId();
        // Supabase doesn't support complex queries directly, so we filter in JS
        const invoices = await this.getInvoices({ company_id: companyId });
        return invoices.filter(inv => {
            const date = inv.date;
            return date >= startDate && date <= endDate;
        });
    },

    async getInvoicesByMonth(year, month, companyId = null) {
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        return await this.getInvoicesByDateRange(startDate, endDate, companyId);
    },

    async getInvoicesByQuarter(year, quarter, companyId = null) {
        const startMonth = ((quarter - 1) * 3 + 1).toString().padStart(2, '0');
        const endMonth = (quarter * 3).toString().padStart(2, '0');
        const startDate = `${year}-${startMonth}-01`;
        const lastDay = new Date(year, parseInt(endMonth), 0).getDate();
        const endDate = `${year}-${endMonth}-${lastDay.toString().padStart(2, '0')}`;
        return await this.getInvoicesByDateRange(startDate, endDate, companyId);
    },

    async getInvoicesByYear(year, companyId = null) {
        return await this.getInvoicesByDateRange(`${year}-01-01`, `${year}-12-31`, companyId);
    },

    /**
     * ==================== EMITTED INVOICES ====================
     */
    
    async getEmittedInvoices(filters = {}) {
        const userId = SupabaseAuth.getUserId();
        const queryFilters = { user_id: userId };
        
        if (filters.company_id) queryFilters.company_id = filters.company_id;
        if (filters.client_id) queryFilters.client_id = filters.client_id;
        if (filters.status) queryFilters.status = filters.status;

        return await SupabaseClient.get('emitted_invoices', queryFilters, {
            orderBy: 'date',
            ascending: false
        });
    },

    async getEmittedInvoice(id) {
        return await SupabaseClient.getById('emitted_invoices', id);
    },

    async createEmittedInvoice(data) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('emitted_invoices', {
            ...data,
            user_id: userId
        });
    },

    async updateEmittedInvoice(id, data) {
        return await SupabaseClient.update('emitted_invoices', id, data);
    },

    async deleteEmittedInvoice(id) {
        return await SupabaseClient.delete('emitted_invoices', id);
    },

    /**
     * ==================== CATEGORIES ====================
     */
    
    async getCategories(type = null) {
        const userId = SupabaseAuth.getUserId();
        const filters = { user_id: userId };
        if (type) filters.type = type;
        return await SupabaseClient.get('categories', filters);
    },

    async createCategory(data) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('categories', {
            ...data,
            user_id: userId
        });
    },

    async updateCategory(id, data) {
        return await SupabaseClient.update('categories', id, data);
    },

    async deleteCategory(id) {
        return await SupabaseClient.delete('categories', id);
    },

    /**
     * ==================== SUBSCRIPTIONS ====================
     */
    
    async getSubscription() {
        const userId = SupabaseAuth.getUserId();
        const subs = await SupabaseClient.get('subscriptions', { user_id: userId });
        return subs[0] || null;
    },

    async createSubscription(data) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('subscriptions', {
            ...data,
            user_id: userId
        });
    },

    async updateSubscription(id, data) {
        return await SupabaseClient.update('subscriptions', id, data);
    },

    async incrementInvoiceUsage() {
        const sub = await this.getSubscription();
        if (sub) {
            await this.updateSubscription(sub.id, {
                invoices_used: (sub.invoices_used || 0) + 1
            });
        }
    },

    async canProcessInvoice() {
        const sub = await this.getSubscription();
        if (!sub || sub.plan === 'free') {
            const count = await this.getInvoiceCount();
            return { allowed: count < 20, remaining: 20 - count, limit: 20 };
        }
        if (sub.invoices_limit === -1) {
            return { allowed: true, remaining: -1, limit: -1 };
        }
        const remaining = sub.invoices_limit - (sub.invoices_used || 0);
        return { allowed: remaining > 0, remaining, limit: sub.invoices_limit };
    },

    /**
     * ==================== CREDITS ====================
     */
    
    async getCredits() {
        const userId = SupabaseAuth.getUserId();
        const credits = await SupabaseClient.get('credits', { user_id: userId });
        return credits.reduce((total, c) => total + (c.amount - (c.used || 0)), 0);
    },

    async addCredits(amount, stripePaymentId = null) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('credits', {
            user_id: userId,
            amount,
            used: 0,
            stripe_payment_id: stripePaymentId
        });
    },

    async useCredit() {
        const userId = SupabaseAuth.getUserId();
        const credits = await SupabaseClient.get('credits', { user_id: userId });
        
        for (const credit of credits) {
            if (credit.used < credit.amount) {
                await SupabaseClient.update('credits', credit.id, {
                    used: credit.used + 1
                });
                return true;
            }
        }
        return false;
    },

    /**
     * ==================== SETTINGS ====================
     */
    
    async getSetting(key) {
        const userId = SupabaseAuth.getUserId();
        const settings = await SupabaseClient.get('settings', { user_id: userId, key });
        return settings[0]?.value || null;
    },

    async saveSetting(key, value) {
        const userId = SupabaseAuth.getUserId();
        const existing = await SupabaseClient.get('settings', { user_id: userId, key });
        
        if (existing.length > 0) {
            return await SupabaseClient.update('settings', existing[0].id, { value });
        } else {
            return await SupabaseClient.insert('settings', {
                user_id: userId,
                key,
                value
            });
        }
    },

    /**
     * ==================== STATISTICS ====================
     */
    
    async getStats(companyId = null) {
        const invoices = await this.getInvoices({ company_id: companyId });
        
        const incomeInvoices = invoices.filter(inv => inv.type === 'income');
        const expenseInvoices = invoices.filter(inv => inv.type === 'expense');
        
        const totalIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalIVAIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
        const totalIVAExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);

        return {
            totalInvoices: invoices.length,
            totalIncome,
            totalExpenses,
            profit: totalIncome - totalExpenses,
            ivaToPay: totalIVAIncome - totalIVAExpenses,
            incomeCount: incomeInvoices.length,
            expenseCount: expenseInvoices.length,
            invoices
        };
    },

    async getMonthlyStats(year, companyId = null) {
        const invoices = await this.getInvoicesByYear(year, companyId);
        
        const monthly = {};
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            monthly[month] = {
                income: { count: 0, total: 0, iva: 0 },
                expenses: { count: 0, total: 0, iva: 0 },
                profit: 0
            };
        }

        invoices.forEach(inv => {
            if (!inv.date) return;
            const month = inv.date.substring(5, 7);
            if (!monthly[month]) return;

            if (inv.type === 'income') {
                monthly[month].income.count++;
                monthly[month].income.total += inv.total || 0;
                monthly[month].income.iva += inv.tax_amount || 0;
            } else {
                monthly[month].expenses.count++;
                monthly[month].expenses.total += inv.total || 0;
                monthly[month].expenses.iva += inv.tax_amount || 0;
            }
        });

        Object.values(monthly).forEach(m => {
            m.profit = m.income.total - m.expenses.total;
        });

        return monthly;
    },

    async getCategoryStats(type = 'expense', companyId = null) {
        const invoices = await this.getInvoices({ company_id: companyId, type });
        
        const categories = {};
        invoices.forEach(inv => {
            const cat = inv.category || 'Sin categoría';
            if (!categories[cat]) {
                categories[cat] = { count: 0, total: 0 };
            }
            categories[cat].count++;
            categories[cat].total += inv.total || 0;
        });

        return categories;
    },

    async getInvoiceCount(companyId = null) {
        const invoices = await this.getInvoices({ company_id: companyId });
        return invoices.length;
    },

    /**
     * ==================== FILE UPLOAD ====================
     */
    
    async uploadFile(file, path) {
        return await SupabaseClient.uploadFile('invoices', path, file);
    },

    getFileUrl(path) {
        return SupabaseClient.getPublicUrl('invoices', path);
    },

    async deleteFile(path) {
        return await SupabaseClient.deleteFile('invoices', path);
    },

    /**
     * ==================== EVENT LOG ====================
     */
    
    async logEvent(eventType, invoiceId = null, data = {}) {
        const userId = SupabaseAuth.getUserId();
        return await SupabaseClient.insert('event_log', {
            user_id: userId,
            invoice_id: invoiceId,
            event_type: eventType,
            event_data: data
        });
    },

    async getEvents(invoiceId = null) {
        const userId = SupabaseAuth.getUserId();
        const filters = { user_id: userId };
        if (invoiceId) filters.invoice_id = invoiceId;
        return await SupabaseClient.get('event_log', filters, {
            orderBy: 'created_at',
            ascending: false
        });
    },

    /**
     * ==================== EXPORT/IMPORT ====================
     */
    
    async exportAll() {
        const userId = SupabaseAuth.getUserId();
        
        const [companies, clients, invoices, emittedInvoices] = await Promise.all([
            this.getCompanies(),
            this.getClients(),
            this.getInvoices(),
            this.getEmittedInvoices()
        ]);

        return {
            version: 1,
            exportDate: new Date().toISOString(),
            userId,
            companies,
            clients,
            invoices,
            emittedInvoices
        };
    },

    async importAll(data) {
        if (!data) throw new Error('Invalid import data');

        // Import companies
        if (data.companies) {
            for (const company of data.companies) {
                const { id, user_id, ...rest } = company;
                await this.createCompany(rest);
            }
        }

        // Import clients
        if (data.clients) {
            for (const client of data.clients) {
                const { id, user_id, ...rest } = client;
                await this.createClient(rest);
            }
        }

        // Import invoices
        if (data.invoices) {
            for (const invoice of data.invoices) {
                const { id, user_id, ...rest } = invoice;
                await this.createInvoice(rest);
            }
        }

        return true;
    },

    async clearAll() {
        const userId = SupabaseAuth.getUserId();
        
        // Delete all user data
        const tables = ['invoices', 'emitted_invoices', 'clients', 'companies', 'categories', 'settings', 'event_log'];
        
        for (const table of tables) {
            const records = await SupabaseClient.get(table, { user_id: userId });
            for (const record of records) {
                await SupabaseClient.delete(table, record.id);
            }
        }
    }
};

// Make globally available
window.SupabaseDB = SupabaseDB;
