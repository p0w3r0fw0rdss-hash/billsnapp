/**
 * BillSnap - Internationalization System
 * Supports English and Spanish
 */

const i18n = {
    currentLang: 'es',
    translations: {},

    /**
     * Initialize i18n
     */
    async init() {
        // Load saved language preference
        const savedLang = localStorage.getItem('billsnap_lang');
        if (savedLang) {
            this.currentLang = savedLang;
        } else {
            // Detect browser language
            const browserLang = navigator.language.substring(0, 2);
            this.currentLang = ['es', 'en'].includes(browserLang) ? browserLang : 'es';
        }

        // Load translations
        this.translations = {
            es: await this.loadTranslations('es'),
            en: await this.loadTranslations('en')
        };

        return this.currentLang;
    },

    /**
     * Load translations for a language
     */
    async loadTranslations(lang) {
        // Spanish translations
        const es = {
            // App
            'app.name': 'BillSnap',
            'app.tagline': 'Facturación inteligente con IA',
            'app.description': 'Sube fotos de facturas y extrae datos automáticamente',

            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.upload': 'Subir Facturas',
            'nav.invoices': 'Facturas',
            'nav.reports': 'Informes',
            'nav.settings': 'Configuración',
            'nav.clients': 'Clientes',

            // Auth
            'auth.login': 'Iniciar sesión',
            'auth.logout': 'Cerrar sesión',
            'auth.username': 'Usuario',
            'auth.password': 'Contraseña',
            'auth.welcome': 'Bienvenido, {name}',
            'auth.invalid': 'Usuario o contraseña incorrectos',
            'auth.default': 'Usuario por defecto: admin / admin123',

            // Upload
            'upload.title': 'Subir Facturas',
            'upload.dropzone': 'Arrastra hasta 30 facturas aquí',
            'upload.formats': 'JPG, PNG, PDF, HEIC, WebP',
            'upload.select': 'Seleccionar archivos',
            'upload.processing': 'Procesando...',
            'upload.process_all': 'Procesar todas',
            'upload.progress': '{current}/{total} procesadas',
            'upload.ocr_engine': 'Motor OCR',
            'upload.ocr_local': 'Local · Gratis',
            'upload.ocr_gpu': 'Local · GPU',
            'upload.ocr_api': 'Tu API key',
            'upload.ocr_native': 'Premium',

            // OCR Engines
            'ocr.tesseract': 'Tesseract.js',
            'ocr.ollama': 'Ollama',
            'ocr.api': 'API Externa',
            'ocr.native': 'IA Nativa',
            'ocr.precision': 'Precisión',

            // Invoices
            'invoices.title': 'Facturas',
            'invoices.date': 'Fecha',
            'invoices.number': 'Nº Factura',
            'invoices.issuer': 'Emisor',
            'invoices.receiver': 'Receptor',
            'invoices.concept': 'Concepto',
            'invoices.base': 'Base',
            'invoices.iva_percent': 'IVA %',
            'invoices.iva_amount': 'IVA €',
            'invoices.irpf': 'IRPF',
            'invoices.total': 'Total',
            'invoices.status': 'Estado',
            'invoices.actions': 'Acciones',
            'invoices.empty': 'No hay facturas',
            'invoices.empty_desc': 'Sube tu primera factura para empezar',
            'invoices.count': '{count} facturas',

            // Status
            'status.issued': 'Emitida',
            'status.pending': 'Pendiente',
            'status.paid': 'Pagada',
            'status.overdue': 'Vencida',

            // Dashboard
            'dashboard.title': 'Dashboard',
            'dashboard.total_invoices': 'Total Facturas',
            'dashboard.total_amount': 'Total Importe',
            'dashboard.total_iva': 'IVA Acumulado',
            'dashboard.pending': 'Facturas Pendientes',
            'dashboard.recent': 'Últimas Facturas',
            'dashboard.monthly': 'Ingresos por Mes',
            'dashboard.categories': 'Gastos por Categoría',

            // Reports
            'reports.title': 'Informes',
            'reports.monthly': 'Informe Mensual',
            'reports.monthly_desc': 'Resumen de todas las facturas del mes seleccionado',
            'reports.quarterly': 'Informe Trimestral',
            'reports.quarterly_desc': 'Liquidación de IVA (Modelo 303)',
            'reports.annual': 'Informe Anual',
            'reports.annual_desc': 'Resumen ejecutivo del año completo',
            'reports.invoice': 'Factura Individual',
            'reports.invoice_desc': 'Generar PDF de una factura específica',
            'reports.tax': 'Resumen Fiscal',
            'reports.tax_desc': 'IVA repercutido vs soportado',
            'reports.accounting': 'Libro Contable',
            'reports.accounting_desc': 'Ingresos y gastos completos',
            'reports.generate': 'Generar PDF',
            'reports.select_invoice': 'Seleccionar factura',

            // Settings
            'settings.title': 'Configuración',
            'settings.company': 'Datos de tu empresa',
            'settings.company_name': 'Nombre / Razón social',
            'settings.company_nif': 'NIF / CIF',
            'settings.company_address': 'Dirección',
            'settings.company_email': 'Email',
            'settings.company_phone': 'Teléfono',
            'settings.save': 'Guardar datos',
            'settings.ai_config': 'Configuración IA',
            'settings.ai_provider': 'Proveedor de IA externa',
            'settings.ai_key': 'API Key',
            'settings.ai_key_help': 'Tu API key se guarda localmente en tu navegador',
            'settings.ollama_url': 'URL Ollama (si usas local)',
            'settings.sheets': 'Google Sheets',
            'settings.sheets_url': 'URL del Google Sheet',
            'settings.sheets_key': 'API Key de Google',
            'settings.sheets_connect': 'Conectar y Sincronizar',
            'settings.sheets_sync': 'Sincronizar a Sheets',
            'settings.sheets_import': 'Importar desde Sheets',
            'settings.email': 'Configuración Email',
            'settings.email_method': 'Método de envío',
            'settings.email_mailto': 'Abrir cliente de correo (Mailto)',
            'settings.email_smtp': 'SMTP directo',
            'settings.email_sendgrid': 'SendGrid API',
            'settings.data': 'Gestión de datos',
            'settings.export': 'Exportar backup (JSON)',
            'settings.import': 'Importar backup (JSON)',
            'settings.delete_all': 'Borrar todos los datos',
            'settings.users': 'Gestión de Usuarios',
            'settings.language': 'Idioma',

            // Actions
            'action.save': 'Guardar',
            'action.cancel': 'Cancelar',
            'action.delete': 'Eliminar',
            'action.edit': 'Editar',
            'action.view': 'Ver',
            'action.export': 'Exportar',
            'action.import': 'Importar',
            'action.download': 'Descargar',
            'action.close': 'Cerrar',
            'action.confirm': 'Confirmar',
            'action.back': 'Volver',

            // Messages
            'msg.success': 'Operación exitosa',
            'msg.error': 'Error',
            'msg.saved': 'Guardado correctamente',
            'msg.deleted': 'Eliminado correctamente',
            'msg.exported': 'Exportado correctamente',
            'msg.imported': 'Importado correctamente',
            'msg.no_permission': 'No tienes permisos para acceder a esta sección',
            'msg.confirm_delete': '¿Estás seguro de que quieres eliminar esto?',
            'msg.confirm_delete_all': '¿Estás seguro? Esto eliminará TODOS los datos.',

            // Months
            'month.1': 'Enero',
            'month.2': 'Febrero',
            'month.3': 'Marzo',
            'month.4': 'Abril',
            'month.5': 'Mayo',
            'month.6': 'Junio',
            'month.7': 'Julio',
            'month.8': 'Agosto',
            'month.9': 'Septiembre',
            'month.10': 'Octubre',
            'month.11': 'Noviembre',
            'month.12': 'Diciembre',
            'month.all': 'Todos los meses',

            // Quarters
            'quarter.1': 'Q1 (Ene-Mar)',
            'quarter.2': 'Q2 (Abr-Jun)',
            'quarter.3': 'Q3 (Jul-Sep)',
            'quarter.4': 'Q4 (Oct-Dic)',

            // Misc
            'misc.all_years': 'Todos los años',
            'misc.select': 'Seleccionar',
            'misc.loading': 'Cargando...',
            'misc.search': 'Buscar facturas...',
            'misc.new_invoice': 'Nueva factura',
            'misc.currency': '€',
            'misc.percentage': '%'
        };

        // English translations
        const en = {
            'app.name': 'BillSnap',
            'app.tagline': 'Smart invoicing with AI',
            'app.description': 'Upload invoice photos and extract data automatically',

            'nav.dashboard': 'Dashboard',
            'nav.upload': 'Upload Invoices',
            'nav.invoices': 'Invoices',
            'nav.reports': 'Reports',
            'nav.settings': 'Settings',
            'nav.clients': 'Clients',

            'auth.login': 'Sign in',
            'auth.logout': 'Sign out',
            'auth.username': 'Username',
            'auth.password': 'Password',
            'auth.welcome': 'Welcome, {name}',
            'auth.invalid': 'Invalid username or password',
            'auth.default': 'Default user: admin / admin123',

            'upload.title': 'Upload Invoices',
            'upload.dropzone': 'Drag up to 30 invoices here',
            'upload.formats': 'JPG, PNG, PDF, HEIC, WebP',
            'upload.select': 'Select files',
            'upload.processing': 'Processing...',
            'upload.process_all': 'Process all',
            'upload.progress': '{current}/{total} processed',
            'upload.ocr_engine': 'OCR Engine',
            'upload.ocr_local': 'Local · Free',
            'upload.ocr_gpu': 'Local · GPU',
            'upload.ocr_api': 'Your API key',
            'upload.ocr_native': 'Premium',

            'ocr.tesseract': 'Tesseract.js',
            'ocr.ollama': 'Ollama',
            'ocr.api': 'External API',
            'ocr.native': 'Native AI',
            'ocr.precision': 'Accuracy',

            'invoices.title': 'Invoices',
            'invoices.date': 'Date',
            'invoices.number': 'Invoice #',
            'invoices.issuer': 'Issuer',
            'invoices.receiver': 'Receiver',
            'invoices.concept': 'Description',
            'invoices.base': 'Base',
            'invoices.iva_percent': 'VAT %',
            'invoices.iva_amount': 'VAT €',
            'invoices.irpf': 'Withholding',
            'invoices.total': 'Total',
            'invoices.status': 'Status',
            'invoices.actions': 'Actions',
            'invoices.empty': 'No invoices',
            'invoices.empty_desc': 'Upload your first invoice to get started',
            'invoices.count': '{count} invoices',

            'status.issued': 'Issued',
            'status.pending': 'Pending',
            'status.paid': 'Paid',
            'status.overdue': 'Overdue',

            'dashboard.title': 'Dashboard',
            'dashboard.total_invoices': 'Total Invoices',
            'dashboard.total_amount': 'Total Amount',
            'dashboard.total_iva': 'Accumulated VAT',
            'dashboard.pending': 'Pending Invoices',
            'dashboard.recent': 'Recent Invoices',
            'dashboard.monthly': 'Monthly Revenue',
            'dashboard.categories': 'Expenses by Category',

            'reports.title': 'Reports',
            'reports.monthly': 'Monthly Report',
            'reports.monthly_desc': 'Summary of all invoices for the selected month',
            'reports.quarterly': 'Quarterly Report',
            'reports.quarterly_desc': 'VAT settlement',
            'reports.annual': 'Annual Report',
            'reports.annual_desc': 'Executive summary for the full year',
            'reports.invoice': 'Individual Invoice',
            'reports.invoice_desc': 'Generate PDF of a specific invoice',
            'reports.tax': 'Tax Summary',
            'reports.tax_desc': 'Output VAT vs Input VAT',
            'reports.accounting': 'Accounting Book',
            'reports.accounting_desc': 'Complete income and expenses',
            'reports.generate': 'Generate PDF',
            'reports.select_invoice': 'Select invoice',

            'settings.title': 'Settings',
            'settings.company': 'Company Details',
            'settings.company_name': 'Company Name',
            'settings.company_nif': 'Tax ID',
            'settings.company_address': 'Address',
            'settings.company_email': 'Email',
            'settings.company_phone': 'Phone',
            'settings.save': 'Save',
            'settings.ai_config': 'AI Configuration',
            'settings.ai_provider': 'External AI Provider',
            'settings.ai_key': 'API Key',
            'settings.ai_key_help': 'Your API key is stored locally in your browser',
            'settings.ollama_url': 'Ollama URL (if local)',
            'settings.sheets': 'Google Sheets',
            'settings.sheets_url': 'Google Sheet URL',
            'settings.sheets_key': 'Google API Key',
            'settings.sheets_connect': 'Connect & Sync',
            'settings.sheets_sync': 'Sync to Sheets',
            'settings.sheets_import': 'Import from Sheets',
            'settings.email': 'Email Configuration',
            'settings.email_method': 'Sending method',
            'settings.email_mailto': 'Open email client (Mailto)',
            'settings.email_smtp': 'Direct SMTP',
            'settings.email_sendgrid': 'SendGrid API',
            'settings.data': 'Data Management',
            'settings.export': 'Export backup (JSON)',
            'settings.import': 'Import backup (JSON)',
            'settings.delete_all': 'Delete all data',
            'settings.users': 'User Management',
            'settings.language': 'Language',

            'action.save': 'Save',
            'action.cancel': 'Cancel',
            'action.delete': 'Delete',
            'action.edit': 'Edit',
            'action.view': 'View',
            'action.export': 'Export',
            'action.import': 'Import',
            'action.download': 'Download',
            'action.close': 'Close',
            'action.confirm': 'Confirm',
            'action.back': 'Back',

            'msg.success': 'Operation successful',
            'msg.error': 'Error',
            'msg.saved': 'Saved successfully',
            'msg.deleted': 'Deleted successfully',
            'msg.exported': 'Exported successfully',
            'msg.imported': 'Imported successfully',
            'msg.no_permission': 'You don\'t have permission to access this section',
            'msg.confirm_delete': 'Are you sure you want to delete this?',
            'msg.confirm_delete_all': 'Are you sure? This will delete ALL data.',

            'month.1': 'January',
            'month.2': 'February',
            'month.3': 'March',
            'month.4': 'April',
            'month.5': 'May',
            'month.6': 'June',
            'month.7': 'July',
            'month.8': 'August',
            'month.9': 'September',
            'month.10': 'October',
            'month.11': 'November',
            'month.12': 'December',
            'month.all': 'All months',

            'quarter.1': 'Q1 (Jan-Mar)',
            'quarter.2': 'Q2 (Apr-Jun)',
            'quarter.3': 'Q3 (Jul-Sep)',
            'quarter.4': 'Q4 (Oct-Dec)',

            'misc.all_years': 'All years',
            'misc.select': 'Select',
            'misc.loading': 'Loading...',
            'misc.search': 'Search invoices...',
            'misc.new_invoice': 'New invoice',
            'misc.currency': '€',
            'misc.percentage': '%'
        };

        return lang === 'en' ? en : es;
    },

    /**
     * Get translation for a key
     */
    t(key, params = {}) {
        let translation = this.translations[this.currentLang]?.[key] || key;

        // Replace parameters
        Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(`{${param}}`, value);
        });

        return translation;
    },

    /**
     * Get current language
     */
    getLang() {
        return this.currentLang;
    },

    /**
     * Set language
     */
    async setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('billsnap_lang', lang);
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        return lang;
    },

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return [
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'en', name: 'English', flag: '🇬🇧' }
        ];
    },

    /**
     * Format currency based on language
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '0,00 €';
        
        const locale = this.currentLang === 'es' ? 'es-ES' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    /**
     * Format date based on language
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        const locale = this.currentLang === 'es' ? 'es-ES' : 'en-US';
        return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
};

// Make globally available
window.i18n = i18n;
