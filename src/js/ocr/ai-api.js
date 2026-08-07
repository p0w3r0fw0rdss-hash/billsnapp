/**
 * FacturApp - AI API OCR Engine
 * Supports OpenAI, Google Gemini, HuggingFace, and Ollama
 */

const AIAPI = {
    config: {
        provider: null,
        apiKey: null,
        ollamaUrl: 'http://localhost:11434'
    },

    /**
     * Load configuration from storage
     */
    async loadConfig() {
        const provider = await DB.getSetting('ai_provider');
        const apiKey = await DB.getSetting('ai_api_key');
        const ollamaUrl = await DB.getSetting('ollama_url');

        this.config.provider = provider || null;
        this.config.apiKey = apiKey || null;
        this.config.ollamaUrl = ollamaUrl || 'http://localhost:11434';
    },

    /**
     * Save configuration
     */
    async saveConfig(provider, apiKey, ollamaUrl) {
        this.config.provider = provider;
        this.config.apiKey = apiKey;
        this.config.ollamaUrl = ollamaUrl || 'http://localhost:11434';

        await DB.saveSetting('ai_provider', provider);
        await DB.saveSetting('ai_api_key', apiKey);
        if (ollamaUrl) await DB.saveSetting('ollama_url', ollamaUrl);
    },

    /**
     * Check if AI API is configured
     */
    isConfigured() {
        if (this.config.provider === 'ollama') {
            return !!this.config.ollamaUrl;
        }
        return !!(this.config.provider && this.config.apiKey);
    },

    /**
     * Process image with AI API
     */
    async processInvoice(imageBase64, engine = 'api') {
        if (!this.isConfigured()) {
            throw new Error('AI API no configurada. Ve a Configuración.');
        }

        // Ensure base64 format
        let base64Data = imageBase64;
        if (imageBase64.startsWith('data:')) {
            base64Data = imageBase64.split(',')[1];
        }

        const prompt = `Analiza esta factura y extrae los siguientes datos en formato JSON:
{
    "invoiceNumber": "número de factura",
    "date": "fecha de emisión en formato YYYY-MM-DD",
    "dueDate": "fecha de vencimiento en formato YYYY-MM-DD o null",
    "issuer": {
        "name": "nombre del emisor",
        "nif": "NIF/CIF del emisor",
        "address": "dirección del emisor"
    },
    "receiver": {
        "name": "nombre del receptor",
        "nif": "NIF/CIF del receptor",
        "address": "dirección del receptor"
    },
    "description": "concepto o descripción",
    "baseAmount": 0.00,
    "ivaPercent": 21,
    "ivaAmount": 0.00,
    "irpfPercent": 0,
    "irpfAmount": 0.00,
    "total": 0.00,
    "paymentMethod": "método de pago",
    "iban": "IBAN o null"
}

Responde SOLO con el JSON, sin explicaciones adicionales. Si no encuentras un dato, usa null o 0.`;

        try {
            let response;

            switch (this.config.provider) {
                case 'openai':
                    response = await this.callOpenAI(base64Data, prompt);
                    break;
                case 'gemini':
                    response = await this.callGemini(base64Data, prompt);
                    break;
                case 'huggingface':
                    response = await this.callHuggingFace(base64Data, prompt);
                    break;
                case 'ollama':
                    response = await this.callOllama(base64Data, prompt);
                    break;
                default:
                    throw new Error('Proveedor de IA no soportado');
            }

            return this.parseResponse(response);
        } catch (error) {
            console.error('AI API Error:', error);
            throw error;
        }
    },

    /**
     * Call OpenAI API
     */
    async callOpenAI(base64Image, prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error calling OpenAI API');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    /**
     * Call Google Gemini API
     */
    async callGemini(base64Image, prompt) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error calling Gemini API');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    /**
     * Call HuggingFace API
     */
    async callHuggingFace(base64Image, prompt) {
        // Use a vision model from HuggingFace
        const response = await fetch(
            'https://api-inference.huggingface.co/models/microsoft/Florence-2-large',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: {
                        image: base64Image,
                        task: 'document_parsing'
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error calling HuggingFace API');
        }

        const data = await response.json();
        // HuggingFace returns raw text, we'll need to parse it
        return typeof data === 'string' ? data : JSON.stringify(data);
    },

    /**
     * Call Ollama local API
     */
    async callOllama(base64Image, prompt) {
        const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llava',
                prompt: prompt,
                images: [base64Image],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error('Error calling Ollama. Asegúrate de que está ejecutándose.');
        }

        const data = await response.json();
        return data.response;
    },

    /**
     * Parse AI response to invoice data
     */
    parseResponse(responseText) {
        try {
            // Try to extract JSON from response
            let jsonStr = responseText;
            
            // Check if response contains JSON block
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            // Try to find JSON object
            const objMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objMatch) {
                jsonStr = objMatch[0];
            }

            const data = JSON.parse(jsonStr);

            // Ensure all required fields
            return {
                rawText: responseText,
                invoiceNumber: data.invoiceNumber || null,
                date: data.date ? Helpers.parseDate(data.date) : null,
                dueDate: data.dueDate ? Helpers.parseDate(data.dueDate) : null,
                issuer: {
                    name: data.issuer?.name || null,
                    nif: data.issuer?.nif || null,
                    address: data.issuer?.address || null
                },
                receiver: {
                    name: data.receiver?.name || null,
                    nif: data.receiver?.nif || null,
                    address: data.receiver?.address || null
                },
                description: data.description || null,
                baseAmount: parseFloat(data.baseAmount) || 0,
                ivaPercent: parseFloat(data.ivaPercent) || 21,
                ivaAmount: parseFloat(data.ivaAmount) || 0,
                irpfPercent: parseFloat(data.irpfPercent) || 0,
                irpfAmount: parseFloat(data.irpfAmount) || 0,
                total: parseFloat(data.total) || 0,
                paymentMethod: data.paymentMethod || null,
                iban: data.iban || null,
                confidence: 0.95
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            // Return basic structure with raw text
            return {
                rawText: responseText,
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
                paymentMethod: null,
                iban: null,
                confidence: 0.5
            };
        }
    },

    /**
     * Get provider info for display
     */
    getProviderInfo() {
        const providers = {
            openai: { name: 'OpenAI', model: 'GPT-4o Mini', cost: '~$0.001/factura' },
            gemini: { name: 'Google Gemini', model: 'Gemini 1.5 Flash', cost: '~$0.0005/factura' },
            huggingface: { name: 'HuggingFace', model: 'Florence-2', cost: 'Gratis (rate-limited)' },
            ollama: { name: 'Ollama (Local)', model: 'LLaVA', cost: 'Gratis' }
        };

        return this.config.provider ? providers[this.config.provider] : null;
    },

    /**
     * Test API connection
     */
    async testConnection() {
        if (!this.isConfigured()) {
            return { success: false, message: 'No configurado' };
        }

        try {
            // Create a small test image
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 50);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText('Test', 10, 35);
            
            const testImage = canvas.toDataURL('image/jpeg').split(',')[1];
            
            await this.processInvoice(testImage);
            return { success: true, message: 'Conexión exitosa' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Make globally available
window.AIAPI = AIAPI;
