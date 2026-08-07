/**
 * FacturApp - Google Sheets Integration
 * Syncs invoice data with Google Sheets
 */

const GoogleSheets = {
    config: {
        spreadsheetId: null,
        apiKey: null,
        accessToken: null,
        connected: false
    },

    /**
     * Load configuration from storage
     */
    async loadConfig() {
        const spreadsheetId = await DB.getSetting('sheets_spreadsheet_id');
        const apiKey = await DB.getSetting('sheets_api_key');
        const accessToken = await DB.getSetting('sheets_access_token');

        this.config.spreadsheetId = spreadsheetId;
        this.config.apiKey = apiKey;
        this.config.accessToken = accessToken;
        this.config.connected = !!(spreadsheetId && (apiKey || accessToken));
    },

    /**
     * Save configuration
     */
    async saveConfig(spreadsheetId, apiKey, accessToken) {
        this.config.spreadsheetId = spreadsheetId;
        this.config.apiKey = apiKey;
        this.config.accessToken = accessToken;
        this.config.connected = true;

        await DB.saveSetting('sheets_spreadsheet_id', spreadsheetId);
        if (apiKey) await DB.saveSetting('sheets_api_key', apiKey);
        if (accessToken) await DB.saveSetting('sheets_access_token', accessToken);
    },

    /**
     * Extract spreadsheet ID from URL
     */
    extractSpreadsheetId(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : url;
    },

    /**
     * Get authorization URL for OAuth
     */
    getAuthUrl() {
        const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This would be configured
        const redirectUri = window.location.origin;
        const scope = 'https://www.googleapis.com/auth/spreadsheets';
        
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    },

    /**
     * Make API request to Google Sheets
     */
    async apiRequest(endpoint, method = 'GET', body = null) {
        if (!this.config.connected) {
            throw new Error('Google Sheets no está configurado');
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.config.accessToken) {
            headers['Authorization'] = `Bearer ${this.config.accessToken}`;
        } else if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error en la API de Google Sheets');
        }

        return response.json();
    },

    /**
     * Initialize spreadsheet with headers
     */
    async initializeSheet() {
        try {
            // Check if sheet exists and has headers
            const response = await this.apiRequest('/values/Sheet1!A1:N1');
            
            if (response.values && response.values.length > 0) {
                console.log('Sheet already initialized');
                return true;
            }
        } catch (error) {
            // Sheet might be empty, continue to add headers
        }

        // Add headers
        const headers = [
            ['Fecha', 'Nº Factura', 'Emisor', 'Emisor NIF', 'Receptor', 'Receptor NIF', 
             'Concepto', 'Base Imponible', 'IVA %', 'IVA €', 'IRPF %', 'IRPF €', 'Total', 'Estado']
        ];

        await this.apiRequest('/values/Sheet1!A1:N1?valueInputOption=USER_ENTERED', 'PUT', {
            values: headers
        });

        // Format headers (bold)
        await this.apiRequest(':batchUpdate', 'POST', {
            requests: [{
                repeatCell: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 14
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.145, green: 0.388, blue: 0.922 },
                            textFormat: {
                                foregroundColor: { red: 1, green: 1, blue: 1 },
                                bold: true
                            }
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
            }]
        });

        return true;
    },

    /**
     * Sync all invoices to Google Sheets
     */
    async syncAllInvoices() {
        try {
            const invoices = await DB.getAllInvoices();
            
            // Prepare data rows
            const rows = invoices.map(inv => [
                inv.date || '',
                inv.invoiceNumber || '',
                inv.issuer?.name || '',
                inv.issuer?.nif || '',
                inv.receiver?.name || '',
                inv.receiver?.nif || '',
                inv.description || '',
                inv.baseAmount || 0,
                inv.ivaPercent || 21,
                inv.ivaAmount || 0,
                inv.irpfPercent || 0,
                inv.irpfAmount || 0,
                inv.total || 0,
                inv.status || 'issued'
            ]);

            // Clear existing data (except headers)
            await this.apiRequest('/values/Sheet1!A2:N1000:clear', 'POST');

            // Add all rows
            if (rows.length > 0) {
                await this.apiRequest(`/values/Sheet1!A2:N${rows.length + 1}?valueInputOption=USER_ENTERED`, 'PUT', {
                    values: rows
                });
            }

            // Apply formatting
            await this.formatSheet(rows.length);

            return { success: true, count: rows.length };
        } catch (error) {
            console.error('Error syncing to Sheets:', error);
            throw error;
        }
    },

    /**
     * Add a single invoice to Google Sheets
     */
    async addInvoice(invoice) {
        try {
            const row = [
                invoice.date || '',
                invoice.invoiceNumber || '',
                invoice.issuer?.name || '',
                invoice.issuer?.nif || '',
                invoice.receiver?.name || '',
                invoice.receiver?.nif || '',
                invoice.description || '',
                invoice.baseAmount || 0,
                invoice.ivaPercent || 21,
                invoice.ivaAmount || 0,
                invoice.irpfPercent || 0,
                invoice.irpfAmount || 0,
                invoice.total || 0,
                invoice.status || 'issued'
            ];

            await this.apiRequest('/values/Sheet1!A:N:append?valueInputOption=USER_ENTERED', 'POST', {
                values: [row]
            });

            return true;
        } catch (error) {
            console.error('Error adding invoice to Sheets:', error);
            throw error;
        }
    },

    /**
     * Update an invoice in Google Sheets
     */
    async updateInvoice(invoice) {
        try {
            // Find the row with this invoice number
            const response = await this.apiRequest('/values/Sheet1!B:B');
            const rows = response.values || [];
            
            let rowIndex = -1;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0] === invoice.invoiceNumber) {
                    rowIndex = i + 1; // 1-indexed
                    break;
                }
            }

            if (rowIndex === -1) {
                // Invoice not found, add it
                return await this.addInvoice(invoice);
            }

            const row = [
                invoice.date || '',
                invoice.invoiceNumber || '',
                invoice.issuer?.name || '',
                invoice.issuer?.nif || '',
                invoice.receiver?.name || '',
                invoice.receiver?.nif || '',
                invoice.description || '',
                invoice.baseAmount || 0,
                invoice.ivaPercent || 21,
                invoice.ivaAmount || 0,
                invoice.irpfPercent || 0,
                invoice.irpfAmount || 0,
                invoice.total || 0,
                invoice.status || 'issued'
            ];

            await this.apiRequest(`/values/Sheet1!A${rowIndex}:N${rowIndex}?valueInputOption=USER_ENTERED`, 'PUT', {
                values: [row]
            });

            return true;
        } catch (error) {
            console.error('Error updating invoice in Sheets:', error);
            throw error;
        }
    },

    /**
     * Delete an invoice from Google Sheets
     */
    async deleteInvoice(invoiceNumber) {
        try {
            // Find the row
            const response = await this.apiRequest('/values/Sheet1!B:B');
            const rows = response.values || [];
            
            let rowIndex = -1;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0] === invoiceNumber) {
                    rowIndex = i; // 0-indexed for deleteDimension
                    break;
                }
            }

            if (rowIndex === -1) return false;

            // Delete the row
            await this.apiRequest(':batchUpdate', 'POST', {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            });

            return true;
        } catch (error) {
            console.error('Error deleting invoice from Sheets:', error);
            throw error;
        }
    },

    /**
     * Format the sheet with colors and number formats
     */
    async formatSheet(dataRows) {
        try {
            const requests = [];

            // Format currency columns (H, J, L, M - Base, IVA, IRPF, Total)
            const currencyColumns = [7, 9, 11, 12]; // 0-indexed
            currencyColumns.forEach(col => {
                requests.push({
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: dataRows + 1,
                            startColumnIndex: col,
                            endColumnIndex: col + 1
                        },
                        cell: {
                            userEnteredFormat: {
                                numberFormat: {
                                    type: 'CURRENCY',
                                    pattern: '#,##0.00 €'
                                }
                            }
                        },
                        fields: 'userEnteredFormat.numberFormat'
                    }
                });
            });

            // Format percentage columns (I, K - IVA%, IRPF%)
            const percentColumns = [8, 10];
            percentColumns.forEach(col => {
                requests.push({
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: dataRows + 1,
                            startColumnIndex: col,
                            endColumnIndex: col + 1
                        },
                        cell: {
                            userEnteredFormat: {
                                numberFormat: {
                                    type: 'NUMBER',
                                    pattern: '0"%"'
                                }
                            }
                        },
                        fields: 'userEnteredFormat.numberFormat'
                    }
                });
            });

            // Auto-resize columns
            for (let i = 0; i < 14; i++) {
                requests.push({
                    autoResizeDimensions: {
                        dimensions: {
                            sheetId: 0,
                            dimension: 'COLUMNS',
                            startIndex: i,
                            endIndex: i + 1
                        }
                    }
                });
            }

            // Apply alternating colors
            requests.push({
                addBanding: {
                    bandedRange: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: dataRows + 1,
                            startColumnIndex: 0,
                            endColumnIndex: 14
                        },
                        rowProperties: {
                            firstBandColor: { red: 1, green: 1, blue: 1 },
                            secondBandColor: { red: 0.95, green: 0.95, blue: 0.95 }
                        }
                    }
                }
            });

            await this.apiRequest(':batchUpdate', 'POST', { requests });
        } catch (error) {
            console.error('Error formatting sheet:', error);
        }
    },

    /**
     * Import invoices from Google Sheets
     */
    async importFromSheets() {
        try {
            const response = await this.apiRequest('/values/Sheet1!A2:N1000');
            const rows = response.values || [];

            const invoices = rows.map(row => ({
                date: row[0] || null,
                invoiceNumber: row[1] || null,
                issuer: {
                    name: row[2] || null,
                    nif: row[3] || null
                },
                receiver: {
                    name: row[4] || null,
                    nif: row[5] || null
                },
                description: row[6] || null,
                baseAmount: parseFloat(row[7]) || 0,
                ivaPercent: parseFloat(row[8]) || 21,
                ivaAmount: parseFloat(row[9]) || 0,
                irpfPercent: parseFloat(row[10]) || 0,
                irpfAmount: parseFloat(row[11]) || 0,
                total: parseFloat(row[12]) || 0,
                status: row[13] || 'issued',
                id: Helpers.generateId(),
                createdAt: new Date().toISOString()
            })).filter(inv => inv.invoiceNumber || inv.date); // Filter empty rows

            // Save to IndexedDB
            for (const invoice of invoices) {
                await DB.addInvoice(invoice);
            }

            return { success: true, count: invoices.length };
        } catch (error) {
            console.error('Error importing from Sheets:', error);
            throw error;
        }
    },

    /**
     * Generate HTML view of Google Sheet
     */
    generateSheetViewUrl() {
        if (!this.config.spreadsheetId) return null;
        return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit`;
    },

    /**
     * Generate embed URL for HTML view
     */
    generateEmbedUrl() {
        if (!this.config.spreadsheetId) return null;
        return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/gviz/tq?tqx=out:html`;
    },

    /**
     * Test connection
     */
    async testConnection() {
        try {
            await this.apiRequest('');
            return { success: true, message: 'Conexión exitosa con Google Sheets' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Create a new spreadsheet
     */
    async createSpreadsheet(title = 'FacturApp - Facturas') {
        try {
            const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.accessToken}`
                },
                body: JSON.stringify({
                    properties: {
                        title: title
                    },
                    sheets: [{
                        properties: {
                            title: 'Facturas',
                            gridProperties: {
                                frozenRowCount: 1
                            }
                        }
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Error creando spreadsheet');
            }

            const data = await response.json();
            return {
                success: true,
                spreadsheetId: data.spreadsheetId,
                url: data.spreadsheetUrl
            };
        } catch (error) {
            console.error('Error creating spreadsheet:', error);
            throw error;
        }
    }
};

// Make globally available
window.GoogleSheets = GoogleSheets;
