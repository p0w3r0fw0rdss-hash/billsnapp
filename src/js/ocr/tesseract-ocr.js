/**
 * FacturApp - Tesseract.js OCR Engine
 * Local, free, no internet required
 */

const TesseractOCR = {
    worker: null,
    isInitialized: false,

    /**
     * Initialize Tesseract worker
     */
    async init() {
        if (this.isInitialized) return;

        try {
            this.worker = await Tesseract.createWorker('spa+eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        document.dispatchEvent(new CustomEvent('ocr-progress', { 
                            detail: { progress, engine: 'tesseract' } 
                        }));
                    }
                }
            });

            this.isInitialized = true;
            console.log('Tesseract OCR initialized');
        } catch (error) {
            console.error('Error initializing Tesseract:', error);
            throw error;
        }
    },

    /**
     * Process an image and extract text
     */
    async recognize(imageSource) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            const result = await this.worker.recognize(imageSource);
            return result.data.text;
        } catch (error) {
            console.error('OCR recognition error:', error);
            throw error;
        }
    },

    /**
     * Process image and extract invoice data
     */
    async processInvoice(imageSource) {
        const text = await this.recognize(imageSource);
        return this.extractInvoiceData(text);
    },

    /**
     * Extract structured invoice data from raw text
     */
    extractInvoiceData(text) {
        const data = {
            rawText: text,
            invoiceNumber: null,
            date: null,
            dueDate: null,
            issuer: {
                name: null,
                nif: null,
                address: null
            },
            receiver: {
                name: null,
                nif: null,
                address: null
            },
            description: null,
            baseAmount: 0,
            ivaPercent: 21,
            ivaAmount: 0,
            irpfPercent: 0,
            irpfAmount: 0,
            total: 0,
            paymentMethod: null,
            iban: null,
            confidence: 0.75
        };

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

        // Extract invoice number
        const invoicePatterns = [
            /(?:factura|invoice|nº|num|número|number)[\s:]*(?:FACT[-\s]?)?([A-Z0-9][-\w\/]*)/i,
            /(?:FACT|INV|F)[-\/\s](\d+[-\/]\d+)/i,
            /([A-Z]{2,4}[-\/]\d{4}[-\/]\d{2,4})/,
        ];

        for (const pattern of invoicePatterns) {
            const match = text.match(pattern);
            if (match) {
                data.invoiceNumber = match[1].trim();
                break;
            }
        }

        // Extract dates
        const datePatterns = [
            /(?:fecha|date|emisión|emision)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
            /(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i,
            /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
        ];

        const dates = [];
        for (const pattern of datePatterns) {
            const matches = text.matchAll(new RegExp(pattern, 'gi'));
            for (const match of matches) {
                const parsed = Helpers.parseDate(match[1]);
                if (parsed) dates.push(parsed);
            }
        }

        if (dates.length > 0) {
            data.date = dates[0];
            if (dates.length > 1) {
                data.dueDate = dates[dates.length - 1];
            }
        }

        // Extract issuer name (usually first few lines)
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            if (line.length > 3 && line.length < 100 && !/factura|invoice|fecha|date/i.test(line)) {
                if (!data.issuer.name) {
                    data.issuer.name = line;
                }
            }
        }

        // Extract NIF/CIF
        const nifPatterns = [
            /(?:NIF|CIF|N\.I\.F\.|C\.I\.F\.)[\s:]*([A-Z]?\d{7,8}[A-Z0-9]?)/i,
            /([A-Z]\d{8})/,
            /(\d{8}[A-Z])/
        ];

        const nifs = [];
        for (const pattern of nifPatterns) {
            const matches = text.matchAll(new RegExp(pattern, 'gi'));
            for (const match of matches) {
                nifs.push(match[1]);
            }
        }

        if (nifs.length >= 2) {
            data.issuer.nif = nifs[0];
            data.receiver.nif = nifs[1];
        } else if (nifs.length === 1) {
            data.issuer.nif = nifs[0];
        }

        // Extract amounts
        const amountPatterns = [
            /(?:base\s*imponible|base|subtotal)[\s:]*([€$]?\s*\d+[.,]\d{2})/i,
            /(?:iva|iva\s*\d+%?|impuesto)[\s:]*([€$]?\s*\d+[.,]\d{2})/i,
            /(?:irpf|retención|retencion)[\s:]*([€$]?\s*\d+[.,]\d{2})/i,
            /(?:total|importe\s*total|total\s*a\s*pagar)[\s:]*([€$]?\s*\d+[.,]\d{2})/i,
        ];

        // Try to find base amount
        const baseMatch = text.match(/(?:base\s*imponible|base|subtotal)[\s:]*([€$]?\s*\d+[.,]\d{2})/i);
        if (baseMatch) {
            data.baseAmount = Helpers.parseCurrency(baseMatch[1]);
        }

        // Try to find IVA percentage
        const ivaPercentMatch = text.match(/(?:iva)\s*(\d+)\s*%/i);
        if (ivaPercentMatch) {
            data.ivaPercent = parseInt(ivaPercentMatch[1]);
        }

        // Try to find IVA amount
        const ivaMatch = text.match(/(?:iva\s*(?:\d+%)?|cuota\s*iva)[\s:]*([€$]?\s*\d+[.,]\d{2})/i);
        if (ivaMatch) {
            data.ivaAmount = Helpers.parseCurrency(ivaMatch[1]);
        }

        // Try to find IRPF
        const irpfMatch = text.match(/(?:irpf|retención|retencion)\s*(\d+)\s*%/i);
        if (irpfMatch) {
            data.irpfPercent = parseInt(irpfMatch[1]);
        }

        const irpfAmountMatch = text.match(/(?:irpf|retención|retencion)[\s:]*([€$]?\s*\d+[.,]\d{2})/i);
        if (irpfAmountMatch) {
            data.irpfAmount = Helpers.parseCurrency(irpfAmountMatch[1]);
        }

        // Try to find total
        const totalMatch = text.match(/(?:total|importe\s*total|total\s*a\s*pagar|importe)[\s:]*([€$]?\s*\d+[.,]\d{2})/i);
        if (totalMatch) {
            data.total = Helpers.parseCurrency(totalMatch[1]);
        }

        // If we have base but not total, calculate it
        if (data.baseAmount > 0 && data.total === 0) {
            data.ivaAmount = Helpers.calculateIVA(data.baseAmount, data.ivaPercent);
            data.irpfAmount = Helpers.calculateIRPF(data.baseAmount, data.irpfPercent);
            data.total = Helpers.calculateTotal(data.baseAmount, data.ivaAmount, data.irpfAmount);
        }

        // If we have total but not base, estimate
        if (data.total > 0 && data.baseAmount === 0) {
            data.baseAmount = Math.round(data.total / (1 + data.ivaPercent / 100) * 100) / 100;
            data.ivaAmount = Helpers.calculateIVA(data.baseAmount, data.ivaPercent);
        }

        // Extract IBAN
        const ibanMatch = text.match(/([A-Z]{2}\d{2}\s*(?:\d{4}\s*){4,7}\d{0,4})/);
        if (ibanMatch) {
            data.iban = ibanMatch[1].replace(/\s/g, '');
        }

        // Extract payment method
        const paymentPatterns = [
            /(?:forma\s*de\s*pago|método\s*de\s*pago|payment\s*method)[\s:]*([^\n]+)/i,
            /(?:transferencia|tarjeta|efectivo|domiciliación|paypal)/i
        ];

        for (const pattern of paymentPatterns) {
            const match = text.match(pattern);
            if (match) {
                data.paymentMethod = match[1] ? match[1].trim() : match[0];
                break;
            }
        }

        // Set description from first meaningful line after issuer
        const descLines = lines.filter(l => 
            l.length > 5 && 
            l.length < 200 && 
            !/factura|invoice|fecha|date|nif|cif|total|base|iva|irpf/i.test(l)
        );
        if (descLines.length > 1) {
            data.description = descLines.slice(1, 3).join(' - ');
        }

        return data;
    },

    /**
     * Preprocess image for better OCR
     */
    async preprocessImage(imageSource) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Convert to grayscale and increase contrast
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Increase contrast
                    const contrast = 1.5;
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
     * Terminate worker
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
        }
    }
};

// Make globally available
window.TesseractOCR = TesseractOCR;
