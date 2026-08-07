/**
 * FacturApp - Utility Helpers
 */

const Helpers = {
    /**
     * Format number as currency (EUR)
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '0,00 €';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    /**
     * Format date to Spanish locale
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Parse various date formats to ISO string
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Try different formats
        const formats = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
            /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD or YYYY-MM-DD
            /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,  // DD de MMMM de YYYY
        ];
        
        // Spanish month names
        const months = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
            'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
        };
        
        // Try DD/MM/YYYY
        let match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
            const [, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Try YYYY-MM-DD
        match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (match) {
            const [, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Try DD de MMMM de YYYY
        match = dateStr.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
        if (match) {
            const [, day, monthName, year] = match;
            const monthNum = months[monthName.toLowerCase()];
            if (monthNum) {
                return `${year}-${monthNum}-${day.padStart(2, '0')}`;
            }
        }
        
        // Try to parse with Date constructor
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
        
        return null;
    },

    /**
     * Parse currency string to number
     */
    parseCurrency(str) {
        if (!str) return 0;
        // Remove currency symbols and spaces, replace comma with dot
        const cleaned = str.replace(/[€$£\s]/g, '').replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : Math.round(num * 100) / 100;
    },

    /**
     * Extract percentage from string
     */
    parsePercentage(str) {
        if (!str) return 0;
        const match = str.match(/(\d+(?:[.,]\d+)?)/);
        if (match) {
            return parseFloat(match[1].replace(',', '.'));
        }
        return 0;
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Generate invoice number
     */
    generateInvoiceNumber(count) {
        const year = new Date().getFullYear();
        const num = (count + 1).toString().padStart(4, '0');
        return `FACT-${year}-${num}`;
    },

    /**
     * Sort array by date field
     */
    sortByDate(arr, field = 'date', ascending = true) {
        return arr.sort((a, b) => {
            const dateA = new Date(a[field] || '1900-01-01');
            const dateB = new Date(b[field] || '1900-01-01');
            return ascending ? dateA - dateB : dateB - dateA;
        });
    },

    /**
     * Get current month and year
     */
    getCurrentPeriod() {
        const now = new Date();
        return {
            month: (now.getMonth() + 1).toString().padStart(2, '0'),
            year: now.getFullYear().toString()
        };
    },

    /**
     * Get quarter from month number
     */
    getQuarter(month) {
        return Math.ceil(parseInt(month) / 3);
    },

    /**
     * Get months in a quarter
     */
    getQuarterMonths(quarter) {
        const start = (quarter - 1) * 3;
        return [
            (start + 1).toString().padStart(2, '0'),
            (start + 2).toString().padStart(2, '0'),
            (start + 3).toString().padStart(2, '0')
        ];
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Validate NIF/CIF
     */
    validateNIF(nif) {
        if (!nif) return true; // Optional
        const cleaned = nif.toUpperCase().replace(/[\s\-]/g, '');
        // Basic format check
        return /^[A-Z]\d{7}[A-Z0-9]$/.test(cleaned) || /^\d{8}[A-Z]$/.test(cleaned);
    },

    /**
     * Calculate IVA amount
     */
    calculateIVA(base, ivaPercent) {
        return Math.round(base * (ivaPercent / 100) * 100) / 100;
    },

    /**
     * Calculate IRPF retention
     */
    calculateIRPF(base, irpfPercent) {
        return Math.round(base * (irpfPercent / 100) * 100) / 100;
    },

    /**
     * Calculate total from base, IVA, and IRPF
     */
    calculateTotal(base, ivaAmount, irpfAmount = 0) {
        return Math.round((base + ivaAmount - irpfAmount) * 100) / 100;
    }
};

// Make globally available
window.Helpers = Helpers;
