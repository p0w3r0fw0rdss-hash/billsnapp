/**
 * FacturApp - Main Application Controller
 */

const app = {
    // State
    currentSection: 'upload',
    uploadQueue: [],
    extractedInvoices: [],
    processingInProgress: false,
    sortField: 'date',
    sortAscending: true,
    charts: {
        monthly: null,
        categories: null
    },

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize database
            await DB.init();
            console.log('Database initialized');

            // Initialize authentication
            const currentUser = await Auth.init();
            
            // Check if user is logged in
            if (!Auth.isLoggedIn()) {
                // Show login screen
                document.getElementById('app').innerHTML = Auth.renderLoginForm();
                return;
            }

            // Load AI configuration
            await AIAPI.loadConfig();

            // Load Google Sheets configuration
            await GoogleSheets.loadConfig();

            // Set up event listeners
            this.setupEventListeners();

            // Load company data into settings
            await this.loadCompanyData();

            // Populate year dropdowns
            this.populateYearDropdowns();

            // Set current month in report selectors
            this.setCurrentPeriod();

            // Update user info in sidebar
            this.updateUserUI();

            // Show default section
            this.showSection('upload');

            // Load dashboard if there are invoices
            const count = await DB.getInvoiceCount();
            if (count > 0) {
                await this.loadDashboard();
                await this.loadInvoices();
            }

            Helpers.showToast(`Bienvenido, ${currentUser.name}`, 'success');
        } catch (error) {
            console.error('Error initializing app:', error);
            Helpers.showToast('Error al iniciar la aplicación', 'error');
        }
    },

    /**
     * Update user UI elements
     */
    updateUserUI() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        // Update sidebar user section
        const userSection = document.querySelector('.sidebar .border-t');
        if (userSection) {
            userSection.innerHTML = Auth.renderUserInfo().replace('<div class="p-4 border-t border-gray-200">', '').replace('</div>', '');
        }
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drop zone
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // OCR progress events
        document.addEventListener('ocr-progress', (e) => {
            this.updateProgress(e.detail.progress);
        });

        // Email method toggle
        const emailMethod = document.getElementById('email-method');
        if (emailMethod) {
            emailMethod.addEventListener('change', (e) => {
                document.getElementById('smtp-config').classList.toggle('hidden', e.target.value !== 'smtp');
                document.getElementById('sendgrid-config').classList.toggle('hidden', e.target.value !== 'sendgrid');
            });
        }

        // Filter change events
        const filterYear = document.getElementById('filter-year');
        const filterMonth = document.getElementById('filter-month');
        if (filterYear) filterYear.addEventListener('change', () => this.filterInvoices());
        if (filterMonth) filterMonth.addEventListener('change', () => this.filterInvoices());
    },

    /**
     * Show a section
     */
    showSection(sectionId) {
        // Check permissions
        if (!Auth.hasPermission('view') && sectionId !== 'settings') {
            Helpers.showToast('No tienes permisos para acceder a esta sección', 'error');
            return;
        }

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        const section = document.getElementById(`section-${sectionId}`);
        if (section) {
            section.classList.remove('hidden');
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-primary-50', 'text-primary-700');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('bg-primary-50', 'text-primary-700');
            }
        });

        this.currentSection = sectionId;

        // Load section data if needed
        if (sectionId === 'dashboard') this.loadDashboard();
        if (sectionId === 'invoices') this.loadInvoices();
        
        // Load user management if on settings page and user is admin
        if (sectionId === 'settings' && Auth.hasPermission('users')) {
            const userMgmt = document.getElementById('user-management');
            if (userMgmt) {
                userMgmt.innerHTML = Auth.renderUserManagement();
            }
        }
    },

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        this.handleFiles(event.target.files);
        event.target.value = ''; // Reset input
    },

    /**
     * Handle multiple files
     */
    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
            return validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i);
        });

        if (validFiles.length === 0) {
            Helpers.showToast('No se encontraron archivos válidos', 'error');
            return;
        }

        if (this.uploadQueue.length + validFiles.length > 30) {
            Helpers.showToast('Máximo 30 archivos por lote', 'error');
            return;
        }

        // Add to queue
        validFiles.forEach(file => {
            this.uploadQueue.push({
                id: Helpers.generateId(),
                file,
                name: file.name,
                size: file.size,
                status: 'pending', // pending, processing, done, error
                progress: 0,
                result: null,
                error: null
            });
        });

        // Update UI
        this.renderUploadQueue();
        document.getElementById('upload-queue').classList.remove('hidden');
        
        Helpers.showToast(`${validFiles.length} archivos añadidos a la cola`, 'info');
    },

    /**
     * Render upload queue
     */
    renderUploadQueue() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = this.uploadQueue.map(item => `
            <div class="px-4 py-3 flex items-center gap-4" id="file-${item.id}">
                <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    ${item.status === 'pending' ? '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' : ''}
                    ${item.status === 'processing' ? '<svg class="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' : ''}
                    ${item.status === 'done' ? '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                    ${item.status === 'error' ? '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${item.name}</p>
                    <p class="text-xs text-gray-500">${this.formatFileSize(item.size)}</p>
                    ${item.status === 'processing' ? `
                        <div class="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                            <div class="bg-blue-500 h-1.5 rounded-full transition-all" style="width: ${item.progress}%"></div>
                        </div>
                    ` : ''}
                    ${item.error ? `<p class="text-xs text-red-500 mt-1">${item.error}</p>` : ''}
                </div>
                ${item.status === 'pending' ? `
                    <button onclick="app.removeFromQueue('${item.id}')" class="text-gray-400 hover:text-red-500">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `).join('');

        // Update progress counter
        const done = this.uploadQueue.filter(i => i.status === 'done').length;
        document.getElementById('queue-progress').textContent = `${done}/${this.uploadQueue.length} procesadas`;
    },

    /**
     * Remove file from queue
     */
    removeFromQueue(fileId) {
        this.uploadQueue = this.uploadQueue.filter(item => item.id !== fileId);
        this.renderUploadQueue();
        
        if (this.uploadQueue.length === 0) {
            document.getElementById('upload-queue').classList.add('hidden');
        }
    },

    /**
     * Process all files in queue
     */
    async processQueue() {
        if (this.processingInProgress) return;
        this.processingInProgress = true;

        const processBtn = document.getElementById('process-btn');
        processBtn.disabled = true;
        processBtn.textContent = 'Procesando...';

        const selectedEngine = document.querySelector('input[name="ocr-engine"]:checked')?.value || 'tesseract';
        let processed = 0;
        const total = this.uploadQueue.filter(i => i.status === 'pending').length;

        for (const item of this.uploadQueue) {
            if (item.status !== 'pending') continue;

            try {
                item.status = 'processing';
                item.progress = 10;
                this.renderUploadQueue();

                // Read file as base64
                const base64 = await this.readFileAsDataURL(item.file);
                item.progress = 30;

                let result;
                
                if (selectedEngine === 'tesseract') {
                    result = await TesseractOCR.processInvoice(base64);
                } else if (selectedEngine === 'api' || selectedEngine === 'native') {
                    const base64Data = base64.split(',')[1];
                    result = await AIAPI.processInvoice(base64Data, selectedEngine);
                } else if (selectedEngine === 'ollama') {
                    const base64Data = base64.split(',')[1];
                    result = await AIAPI.processInvoice(base64Data, 'ollama');
                }

                item.progress = 90;
                item.result = result;
                item.status = 'done';
                
                // Add to extracted invoices
                this.extractedInvoices.push({
                    ...result,
                    sourceFile: item.name,
                    thumbnail: base64
                });

            } catch (error) {
                item.status = 'error';
                item.error = error.message;
                console.error(`Error processing ${item.name}:`, error);
            }

            item.progress = 100;
            processed++;
            
            // Update overall progress
            const overallPercent = Math.round((processed / total) * 100);
            document.getElementById('overall-progress').style.width = `${overallPercent}%`;
            document.getElementById('overall-percent').textContent = `${overallPercent}%`;
            
            this.renderUploadQueue();
        }

        processBtn.disabled = false;
        processBtn.textContent = 'Procesar todas';
        this.processingInProgress = false;

        // Show extracted data preview
        if (this.extractedInvoices.length > 0) {
            this.renderExtractedPreview();
            Helpers.showToast(`${this.extractedInvoices.length} facturas procesadas`, 'success');
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
     * Update progress indicator
     */
    updateProgress(progress) {
        // Could update a specific file's progress bar
    },

    /**
     * Render extracted data preview
     */
    renderExtractedPreview() {
        document.getElementById('extracted-preview').classList.remove('hidden');
        
        const tbody = document.getElementById('extracted-body');
        tbody.innerHTML = this.extractedInvoices.map((inv, idx) => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        <img src="${inv.thumbnail}" class="w-full h-full object-cover">
                    </div>
                </td>
                <td class="px-4 py-3 text-sm editable-cell" onclick="app.editExtracted(${idx}, 'date')">
                    ${Helpers.formatDate(inv.date) || '<span class="text-gray-400">-</span>'}
                </td>
                <td class="px-4 py-3 text-sm editable-cell" onclick="app.editExtracted(${idx}, 'invoiceNumber')">
                    ${inv.invoiceNumber || '<span class="text-gray-400">-</span>'}
                </td>
                <td class="px-4 py-3 text-sm editable-cell" onclick="app.editExtracted(${idx}, 'issuer')">
                    ${inv.issuer?.name || '<span class="text-gray-400">-</span>'}
                </td>
                <td class="px-4 py-3 text-sm text-right editable-cell" onclick="app.editExtracted(${idx}, 'baseAmount')">
                    ${Helpers.formatCurrency(inv.baseAmount)}
                </td>
                <td class="px-4 py-3 text-sm text-right editable-cell" onclick="app.editExtracted(${idx}, 'ivaAmount')">
                    ${Helpers.formatCurrency(inv.ivaAmount)}
                </td>
                <td class="px-4 py-3 text-sm text-right font-medium editable-cell" onclick="app.editExtracted(${idx}, 'total')">
                    ${Helpers.formatCurrency(inv.total)}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ${Math.round((inv.confidence || 0.75) * 100)}%
                    </span>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Edit extracted data inline
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

        const newValue = prompt(`Editar ${field}:`, currentValue);
        if (newValue === null) return;

        switch (field) {
            case 'date':
                inv.date = Helpers.parseDate(newValue) || newValue;
                break;
            case 'invoiceNumber':
                inv.invoiceNumber = newValue;
                break;
            case 'issuer':
                if (!inv.issuer) inv.issuer = {};
                inv.issuer.name = newValue;
                break;
            case 'baseAmount':
                inv.baseAmount = Helpers.parseCurrency(newValue);
                inv.ivaAmount = Helpers.calculateIVA(inv.baseAmount, inv.ivaPercent);
                inv.total = Helpers.calculateTotal(inv.baseAmount, inv.ivaAmount, inv.irpfAmount);
                break;
            case 'ivaAmount':
                inv.ivaAmount = Helpers.parseCurrency(newValue);
                inv.total = Helpers.calculateTotal(inv.baseAmount, inv.ivaAmount, inv.irpfAmount);
                break;
            case 'total':
                inv.total = Helpers.parseCurrency(newValue);
                break;
        }

        this.renderExtractedPreview();
    },

    /**
     * Save all extracted invoices to database
     */
    async saveExtracted() {
        if (this.extractedInvoices.length === 0) return;

        try {
            const existingCount = await DB.getInvoiceCount();
            
            for (let i = 0; i < this.extractedInvoices.length; i++) {
                const inv = this.extractedInvoices[i];
                
                // Generate invoice number if missing
                if (!inv.invoiceNumber) {
                    inv.invoiceNumber = Helpers.generateInvoiceNumber(existingCount + i);
                }

                // Ensure date
                if (!inv.date) {
                    inv.date = new Date().toISOString().split('T')[0];
                }

                // Set status
                inv.status = 'issued';

                // Save to database
                await DB.addInvoice(inv);
            }

            Helpers.showToast(`${this.extractedInvoices.length} facturas guardadas correctamente`, 'success');

            // Clear queue and preview
            this.uploadQueue = [];
            this.extractedInvoices = [];
            document.getElementById('upload-queue').classList.add('hidden');
            document.getElementById('extracted-preview').classList.add('hidden');

            // Reload invoices and dashboard
            await this.loadInvoices();
            await this.loadDashboard();

            // Switch to invoices section
            this.showSection('invoices');

        } catch (error) {
            console.error('Error saving invoices:', error);
            Helpers.showToast('Error al guardar las facturas', 'error');
        }
    },

    /**
     * Discard extracted data
     */
    discardExtracted() {
        this.extractedInvoices = [];
        document.getElementById('extracted-preview').classList.add('hidden');
        Helpers.showToast('Datos descartados', 'info');
    },

    /**
     * Load dashboard data
     */
    async loadDashboard() {
        try {
            const stats = await DB.getStats();

            // Update stat cards
            document.getElementById('stat-total-invoices').textContent = stats.totalInvoices;
            document.getElementById('stat-total-amount').textContent = Helpers.formatCurrency(stats.totalAmount);
            document.getElementById('stat-total-iva').textContent = Helpers.formatCurrency(stats.totalIVA);
            document.getElementById('stat-pending').textContent = stats.pendingCount;

            // Load recent invoices
            this.renderRecentInvoices(stats.invoices.slice(0, 5));

            // Load charts
            await this.loadCharts();

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },

    /**
     * Render recent invoices on dashboard
     */
    renderRecentInvoices(invoices) {
        const tbody = document.getElementById('recent-invoices-body');
        
        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No hay facturas todavía. ¡Sube tu primera factura!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = invoices.map(inv => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-600">${Helpers.formatDate(inv.date)}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${inv.invoiceNumber || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${inv.issuer?.name || '-'}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${Helpers.formatCurrency(inv.total)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                    }">
                        ${inv.status === 'paid' ? 'Pagada' : inv.status === 'pending' ? 'Pendiente' : 'Emitida'}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Load charts
     */
    async loadCharts() {
        const currentYear = new Date().getFullYear().toString();
        const monthly = await DB.getMonthlyStats(currentYear);
        const categories = await DB.getCategoryStats(currentYear);

        // Monthly chart
        const monthlyCtx = document.getElementById('chart-monthly');
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        this.charts.monthly = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Total Facturado',
                    data: monthNames.map((_, i) => {
                        const month = (i + 1).toString().padStart(2, '0');
                        return monthly[month]?.total || 0;
                    }),
                    backgroundColor: 'rgba(37, 99, 235, 0.5)',
                    borderColor: 'rgb(37, 99, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Helpers.formatCurrency(value)
                        }
                    }
                }
            }
        });

        // Categories chart
        const categoriesCtx = document.getElementById('chart-categories');
        if (this.charts.categories) {
            this.charts.categories.destroy();
        }

        const categoryLabels = Object.keys(categories);
        const categoryValues = Object.values(categories);

        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
        ];

        this.charts.categories = new Chart(categoriesCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels.map(l => l.substring(0, 20)),
                datasets: [{
                    data: categoryValues,
                    backgroundColor: colors.slice(0, categoryLabels.length)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Load invoices table
     */
    async loadInvoices() {
        try {
            const invoices = await DB.getAllInvoices(this.sortField, this.sortAscending);
            this.renderInvoicesTable(invoices);
            this.updateInvoiceTotals(invoices);
            
            // Populate filter years
            const years = await DB.getUniqueYears();
            const filterYear = document.getElementById('filter-year');
            filterYear.innerHTML = '<option value="">Todos los años</option>' +
                years.map(y => `<option value="${y}">${y}</option>`).join('');

        } catch (error) {
            console.error('Error loading invoices:', error);
        }
    },

    /**
     * Render invoices table
     */
    renderInvoicesTable(invoices) {
        const tbody = document.getElementById('invoices-body');

        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="px-6 py-12 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p class="font-medium">No hay facturas</p>
                        <p class="text-sm mt-1">Sube tu primera factura para empezar</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = invoices.map(inv => `
            <tr class="hover:bg-gray-50" data-id="${inv.id}">
                <td class="px-4 py-3">
                    <input type="checkbox" class="invoice-checkbox rounded" value="${inv.id}">
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${Helpers.formatDate(inv.date)}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${inv.invoiceNumber || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${(inv.issuer?.name || '-').substring(0, 25)}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${(inv.receiver?.name || '-').substring(0, 20)}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${(inv.description || '-').substring(0, 25)}</td>
                <td class="px-4 py-3 text-sm text-right">${Helpers.formatCurrency(inv.baseAmount)}</td>
                <td class="px-4 py-3 text-sm text-right">${inv.ivaPercent || 21}%</td>
                <td class="px-4 py-3 text-sm text-right">${Helpers.formatCurrency(inv.ivaAmount)}</td>
                <td class="px-4 py-3 text-sm text-right font-medium">${Helpers.formatCurrency(inv.total)}</td>
                <td class="px-4 py-3 text-center">
                    <select class="text-xs border border-gray-300 rounded px-1 py-0.5" onchange="app.updateInvoiceStatus('${inv.id}', this.value)">
                        <option value="issued" ${inv.status === 'issued' ? 'selected' : ''}>Emitida</option>
                        <option value="pending" ${inv.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>Pagada</option>
                        <option value="overdue" ${inv.status === 'overdue' ? 'selected' : ''}>Vencida</option>
                    </select>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button onclick="app.viewInvoice('${inv.id}')" class="p-1 text-gray-400 hover:text-blue-600" title="Ver">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </button>
                        <button onclick="app.editInvoice('${inv.id}')" class="p-1 text-gray-400 hover:text-yellow-600" title="Editar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="app.downloadInvoicePDF('${inv.id}')" class="p-1 text-gray-400 hover:text-green-600" title="PDF">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </button>
                        <button onclick="app.deleteInvoice('${inv.id}')" class="p-1 text-gray-400 hover:text-red-600" title="Eliminar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Update invoice totals footer
     */
    updateInvoiceTotals(invoices) {
        const totalBase = invoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalIVA = invoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

        document.getElementById('invoice-count').textContent = `${invoices.length} facturas`;
        document.getElementById('total-base').textContent = Helpers.formatCurrency(totalBase);
        document.getElementById('total-iva').textContent = Helpers.formatCurrency(totalIVA);
        document.getElementById('total-amount').textContent = Helpers.formatCurrency(totalAmount);
    },

    /**
     * Sort invoices
     */
    async sortBy(field) {
        if (this.sortField === field) {
            this.sortAscending = !this.sortAscending;
        } else {
            this.sortField = field;
            this.sortAscending = true;
        }
        await this.loadInvoices();
    },

    /**
     * Filter invoices
     */
    async filterInvoices() {
        const year = document.getElementById('filter-year').value;
        const month = document.getElementById('filter-month').value;

        let invoices;
        if (year && month) {
            invoices = await DB.getInvoicesByMonth(year, month);
        } else if (year) {
            invoices = await DB.getInvoicesByYear(year);
        } else {
            invoices = await DB.getAllInvoices(this.sortField, this.sortAscending);
        }

        this.renderInvoicesTable(invoices);
        this.updateInvoiceTotals(invoices);
    },

    /**
     * Update invoice status
     */
    async updateInvoiceStatus(id, status) {
        try {
            const invoice = await DB.getInvoice(id);
            invoice.status = status;
            await DB.updateInvoice(invoice);
            Helpers.showToast('Estado actualizado', 'success');
        } catch (error) {
            console.error('Error updating status:', error);
        }
    },

    /**
     * View invoice details
     */
    async viewInvoice(id) {
        const invoice = await DB.getInvoice(id);
        if (!invoice) return;

        const modal = document.getElementById('modal-content');
        modal.innerHTML = `
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold">Detalle de Factura</h3>
                    <button onclick="app.closeModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500">Nº Factura</p>
                            <p class="font-medium">${invoice.invoiceNumber || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Fecha</p>
                            <p class="font-medium">${Helpers.formatDate(invoice.date)}</p>
                        </div>
                    </div>
                    
                    <div class="border-t pt-4">
                        <p class="text-sm text-gray-500 mb-2">Emisor</p>
                        <p class="font-medium">${invoice.issuer?.name || '-'}</p>
                        <p class="text-sm text-gray-600">${invoice.issuer?.nif ? `NIF: ${invoice.issuer.nif}` : ''}</p>
                    </div>
                    
                    <div class="border-t pt-4">
                        <p class="text-sm text-gray-500 mb-2">Receptor</p>
                        <p class="font-medium">${invoice.receiver?.name || '-'}</p>
                        <p class="text-sm text-gray-600">${invoice.receiver?.nif ? `NIF: ${invoice.receiver.nif}` : ''}</p>
                    </div>
                    
                    ${invoice.description ? `
                        <div class="border-t pt-4">
                            <p class="text-sm text-gray-500 mb-2">Concepto</p>
                            <p>${invoice.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="border-t pt-4">
                        <div class="flex justify-between py-1">
                            <span class="text-gray-600">Base imponible:</span>
                            <span>${Helpers.formatCurrency(invoice.baseAmount)}</span>
                        </div>
                        <div class="flex justify-between py-1">
                            <span class="text-gray-600">IVA (${invoice.ivaPercent || 21}%):</span>
                            <span>${Helpers.formatCurrency(invoice.ivaAmount)}</span>
                        </div>
                        ${invoice.irpfPercent > 0 ? `
                            <div class="flex justify-between py-1">
                                <span class="text-gray-600">IRPF (-${invoice.irpfPercent}%):</span>
                                <span>-${Helpers.formatCurrency(invoice.irpfAmount)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between py-2 border-t mt-2 font-semibold text-lg">
                            <span>Total:</span>
                            <span class="text-primary-600">${Helpers.formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                    
                    ${invoice.paymentMethod ? `
                        <div class="border-t pt-4">
                            <p class="text-sm text-gray-500">Forma de pago: ${invoice.paymentMethod}</p>
                        </div>
                    ` : ''}
                    
                    ${invoice.iban ? `
                        <div>
                            <p class="text-sm text-gray-500">IBAN: ${invoice.iban}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="app.downloadInvoicePDF('${invoice.id}')" class="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Descargar PDF
                    </button>
                    <button onclick="app.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Cerrar
                    </button>
                </div>
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
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold">Editar Factura</h3>
                    <button onclick="app.closeModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="edit-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nº Factura</label>
                            <input type="text" id="edit-invoiceNumber" value="${invoice.invoiceNumber || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input type="date" id="edit-date" value="${invoice.date || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Emisor</label>
                            <input type="text" id="edit-issuer" value="${invoice.issuer?.name || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Emisor NIF</label>
                            <input type="text" id="edit-issuerNif" value="${invoice.issuer?.nif || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                        <input type="text" id="edit-description" value="${invoice.description || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Base imponible</label>
                            <input type="number" step="0.01" id="edit-base" value="${invoice.baseAmount || 0}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">IVA %</label>
                            <input type="number" step="1" id="edit-ivaPercent" value="${invoice.ivaPercent || 21}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
                            <input type="number" step="0.01" id="edit-total" value="${invoice.total || 0}" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="button" onclick="app.saveInvoiceEdit('${invoice.id}')" class="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                            Guardar
                        </button>
                        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
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
            invoice.issuer = {
                ...invoice.issuer,
                name: document.getElementById('edit-issuer').value,
                nif: document.getElementById('edit-issuerNif').value
            };
            invoice.description = document.getElementById('edit-description').value;
            invoice.baseAmount = parseFloat(document.getElementById('edit-base').value) || 0;
            invoice.ivaPercent = parseFloat(document.getElementById('edit-ivaPercent').value) || 21;
            invoice.total = parseFloat(document.getElementById('edit-total').value) || 0;
            invoice.ivaAmount = Helpers.calculateIVA(invoice.baseAmount, invoice.ivaPercent);

            await DB.updateInvoice(invoice);
            
            this.closeModal();
            await this.loadInvoices();
            await this.loadDashboard();
            
            Helpers.showToast('Factura actualizada', 'success');
        } catch (error) {
            console.error('Error saving invoice:', error);
            Helpers.showToast('Error al guardar', 'error');
        }
    },

    /**
     * Delete invoice
     */
    async deleteInvoice(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta factura?')) return;

        try {
            await DB.deleteInvoice(id);
            await this.loadInvoices();
            await this.loadDashboard();
            Helpers.showToast('Factura eliminada', 'success');
        } catch (error) {
            console.error('Error deleting invoice:', error);
            Helpers.showToast('Error al eliminar', 'error');
        }
    },

    /**
     * Download invoice PDF
     */
    async downloadInvoicePDF(id) {
        try {
            await PDFGenerator.downloadInvoice(id);
            Helpers.showToast('PDF descargado', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            Helpers.showToast('Error al generar PDF', 'error');
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    /**
     * Generate and download reports
     */
    async generateMonthlyReport() {
        const year = document.getElementById('report-year').value;
        const month = document.getElementById('report-month').value;
        try {
            await PDFGenerator.downloadMonthlyReport(year, month);
            Helpers.showToast('Informe mensual generado', 'success');
        } catch (error) {
            Helpers.showToast('Error al generar informe', 'error');
        }
    },

    async generateQuarterlyReport() {
        const year = document.getElementById('report-quarter-year').value;
        const quarter = document.getElementById('report-quarter').value;
        try {
            await PDFGenerator.downloadQuarterlyReport(year, quarter);
            Helpers.showToast('Informe trimestral generado', 'success');
        } catch (error) {
            Helpers.showToast('Error al generar informe', 'error');
        }
    },

    async generateAnnualReport() {
        const year = document.getElementById('report-annual-year').value;
        try {
            await PDFGenerator.downloadAnnualReport(year);
            Helpers.showToast('Informe anual generado', 'success');
        } catch (error) {
            Helpers.showToast('Error al generar informe', 'error');
        }
    },

    async generateAccountingBook() {
        const year = document.getElementById('report-book-year').value;
        try {
            await PDFGenerator.downloadAccountingBook(year);
            Helpers.showToast('Libro contable generado', 'success');
        } catch (error) {
            Helpers.showToast('Error al generar libro', 'error');
        }
    },

    async generateTaxReport() {
        const year = document.getElementById('report-tax-year').value;
        try {
            await PDFGenerator.downloadTaxReport(year);
            Helpers.showToast('Resumen fiscal generado', 'success');
        } catch (error) {
            Helpers.showToast('Error al generar resumen', 'error');
        }
    },

    async generatePDFReport() {
        const currentYear = new Date().getFullYear().toString();
        try {
            await PDFGenerator.downloadAnnualReport(currentYear);
            Helpers.showToast('Informe PDF generado', 'success');
        } catch (error) {
            Helpers.showToast('Error al generar PDF', 'error');
        }
    },

    showInvoiceSelector() {
        // Show modal to select invoice for PDF
        this.showSection('invoices');
        Helpers.showToast('Selecciona una factura de la tabla', 'info');
    },

    /**
     * Export functions
     */
    async exportCSV() {
        try {
            const invoices = await DB.getAllInvoices();
            
            const headers = ['Fecha', 'Nº Factura', 'Emisor', 'Emisor NIF', 'Receptor', 'Receptor NIF', 'Concepto', 'Base', 'IVA%', 'IVA', 'IRPF%', 'IRPF', 'Total', 'Estado'];
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
                inv.status || ''
            ]);

            const csv = [headers, ...rows].map(row => 
                row.map(cell => `"${cell}"`).join(',')
            ).join('\n');

            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Facturas_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            Helpers.showToast('CSV exportado', 'success');
        } catch (error) {
            Helpers.showToast('Error al exportar CSV', 'error');
        }
    },

    async exportJSON() {
        try {
            const data = await DB.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `FacturApp_Backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            Helpers.showToast('Backup exportado', 'success');
        } catch (error) {
            Helpers.showToast('Error al exportar', 'error');
        }
    },

    async importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            await DB.importAll(data);
            
            await this.loadInvoices();
            await this.loadDashboard();
            
            Helpers.showToast('Datos importados correctamente', 'success');
        } catch (error) {
            console.error('Error importing:', error);
            Helpers.showToast('Error al importar datos', 'error');
        }
        
        event.target.value = '';
    },

    async clearAllData() {
        if (!confirm('¿Estás seguro? Esto eliminará TODOS los datos. Se recomienda hacer un backup primero.')) return;
        if (!confirm('Última oportunidad: ¿realmente quieres borrar todo?')) return;

        try {
            await DB.clearAll();
            await this.loadInvoices();
            await this.loadDashboard();
            Helpers.showToast('Todos los datos han sido eliminados', 'info');
        } catch (error) {
            Helpers.showToast('Error al borrar datos', 'error');
        }
    },

    /**
     * Settings functions
     */
    async loadCompanyData() {
        const fields = ['company-name', 'company-nif', 'company-address', 'company-email', 'company-phone'];
        for (const field of fields) {
            const value = await DB.getSetting(field.replace('-', '_'));
            const el = document.getElementById(field);
            if (el && value) el.value = value;
        }
    },

    async saveCompanyData() {
        const fields = {
            'company-name': 'company_name',
            'company-nif': 'company_nif',
            'company-address': 'company_address',
            'company-email': 'company_email',
            'company-phone': 'company_phone'
        };

        for (const [elId, key] of Object.entries(fields)) {
            const value = document.getElementById(elId)?.value;
            if (value) await DB.saveSetting(key, value);
        }

        Helpers.showToast('Datos de empresa guardados', 'success');
    },

    async saveAIConfig() {
        const provider = document.getElementById('ai-provider').value;
        const apiKey = document.getElementById('ai-api-key').value;
        const ollamaUrl = document.getElementById('ollama-url').value;

        await AIAPI.saveConfig(provider, apiKey, ollamaUrl);
        Helpers.showToast('Configuración IA guardada', 'success');
    },

    async connectSheets() {
        try {
            const url = document.getElementById('sheets-url').value;
            const apiKey = document.getElementById('sheets-api-key').value;

            if (!url) {
                Helpers.showToast('Introduce la URL del Google Sheet', 'error');
                return;
            }

            const spreadsheetId = GoogleSheets.extractSpreadsheetId(url);
            await GoogleSheets.saveConfig(spreadsheetId, apiKey);

            // Initialize sheet with headers
            await GoogleSheets.initializeSheet();

            // Sync existing invoices
            const result = await GoogleSheets.syncAllInvoices();
            
            Helpers.showToast(`Conectado a Google Sheets. ${result.count} facturas sincronizadas.`, 'success');
        } catch (error) {
            console.error('Error connecting to Sheets:', error);
            Helpers.showToast('Error al conectar con Google Sheets: ' + error.message, 'error');
        }
    },

    async syncToSheets() {
        try {
            if (!GoogleSheets.config.connected) {
                Helpers.showToast('Primero conecta Google Sheets', 'error');
                return;
            }

            const result = await GoogleSheets.syncAllInvoices();
            Helpers.showToast(`${result.count} facturas sincronizadas con Google Sheets`, 'success');
        } catch (error) {
            Helpers.showToast('Error al sincronizar: ' + error.message, 'error');
        }
    },

    async importFromSheets() {
        try {
            if (!GoogleSheets.config.connected) {
                Helpers.showToast('Primero conecta Google Sheets', 'error');
                return;
            }

            if (!confirm('¿Importar facturas desde Google Sheets? Se añadirán a las existentes.')) return;

            const result = await GoogleSheets.importFromSheets();
            
            await this.loadInvoices();
            await this.loadDashboard();
            
            Helpers.showToast(`${result.count} facturas importadas desde Google Sheets`, 'success');
        } catch (error) {
            Helpers.showToast('Error al importar: ' + error.message, 'error');
        }
    },

    openSheetsView() {
        const url = GoogleSheets.generateSheetViewUrl();
        if (url) {
            window.open(url, '_blank');
        } else {
            Helpers.showToast('Primero conecta Google Sheets', 'error');
        }
    },

    async saveEmailConfig() {
        const method = document.getElementById('email-method').value;
        await DB.saveSetting('email_method', method);
        
        if (method === 'smtp') {
            await DB.saveSetting('smtp_host', document.getElementById('smtp-host').value);
            await DB.saveSetting('smtp_port', document.getElementById('smtp-port').value);
            await DB.saveSetting('smtp_user', document.getElementById('smtp-user').value);
            await DB.saveSetting('smtp_pass', document.getElementById('smtp-pass').value);
        } else if (method === 'sendgrid') {
            await DB.saveSetting('sendgrid_key', document.getElementById('sendgrid-key').value);
        }

        Helpers.showToast('Configuración email guardada', 'success');
    },

    /**
     * Utility functions
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    populateYearDropdowns() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push(y);
        }

        const yearSelects = ['report-year', 'report-quarter-year', 'report-annual-year', 'report-tax-year', 'report-book-year'];
        yearSelects.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
            }
        });
    },

    setCurrentPeriod() {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        
        const monthSelect = document.getElementById('report-month');
        if (monthSelect) monthSelect.value = month;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
