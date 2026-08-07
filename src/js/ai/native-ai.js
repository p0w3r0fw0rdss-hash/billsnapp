/**
 * BillSnap - Native AI Engine
 * Uses transformers.js for browser-based AI without external APIs
 * Falls back to Tesseract if not available
 */

const NativeAI = {
    model: null,
    isLoaded: false,
    isLoading: false,
    modelType: null,

    /**
     * Available models (in order of preference)
     */
    models: {
        paddleocr: {
            name: 'PaddleOCR',
            description: 'Fast, accurate OCR for documents',
            size: '~15MB',
            accuracy: '⭐⭐⭐⭐',
            url: 'https://cdn.jsdelivr.net/npm/@paddle-js-models/ocr@1.0.0'
        },
        trocr: {
            name: 'TrOCR',
            description: 'Transformer-based OCR',
            size: '~200MB',
            accuracy: '⭐⭐⭐⭐⭐',
            url: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0'
        },
        easyocr: {
            name: 'EasyOCR',
            description: 'Multi-language OCR',
            size: '~50MB',
            accuracy: '⭐⭐⭐⭐',
            url: null // Not available as JS library
        }
    },

    /**
     * Initialize native AI
     */
    async init(modelType = 'auto') {
        if (this.isLoaded) return true;
        if (this.isLoading) {
            // Wait for current loading
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.isLoaded;
        }

        this.isLoading = true;

        try {
            // Auto-select model based on device capabilities
            if (modelType === 'auto') {
                modelType = await this.selectBestModel();
            }

            console.log(`Loading native AI model: ${modelType}`);

            // Try to load transformers.js for TrOCR
            if (modelType === 'trocr') {
                await this.loadTrOCR();
            } else {
                // Fallback to enhanced Tesseract
                await this.loadEnhancedTesseract();
            }

            this.modelType = modelType;
            this.isLoaded = true;
            console.log('Native AI loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading native AI:', error);
            this.isLoaded = false;
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Select best model based on device capabilities
     */
    async selectBestModel() {
        // Check if device has enough resources for TrOCR
        const memory = navigator.deviceMemory || 4; // Default to 4GB
        const cores = navigator.hardwareConcurrency || 4;

        // If device has 8GB+ RAM and 4+ cores, use TrOCR
        if (memory >= 8 && cores >= 4) {
            return 'trocr';
        }

        // Otherwise use enhanced Tesseract
        return 'tesseract';
    },

    /**
     * Load TrOCR model (best accuracy)
     */
    async loadTrOCR() {
        try {
            // Dynamically load transformers.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
            script.async = true;
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            // Wait for transformers to be available
            let attempts = 0;
            while (!window.transformers && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.transformers) {
                throw new Error('Transformers.js not loaded');
            }

            const { pipeline } = window.transformers;
            
            // Load OCR pipeline
            this.model = await pipeline('image-to-text', 'Xenova/trocr-base-handwritten', {
                progress_callback: (progress) => {
                    if (progress.status === 'progress') {
                        document.dispatchEvent(new CustomEvent('ai-progress', {
                            detail: { progress: progress.progress, model: 'TrOCR' }
                        }));
                    }
                }
            });

            return true;
        } catch (error) {
            console.error('Error loading TrOCR:', error);
            throw error;
        }
    },

    /**
     * Load enhanced Tesseract (fallback)
     */
    async loadEnhancedTesseract() {
        // Use the existing TesseractOCR module with enhanced settings
        if (!TesseractOCR.isInitialized) {
            await TesseractOCR.init();
        }
        this.model = 'tesseract';
        return true;
    },

    /**
     * Process invoice with native AI
     */
    async processInvoice(imageSource) {
        if (!this.isLoaded) {
            await this.init();
        }

        try {
            let rawText;

            if (this.modelType === 'trocr' && this.model) {
                // Use TrOCR
                const result = await this.model(imageSource);
                rawText = result[0]?.generated_text || '';
            } else {
                // Use enhanced Tesseract
                rawText = await TesseractOCR.recognize(imageSource);
            }

            // Extract invoice data from text
            const data = this.extractInvoiceData(rawText);
            
            return {
                ...data,
                rawText: rawText,
                confidence: this.modelType === 'trocr' ? 0.92 : 0.85,
                engine: `Native AI (${this.modelType === 'trocr' ? 'TrOCR' : 'Tesseract'})`
            };
        } catch (error) {
            console.error('Native AI processing error:', error);
            throw error;
        }
    },

    /**
     * Extract invoice data from text (enhanced version)
     */
    extractInvoiceData(text) {
        const data = {
            invoiceNumber: null,
            date: null,
            dueDate: null,
            issuer: { name: null, nif: null, address: null },
            receiver: { name: null, nif: null, address: null },
            description: null,
            baseAmount: 0,
            ivaPercent: 21,
            ivaAmount: 0,
            irpfPercent: 0,
            irpfAmount: 0,
            total: 0,
            subtotal: 0,
            paymentMethod: null,
            iban: null
        };

        if (!text) return data;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const fullText = lines.join(' ');

        // ---- INVOICE NUMBER ----
        const invoicePatterns = [
            /(?:factura|invoice|nº|num|número|number|fact\.?)[\s:]*#?\s*([A-Z0-9][-\w\/]*)/i,
            /(?:FACT|INV|F|BILL)[-\/\s#]*(\d+[-\/]\d+)/i,
            /([A-Z]{2,4}[-\/]\d{4}[-\/]\d{2,4})/,
            /#(\d{4,})/
        ];

        for (const pattern of invoicePatterns) {
            const match = fullText.match(pattern);
            if (match) {
                data.invoiceNumber = match[1].trim();
                break;
            }
        }

        // ---- DATES ----
        const datePatterns = [
            /(?:fecha|date|emisión|emision|invoice date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
            /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
            /(\d{1,2}\s+(?:de|of)\s+\w+\s+(?:de|of)\s+\d{4})/i
        ];

        const dates = [];
        for (const pattern of datePatterns) {
            const matches = fullText.matchAll(new RegExp(pattern, 'gi'));
            for (const match of matches) {
                const parsed = Helpers.parseDate(match[1]);
                if (parsed) dates.push(parsed);
            }
        }

        if (dates.length > 0) {
            data.date = dates[0];
            if (dates.length > 1) data.dueDate = dates[dates.length - 1];
        }

        // ---- ISSUER ----
        // Usually the first meaningful lines
        for (let i = 0; i < Math.min(6, lines.length); i++) {
            const line = lines[i];
            if (line.length > 3 && line.length < 80 && 
                !/factura|invoice|fecha|date|nif|cif|total|base|iva|irpf|subtotal/i.test(line)) {
                if (!data.issuer.name) {
                    data.issuer.name = line;
                } else if (!data.issuer.address && /\d+/.test(line)) {
                    data.issuer.address = line;
                }
            }
        }

        // ---- NIF/CIF ----
        const nifPatterns = [
            /(?:NIF|CIF|N\.I\.F\.|C\.I\.F\.|VAT|Tax ID)[\s:]*([A-Z]?\d{7,8}[A-Z0-9]?)/i,
            /([A-Z]\d{8})/,
            /(\d{8}[A-Z])/
        ];

        const nifs = [];
        for (const pattern of nifPatterns) {
            const matches = fullText.matchAll(new RegExp(pattern, 'gi'));
            for (const match of matches) {
                if (match[1] && match[1].length >= 8) nifs.push(match[1]);
            }
        }

        if (nifs.length >= 2) {
            data.issuer.nif = nifs[0];
            data.receiver.nif = nifs[1];
        } else if (nifs.length === 1) {
            data.issuer.nif = nifs[0];
        }

        // ---- AMOUNTS ----
        // Try to find all amounts in the text
        const allAmounts = [];
        const amountRegex = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
        let amountMatch;
        while ((amountMatch = amountRegex.exec(fullText)) !== null) {
            allAmounts.push({
                value: Helpers.parseCurrency(amountMatch[1]),
                index: amountMatch.index,
                context: fullText.substring(Math.max(0, amountMatch.index - 30), amountMatch.index + 10)
            });
        }

        // Find base amount
        const baseMatch = fullText.match(/(?:base\s*imponible|base|subtotal|net|neto)[\s:]*[€$]?\s*(\d+[.,]\d{2})/i);
        if (baseMatch) {
            data.baseAmount = Helpers.parseCurrency(baseMatch[1]);
        }

        // Find IVA percentage
        const ivaPercentMatch = fullText.match(/(?:iva|vat|iva)\s*(\d+)\s*%/i);
        if (ivaPercentMatch) {
            data.ivaPercent = parseInt(ivaPercentMatch[1]);
        }

        // Find IVA amount
        const ivaMatch = fullText.match(/(?:iva\s*(?:\d+%)?|cuota\s*iva|vat\s*amount|iva\s*amount)[\s:]*[€$]?\s*(\d+[.,]\d{2})/i);
        if (ivaMatch) {
            data.ivaAmount = Helpers.parseCurrency(ivaMatch[1]);
        }

        // Find IRPF
        const irpfMatch = fullText.match(/(?:irpf|retención|retencion|withholding)\s*(\d+)\s*%/i);
        if (irpfMatch) {
            data.irpfPercent = parseInt(irpfMatch[1]);
        }

        const irpfAmountMatch = fullText.match(/(?:irpf|retención|retencion)[\s:]*[€$]?\s*(\d+[.,]\d{2})/i);
        if (irpfAmountMatch) {
            data.irpfAmount = Helpers.parseCurrency(irpfAmountMatch[1]);
        }

        // Find total (usually the last or largest amount)
        const totalMatch = fullText.match(/(?:total|importe\s*total|total\s*a\s*pagar|amount\s*due|total\s*due)[\s:]*[€$]?\s*(\d+[.,]\d{2})/i);
        if (totalMatch) {
            data.total = Helpers.parseCurrency(totalMatch[1]);
        }

        // If we have amounts but no clear mapping, use heuristics
        if (allAmounts.length > 0 && data.total === 0) {
            // The largest amount is likely the total
            const sorted = [...allAmounts].sort((a, b) => b.value - a.value);
            data.total = sorted[0].value;
            
            // If there are multiple amounts, the second largest might be the base
            if (sorted.length > 1 && sorted[1].value < sorted[0].value) {
                data.baseAmount = sorted[1].value;
            }
        }

        // Calculate missing values
        if (data.baseAmount > 0 && data.total === 0) {
            data.ivaAmount = Helpers.calculateIVA(data.baseAmount, data.ivaPercent);
            data.irpfAmount = Helpers.calculateIRPF(data.baseAmount, data.irpfPercent);
            data.total = Helpers.calculateTotal(data.baseAmount, data.ivaAmount, data.irpfAmount);
        } else if (data.total > 0 && data.baseAmount === 0) {
            data.baseAmount = Math.round(data.total / (1 + data.ivaPercent / 100) * 100) / 100;
            data.ivaAmount = Helpers.calculateIVA(data.baseAmount, data.ivaPercent);
        }

        data.subtotal = data.baseAmount;

        // ---- IBAN ----
        const ibanMatch = fullText.match(/([A-Z]{2}\d{2}\s*(?:\d{4}\s*){4,7}\d{0,4})/);
        if (ibanMatch) {
            data.iban = ibanMatch[1].replace(/\s/g, '');
        }

        // ---- PAYMENT METHOD ----
        const paymentPatterns = [
            /(?:forma\s*de\s*pago|método\s*de\s*pago|payment\s*method|paid\s*by)[\s:]*([^\n]+)/i,
            /(?:transferencia|tarjeta|efectivo|domiciliación|paypal|credit\s*card|bank\s*transfer)/i
        ];

        for (const pattern of paymentPatterns) {
            const match = fullText.match(pattern);
            if (match) {
                data.paymentMethod = match[1] ? match[1].trim() : match[0];
                break;
            }
        }

        // ---- DESCRIPTION ----
        const descLines = lines.filter(l => 
            l.length > 5 && l.length < 200 &&
            !/factura|invoice|fecha|date|nif|cif|total|base|iva|irpf|subtotal/i.test(l)
        );
        if (descLines.length > 1) {
            data.description = descLines.slice(1, 3).join(' - ').substring(0, 200);
        }

        return data;
    },

    /**
     * Check if native AI is available
     */
    isAvailable() {
        return this.isLoaded;
    },

    /**
     * Get model info
     */
    getModelInfo() {
        return {
            type: this.modelType,
            name: this.modelType === 'trocr' ? 'TrOCR' : 'Enhanced Tesseract',
            accuracy: this.modelType === 'trocr' ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐',
            loaded: this.isLoaded
        };
    },

    /**
     * Preprocess image for better OCR
     */
    preprocessImage(imageSource) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Resize if too large (max 2000px on longest side)
                let width = img.width;
                let height = img.height;
                const maxSize = 2000;

                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Apply preprocessing
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                // Convert to grayscale and enhance contrast
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                    
                    // Apply contrast enhancement
                    const contrast = 1.4;
                    const factor = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));
                    const newVal = Math.min(255, Math.max(0, factor * (avg - 128) + 128));
                    
                    data[i] = newVal;
                    data[i + 1] = newVal;
                    data[i + 2] = newVal;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.src = imageSource;
        });
    },

    /**
     * Terminate model
     */
    async terminate() {
        this.model = null;
        this.isLoaded = false;
        this.modelType = null;
    }
};

// Make globally available
window.NativeAI = NativeAI;
