/**
 * BillSnap - Multi-Company Module
 * Manage multiple companies in one account
 */

const Companies = {
    currentCompanyId: null,
    companies: [],

    /**
     * Initialize companies
     */
    async init() {
        const saved = await DB.getSetting('companies');
        this.companies = saved || [];
        
        const currentId = await DB.getSetting('current_company_id');
        this.currentCompanyId = currentId || (this.companies.length > 0 ? this.companies[0].id : null);

        // If no companies, create default
        if (this.companies.length === 0) {
            await this.createDefaultCompany();
        }

        return this.currentCompanyId;
    },

    /**
     * Create default company from existing settings
     */
    async createDefaultCompany() {
        const name = await DB.getSetting('company_name') || 'Mi Empresa';
        const nif = await DB.getSetting('company_nif') || '';
        const address = await DB.getSetting('company_address') || '';
        const email = await DB.getSetting('company_email') || '';
        const phone = await DB.getSetting('company_phone') || '';

        const company = {
            id: Helpers.generateId(),
            name,
            nif,
            address,
            email,
            phone,
            createdAt: new Date().toISOString()
        };

        this.companies.push(company);
        this.currentCompanyId = company.id;
        
        await this.save();
        return company;
    },

    /**
     * Save companies to DB
     */
    async save() {
        await DB.saveSetting('companies', this.companies);
        await DB.saveSetting('current_company_id', this.currentCompanyId);
    },

    /**
     * Get current company
     */
    getCurrentCompany() {
        return this.companies.find(c => c.id === this.currentCompanyId) || this.companies[0];
    },

    /**
     * Get all companies
     */
    getAllCompanies() {
        return this.companies;
    },

    /**
     * Switch to a company
     */
    async switchCompany(companyId) {
        const company = this.companies.find(c => c.id === companyId);
        if (!company) throw new Error('Company not found');
        
        this.currentCompanyId = companyId;
        await this.save();
        return company;
    },

    /**
     * Add a new company
     */
    async addCompany(data) {
        const billing = await Billing.getCurrentPlan();
        const maxCompanies = billing.id === 'free' ? 1 : 
                            billing.id === 'autonomo' ? 1 :
                            billing.id === 'pyme' ? 3 :
                            billing.id === 'gestoria' ? 20 : -1;

        if (maxCompanies !== -1 && this.companies.length >= maxCompanies) {
            throw new Error(`Tu plan ${billing.name} permite máximo ${maxCompanies} empresas`);
        }

        const company = {
            id: Helpers.generateId(),
            name: data.name,
            nif: data.nif || '',
            address: data.address || '',
            email: data.email || '',
            phone: data.phone || '',
            createdAt: new Date().toISOString()
        };

        this.companies.push(company);
        await this.save();
        return company;
    },

    /**
     * Update a company
     */
    async updateCompany(companyId, data) {
        const company = this.companies.find(c => c.id === companyId);
        if (!company) throw new Error('Company not found');

        Object.assign(company, data, { updatedAt: new Date().toISOString() });
        await this.save();
        return company;
    },

    /**
     * Delete a company
     */
    async deleteCompany(companyId) {
        if (this.companies.length <= 1) {
            throw new Error('No puedes eliminar la última empresa');
        }

        this.companies = this.companies.filter(c => c.id !== companyId);
        
        if (this.currentCompanyId === companyId) {
            this.currentCompanyId = this.companies[0].id;
        }

        await this.save();
    },

    /**
     * Render company selector
     */
    renderSelector(lang = 'es') {
        const isEs = lang === 'es';
        const current = this.getCurrentCompany();

        if (this.companies.length <= 1) {
            return `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <span style="font-size: 14px;">🏢</span>
                    <span style="font-size: 13px; font-weight: 500;">${current?.name || 'Mi Empresa'}</span>
                </div>
            `;
        }

        return `
            <select onchange="app.switchCompany(this.value)" style="padding: 8px 12px; background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: 8px; font-size: 13px; font-weight: 500; max-width: 200px;">
                ${this.companies.map(c => `
                    <option value="${c.id}" ${c.id === this.currentCompanyId ? 'selected' : ''}>
                        🏢 ${c.name}
                    </option>
                `).join('')}
            </select>
        `;
    },

    /**
     * Render company management
     */
    renderManagement(lang = 'es') {
        const isEs = lang === 'es';

        return `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${isEs ? 'Mis Empresas' : 'My Companies'}</span>
                    <button class="btn btn-primary btn-sm" onclick="app.showAddCompanyModal()">
                        ${isEs ? '+ Añadir empresa' : '+ Add company'}
                    </button>
                </div>
                <div class="card-body" style="padding: 0;">
                    ${this.companies.map(company => `
                        <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid var(--border-secondary); ${company.id === this.currentCompanyId ? 'background: var(--accent-blue-light);' : ''}">
                            <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                🏢
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${company.name}</div>
                                <div style="font-size: 12px; color: var(--text-tertiary);">${company.nif || '-'} · ${company.email || '-'}</div>
                            </div>
                            ${company.id === this.currentCompanyId ? `
                                <span class="badge badge-blue">${isEs ? 'Activa' : 'Active'}</span>
                            ` : `
                                <button class="btn btn-ghost btn-sm" onclick="app.switchCompany('${company.id}')">
                                    ${isEs ? 'Activar' : 'Activate'}
                                </button>
                            `}
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="app.editCompany('${company.id}')" title="${isEs ? 'Editar' : 'Edit'}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// Make globally available
window.Companies = Companies;
