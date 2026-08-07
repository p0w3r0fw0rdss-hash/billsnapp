/**
 * BillSnap - WebLLM Engine
 * Runs AI models DIRECTLY IN THE BROWSER
 * No Ollama, no server, no API key needed
 * Uses WebGPU for acceleration
 */

const WebLLMAI = {
    engine: null,
    isReady: false,
    isLoading: false,
    currentModel: null,
    loadProgress: 0,

    /**
     * Available models for browser-based inference
     */
    models: {
        // TEXT MODELS (for reasoning about OCR text)
        'Qwen3.5-0.8B-Instruct-q4f16_1-MLC': {
            name: 'Qwen3.5 0.8B',
            description: 'Ultra-light. Works on ANY device.',
            descriptionEs: 'Ultra-ligero. Funciona en CUALQUIER dispositivo.',
            size: '~500MB',
            ram: '~1GB',
            quality: '⭐⭐',
            speed: 'Very fast',
            type: 'text',
            recommended: 'low'
        },
        'Llama-3.2-1B-Instruct-q4f16_1-MLC': {
            name: 'Llama 3.2 1B',
            description: 'Meta\'s small model. Good balance.',
            descriptionEs: 'Modelo pequeño de Meta. Buen equilibrio.',
            size: '~700MB',
            ram: '~1.5GB',
            quality: '⭐⭐⭐',
            speed: 'Fast',
            type: 'text',
            recommended: 'low'
        },
        'Phi-3.5-mini-instruct-q4f16_1-MLC': {
            name: 'Phi-3.5 Mini',
            description: 'Microsoft\'s smart small model. Great reasoning.',
            descriptionEs: 'Modelo pequeño inteligente de Microsoft. Excelente razonamiento.',
            size: '~2.2GB',
            ram: '~3GB',
            quality: '⭐⭐⭐⭐',
            speed: 'Medium',
            type: 'text',
            recommended: 'medium'
        },
        'Gemma-2-2b-it-q4f16_1-MLC': {
            name: 'Gemma 2 2B',
            description: 'Google\'s efficient model.',
            descriptionEs: 'Modelo eficiente de Google.',
            size: '~1.5GB',
            ram: '~2.5GB',
            quality: '⭐⭐⭐',
            speed: 'Fast',
            type: 'text',
            recommended: 'low'
        },
        'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
            name: 'Llama 3.2 3B',
            description: 'Strong reasoning. Needs decent hardware.',
            descriptionEs: 'Fuerte razonamiento. Necesita hardware decente.',
            size: '~2GB',
            ram: '~3.5GB',
            quality: '⭐⭐⭐⭐',
            speed: 'Medium',
            type: 'text',
            recommended: 'medium'
        },
        'Qwen2.5-7B-Instruct-q4f16_1-MLC': {
            name: 'Qwen 2.5 7B',
            description: 'Best quality for browser. Needs good GPU.',
            descriptionEs: 'La mejor calidad para navegador. Necesita buena GPU.',
            size: '~4.5GB',
            ram: '~6GB',
            quality: '⭐⭐⭐⭐⭐',
            speed: 'Slow',
            type: 'text',
            recommended: 'high'
        }
    },

    /**
     * Check if WebGPU is available
     */
    async checkWebGPU() {
        if (!navigator.gpu) {
            return { available: false, reason: 'WebGPU not supported. Use Chrome 113+, Edge 113+, or Safari 26+.' };
        }
        
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                return { available: false, reason: 'No compatible GPU found.' };
            }
            return { available: true, adapter };
        } catch (error) {
            return { available: false, reason: error.message };
        }
    },

    /**
     * Get recommended model based on device
     */
    getRecommendedModel() {
        const memory = navigator.deviceMemory || 4;
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

        if (isMobile || memory < 6) {
            return 'Qwen3.5-0.8B-Instruct-q4f16_1-MLC';
        } else if (memory < 10) {
            return 'Phi-3.5-mini-instruct-q4f16_1-MLC';
        } else {
            return 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
        }
    },

    /**
     * Initialize WebLLM
     */
    async init(modelId = null) {
        if (this.isReady && !modelId) return true;
        if (this.isLoading) {
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            return this.isReady;
        }

        this.isLoading = true;

        try {
            // Check WebGPU
            const gpuCheck = await this.checkWebGPU();
            if (!gpuCheck.available) {
                console.warn('WebGPU not available:', gpuCheck.reason);
                this.isReady = false;
                return false;
            }

            // Select model
            if (!modelId) {
                modelId = await DB.getSetting('webllm_model') || this.getRecommendedModel();
            }

            console.log(`Initializing WebLLM with model: ${modelId}`);

            // Dynamically load WebLLM
            if (!window.webllm) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/lib/index.js';
                script.type = 'module';
                script.async = true;
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load WebLLM'));
                    document.head.appendChild(script);
                });

                // Wait for it
                let attempts = 0;
                while (!window.webllm && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
            }

            if (!window.webllm) {
                throw new Error('WebLLM not available');
            }

            const { CreateMLCEngine } = window.webllm;

            this.emitProgress(0, modelId);

            // Create engine with progress callback
            this.engine = await CreateMLCEngine(modelId, {
                initProgressCallback: (progress) => {
                    this.loadProgress = progress.progress * 100;
                    this.emitProgress(this.loadProgress, modelId);
                }
            });

            this.currentModel = modelId;
            this.isReady = true;
            this.emitProgress(100, modelId);

            console.log(`WebLLM ready with model: ${modelId}`);
            return true;

        } catch (error) {
            console.error('WebLLM init error:', error);
            this.isReady = false;
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Emit progress event
     */
    emitProgress(progress, model) {
        this.loadProgress = progress;
        document.dispatchEvent(new CustomEvent('webllm-progress', {
            detail: { progress: Math.round(progress), model }
        }));
    },

    /**
     * Process invoice with WebLLM
     * First extracts text with Tesseract, then uses LLM to reason about it
     */
    async processInvoice(imageBase64) {
        if (!this.isReady) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('WebLLM not available. Use Chrome/Edge with WebGPU support.');
            }
        }

        try {
            const lang = i18n?.getLang() || 'es';
            
            // Step 1: Extract text with Tesseract (OCR)
            let ocrText = '';
            try {
                ocrText = await TesseractOCR.recognize(imageBase64);
            } catch (e) {
                console.warn('Tesseract OCR failed:', e);
            }

            // Step 2: Use LLM to reason about the text
            const systemPrompt = this.getSystemPrompt(lang);
            const userPrompt = lang === 'es' 
                ? `Texto extraído de una factura mediante OCR:\n\n---\n${ocrText}\n---\n\nExtrae todos los datos y devuelve SOLO JSON válido:`
                : `Text extracted from an invoice via OCR:\n\n---\n${ocrText}\n---\n\nExtract all data and return ONLY valid JSON:`;

            const response = await this.engine.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });

            const resultText = response.choices[0]?.message?.content || '';
            
            // Parse the result
            const parsed = this.parseResult(resultText);

            return {
                ...parsed,
                rawText: ocrText,
                rawResponse: resultText,
                confidence: 0.90,
                engine: `WebLLM (${this.getModelName()})`
            };

        } catch (error) {
            console.error('WebLLM processing error:', error);
            throw error;
        }
    },

    /**
     * Get system prompt
     */
    getSystemPrompt(lang) {
        if (lang === 'en') {
            return `You are an invoice data extractor. Given OCR text from an invoice, extract all information into valid JSON.

RULES:
- Return ONLY valid JSON, no explanations
- Use null for missing fields
- Dates in YYYY-MM-DD format
- Numbers without currency symbols

OUTPUT:
{
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD or null",
  "issuer": {"name": "string", "tax_id": "string", "address": "string"},
  "receiver": {"name": "string", "tax_id": "string"},
  "description": "string",
  "subtotal": number,
  "tax_rate": number,
  "tax_amount": number,
  "total": number,
  "currency": "EUR/USD/GBP",
  "payment_method": "string or null",
  "iban": "string or null"
}`;
        }

        return `Eres un extractor de datos de facturas. Dado el texto OCR de una factura, extrae toda la información en JSON válido.

REGLAS:
- Devuelve SOLO JSON válido, sin explicaciones
- Usa null para campos faltantes
- Fechas en formato YYYY-MM-DD
- Números sin símbolos de moneda

SALIDA:
{
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD o null",
  "issuer": {"name": "string", "tax_id": "string", "address": "string"},
  "receiver": {"name": "string", "tax_id": "string"},
  "description": "string",
  "subtotal": número,
  "tax_rate": número,
  "tax_amount": número,
  "total": número,
  "currency": "EUR/USD/GBP",
  "payment_method": "string o null",
  "iban": "string o null"
}`;
    },

    /**
     * Parse LLM response
     */
    parseResult(responseText) {
        try {
            let jsonStr = responseText;
            
            // Extract JSON from response
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1];

            const objMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objMatch) jsonStr = objMatch[0];

            const data = JSON.parse(jsonStr);

            return {
                invoiceNumber: data.invoice_number || null,
                date: data.date || null,
                dueDate: data.due_date || null,
                issuer: {
                    name: data.issuer?.name || null,
                    nif: data.issuer?.tax_id || null,
                    address: data.issuer?.address || null
                },
                receiver: {
                    name: data.receiver?.name || null,
                    nif: data.receiver?.tax_id || null
                },
                description: data.description || null,
                baseAmount: parseFloat(data.subtotal) || 0,
                ivaPercent: parseFloat(data.tax_rate) || 21,
                ivaAmount: parseFloat(data.tax_amount) || 0,
                total: parseFloat(data.total) || 0,
                currency: data.currency || 'EUR',
                paymentMethod: data.payment_method || null,
                iban: data.iban || null
            };
        } catch (error) {
            console.error('Parse error:', error);
            return {
                invoiceNumber: null,
                date: null,
                issuer: { name: null, nif: null },
                receiver: { name: null, nif: null },
                baseAmount: 0,
                ivaPercent: 21,
                ivaAmount: 0,
                total: 0
            };
        }
    },

    /**
     * Get model display name
     */
    getModelName() {
        return this.models[this.currentModel]?.name || this.currentModel || 'Unknown';
    },

    /**
     * Switch model
     */
    async switchModel(modelId) {
        if (this.currentModel === modelId && this.isReady) return true;
        
        // Cleanup
        if (this.engine) {
            this.engine = null;
        }
        this.isReady = false;
        
        // Save preference
        await DB.saveSetting('webllm_model', modelId);
        
        // Load new model
        return await this.init(modelId);
    },

    /**
     * Check if available
     */
    isAvailable() {
        return this.isReady;
    },

    /**
     * Get status info
     */
    getStatus() {
        return {
            ready: this.isReady,
            loading: this.isLoading,
            model: this.currentModel,
            modelName: this.getModelName(),
            progress: this.loadProgress
        };
    },

    /**
     * Get setup info for UI
     */
    getSetupInfo(lang = 'es') {
        const isEs = lang === 'es';
        const memory = navigator.deviceMemory || 4;
        
        return {
            title: isEs ? 'IA en el navegador (sin instalar nada)' : 'AI in the browser (no install needed)',
            description: isEs 
                ? 'BillSnap puede ejecutar modelos de IA directamente en tu navegador usando WebGPU. No necesitas instalar Ollama ni nada.'
                : 'BillSnap can run AI models directly in your browser using WebGPU. No need to install Ollama or anything.',
            requirements: isEs
                ? 'Requiere Chrome 113+, Edge 113+, o Safari 26+. Tu navegador SÍ soporta WebGPU.'
                : 'Requires Chrome 113+, Edge 113+, or Safari 26+. Your browser DOES support WebGPU.',
            deviceRAM: `${memory}GB`,
            recommendedModel: this.models[this.getRecommendedModel()]?.name || 'Qwen3.5 0.8B',
            models: Object.entries(this.models).map(([id, model]) => ({
                id,
                ...model,
                fitsDevice: this.modelFitsDevice(id)
            }))
        };
    },

    /**
     * Check if model fits current device
     */
    modelFitsDevice(modelId) {
        const memory = navigator.deviceMemory || 4;
        const model = this.models[modelId];
        if (!model) return false;
        
        const ramNeeded = parseFloat(model.ram) || 4;
        return memory >= ramNeeded;
    },

    /**
     * Cleanup
     */
    async terminate() {
        this.engine = null;
        this.isReady = false;
        this.currentModel = null;
    }
};

// Make globally available
window.WebLLMAI = WebLLMAI;
