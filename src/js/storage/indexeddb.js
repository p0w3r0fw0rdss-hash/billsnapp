/**
 * FacturApp - IndexedDB Storage Manager
 */

const DB = {
    dbName: 'FacturAppDB',
    version: 1,
    db: null,

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Error opening database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Invoices store
                if (!db.objectStoreNames.contains('invoices')) {
                    const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
                    invoiceStore.createIndex('date', 'date', { unique: false });
                    invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
                    invoiceStore.createIndex('issuer', 'issuer.name', { unique: false });
                    invoiceStore.createIndex('status', 'status', { unique: false });
                    invoiceStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Company settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Clients store (for future use)
                if (!db.objectStoreNames.contains('clients')) {
                    const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
                    clientStore.createIndex('name', 'name', { unique: false });
                    clientStore.createIndex('nif', 'nif', { unique: false });
                }
            };
        });
    },

    /**
     * Get transaction and object store
     */
    getStore(storeName, mode = 'readonly') {
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    },

    /**
     * Add a new invoice
     */
    async addInvoice(invoice) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices', 'readwrite');
            const request = store.add({
                ...invoice,
                id: invoice.id || Helpers.generateId(),
                createdAt: invoice.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Update an existing invoice
     */
    async updateInvoice(invoice) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices', 'readwrite');
            const request = store.put({
                ...invoice,
                updatedAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get a single invoice by ID
     */
    async getInvoice(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all invoices, sorted by date
     */
    async getAllInvoices(sortBy = 'date', ascending = true) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices');
            const request = store.getAll();

            request.onsuccess = () => {
                let invoices = request.result;
                // Sort
                if (sortBy === 'date') {
                    invoices = Helpers.sortByDate(invoices, 'date', ascending);
                } else if (sortBy === 'total') {
                    invoices.sort((a, b) => ascending ? 
                        (a.total || 0) - (b.total || 0) : 
                        (b.total || 0) - (a.total || 0)
                    );
                } else if (sortBy === 'base') {
                    invoices.sort((a, b) => ascending ? 
                        (a.baseAmount || 0) - (b.baseAmount || 0) : 
                        (b.baseAmount || 0) - (a.baseAmount || 0)
                    );
                }
                resolve(invoices);
            };

            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get invoices by date range
     */
    async getInvoicesByDateRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices');
            const index = store.index('date');
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get invoices by year
     */
    async getInvoicesByYear(year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        return this.getInvoicesByDateRange(startDate, endDate);
    },

    /**
     * Get invoices by month
     */
    async getInvoicesByMonth(year, month) {
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;
        return this.getInvoicesByDateRange(startDate, endDate);
    },

    /**
     * Get invoices by quarter
     */
    async getInvoicesByQuarter(year, quarter) {
        const months = Helpers.getQuarterMonths(quarter);
        const startDate = `${year}-${months[0]}-01`;
        const lastDay = new Date(year, parseInt(months[2]), 0).getDate();
        const endDate = `${year}-${months[2]}-${lastDay}`;
        return this.getInvoicesByDateRange(startDate, endDate);
    },

    /**
     * Delete an invoice
     */
    async deleteInvoice(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices', 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Delete multiple invoices
     */
    async deleteInvoices(ids) {
        const store = this.getStore('invoices', 'readwrite');
        const promises = ids.map(id => {
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
        return Promise.all(promises);
    },

    /**
     * Get invoice count
     */
    async getInvoiceCount() {
        return new Promise((resolve, reject) => {
            const store = this.getStore('invoices');
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get unique years from invoices
     */
    async getUniqueYears() {
        const invoices = await this.getAllInvoices();
        const years = [...new Set(invoices.map(inv => {
            if (inv.date) {
                return inv.date.substring(0, 4);
            }
            return null;
        }).filter(Boolean))];
        return years.sort().reverse();
    },

    /**
     * Save a setting
     */
    async saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('settings', 'readwrite');
            const request = store.put({ key, value, updatedAt: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get a setting
     */
    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const store = this.getStore('settings');
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Export all data as JSON
     */
    async exportAll() {
        const invoices = await this.getAllInvoices();
        const settings = await this.getAllSettings();
        
        return {
            version: 1,
            exportDate: new Date().toISOString(),
            invoices,
            settings
        };
    },

    /**
     * Get all settings
     */
    async getAllSettings() {
        return new Promise((resolve, reject) => {
            const store = this.getStore('settings');
            const request = store.getAll();

            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Import data from JSON
     */
    async importAll(data) {
        if (!data || !data.invoices) {
            throw new Error('Invalid import data');
        }

        // Import invoices
        const invoiceStore = this.getStore('invoices', 'readwrite');
        for (const invoice of data.invoices) {
            await new Promise((resolve, reject) => {
                const request = invoiceStore.put(invoice);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        // Import settings
        if (data.settings) {
            const settingsStore = this.getStore('settings', 'readwrite');
            for (const [key, value] of Object.entries(data.settings)) {
                await new Promise((resolve, reject) => {
                    const request = settingsStore.put({ 
                        key, 
                        value, 
                        updatedAt: new Date().toISOString() 
                    });
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        }

        return true;
    },

    /**
     * Clear all data
     */
    async clearAll() {
        const invoiceStore = this.getStore('invoices', 'readwrite');
        const settingsStore = this.getStore('settings', 'readwrite');
        
        await new Promise((resolve, reject) => {
            const req1 = invoiceStore.clear();
            req1.onsuccess = () => resolve();
            req1.onerror = () => reject(req1.error);
        });

        await new Promise((resolve, reject) => {
            const req2 = settingsStore.clear();
            req2.onsuccess = () => resolve();
            req2.onerror = () => reject(req2.error);
        });

        return true;
    },

    /**
     * Get statistics
     */
    async getStats() {
        const invoices = await this.getAllInvoices();
        
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalBase = invoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalIVA = invoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
        const pendingCount = invoices.filter(inv => inv.status === 'pending' || inv.status === 'issued').length;

        return {
            totalInvoices: invoices.length,
            totalAmount,
            totalBase,
            totalIVA,
            pendingCount,
            invoices
        };
    },

    /**
     * Get monthly stats for chart
     */
    async getMonthlyStats(year) {
        const invoices = await this.getInvoicesByYear(year);
        const monthly = {};

        // Initialize all months
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            monthly[month] = { base: 0, iva: 0, total: 0, count: 0 };
        }

        // Aggregate
        invoices.forEach(inv => {
            if (inv.date) {
                const month = inv.date.substring(5, 7);
                if (monthly[month]) {
                    monthly[month].base += inv.baseAmount || 0;
                    monthly[month].iva += inv.ivaAmount || 0;
                    monthly[month].total += inv.total || 0;
                    monthly[month].count++;
                }
            }
        });

        return monthly;
    },

    /**
     * Get stats by issuer category
     */
    async getCategoryStats(year) {
        const invoices = year ? 
            await this.getInvoicesByYear(year) : 
            await this.getAllInvoices();
        
        const categories = {};
        
        invoices.forEach(inv => {
            const issuer = inv.issuer?.name || 'Sin categoría';
            if (!categories[issuer]) {
                categories[issuer] = 0;
            }
            categories[issuer] += inv.total || 0;
        });

        // Sort by amount and take top 10
        return Object.entries(categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
            }, {});
    }
};

// Make globally available
window.DB = DB;
