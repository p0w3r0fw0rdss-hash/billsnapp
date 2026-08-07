/**
 * BillSnap - Vision AI Engine
 * Uses Vision-Language Models that REASON about documents
 * No training needed - just send the image and get structured data
 */

const VisionAI = {
    provider: null,
    isReady: false,
    isProcessing: false,

    /**
     * Available VLM providers
     */
    providers: {
        ollama: {
            id: 'ollama',
            name: 'Ollama (Local)',
            description: 'Runs 100% local on your machine. Private, free, no internet.',
            descriptionEs: 'Ejecuta 100% local en tu máquina. Privado, gratis, sin internet.',
            requires: 'Ollama installed + vision model',
            requiresEs: 'Ollama instalado + modelo de visión',
            models: [
                {
                    id: 'qwen2.5vl:7b',
                    name: 'Qwen2.5-VL 7B',
                    description: 'Best for invoices & documents. Structured JSON output.',
                    descriptionEs: 'El mejor para facturas y documentos. Salida JSON estructurada.',
                    vram: '~6GB',
                    quality: '⭐⭐⭐⭐⭐',
                    speed: 'Medium (5-15s)',
                    recommended: true
                },
                {
                    id: 'llama3.2-vision:11b',
                    name: 'Llama 3.2 Vision 11B',
                    description: 'Best overall quality. Great reasoning.',
                    descriptionEs: 'La mejor calidad general. Excelente razonamiento.',
                    vram: '~8GB',
                    quality: '⭐⭐⭐⭐⭐',
                    speed: 'Slow (10-25s)'
                },
                {
                    id: 'minicpm-v:latest',
                    name: 'MiniCPM-V',
                    description: 'Compact, efficient, good for docs.',
                    descriptionEs: 'Compacto, eficiente, bueno para documentos.',
                    vram: '~4GB',
                    quality: '⭐⭐⭐⭐',
                    speed: 'Fast (3-10s)'
                },
                {
                    id: 'moondream:latest',
                    name: 'Moondream',
                    description: 'Ultra-light. Works on weak machines.',
                    descriptionEs: 'Ultra-ligero. Funciona en máquinas débiles.',
                    vram: '~2GB',
                    quality: '⭐⭐⭐',
                    speed: 'Very fast (2-5s)'
                },
                {
                    id: 'gemma3:4b',
                    name: 'Gemma 3 4B',
                    description: 'Google model. Multimodal. Good balance.',
                    descriptionEs: 'Modelo de Google. Multimodal. Buen equilibrio.',
                    vram: '~4GB',
                    quality: '⭐⭐⭐⭐',
                    speed: 'Fast (3-8s)'
                }
            ],
            setupUrl: 'https://ollama.com',
            setupSteps: {
                es: [
                    'Descarga Ollama de ollama.com',
                    'Instala y ejecuta',
                    'Abre terminal y ejecuta: ollama pull qwen2.5vl:7b',
                    '¡Listo! BillSnap se conecta automáticamente'
                ],
                en: [
                    'Download Ollama from ollama.com',
                    'Install and run',
                    'Open terminal and run: ollama pull qwen2.5vl:7b',
                    'Done! BillSnap connects automatically'
                ]
            }
        },
        openai: {
            id: 'openai',
            name: 'OpenAI',
            description: 'GPT-4o Vision. Best quality. Costs ~$0.003/image.',
            descriptionEs: 'GPT-4o Vision. La mejor calidad. Cuesta ~$0.003/imagen.',
            requires: 'API Key',
            models: [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', quality: '⭐⭐⭐⭐⭐', speed: 'Fast (2-5s)', cost: '~$0.001' },
                { id: 'gpt-4o', name: 'GPT-4o', quality: '⭐⭐⭐⭐⭐', speed: 'Medium (3-8s)', cost: '~$0.003' }
            ]
        },
        gemini: {
            id: 'gemini',
            name: 'Google Gemini',
            description: 'Free tier: 15 req/min. Great for docs.',
            descriptionEs: 'Gratis: 15 req/min. Excelente para documentos.',
            requires: 'API Key (free)',
            models: [
                { id: 'gemini-1.5-flash', name: 'Gemini Flash', quality: '⭐⭐⭐⭐⭐', speed: 'Fast (2-4s)', cost: 'Free (limited)' },
                { id: 'gemini-1.5-pro', name: 'Gemini Pro', quality: '⭐⭐⭐⭐⭐', speed: 'Medium (3-8s)', cost: '~$0.002' }
            ]
        },
        huggingface: {
            id: 'huggingface',
            name: 'HuggingFace',
            description: 'Free inference API. Rate limited.',
            descriptionEs: 'API de inferencia gratis. Limitado por tasa.',
            requires: 'API Key (free)',
            models: [
                { id: 'Qwen/Qwen2.5-VL-7B-Instruct', name: 'Qwen2.5-VL 7B', quality: '⭐⭐⭐⭐', speed: 'Medium (5-15s)', cost: 'Free' }
            ]
        }
    },

    /**
     * System prompt for invoice extraction
     */
    getSystemPrompt(lang = 'es') {
        if (lang === 'en') {
            return `You are an expert invoice data extractor. Analyze the provided invoice image and extract ALL information into a valid JSON object.

RULES:
1. Return ONLY valid JSON, no explanations
2. Use null for missing fields
3. Parse dates as YYYY-MM-DD format
4. Parse numbers without currency symbols
5. Detect the language of the invoice automatically
6. Be precise with numbers - don't estimate

OUTPUT FORMAT:
{
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD or null",
  "issuer": {
    "name": "string",
    "tax_id": "string (NIF/CIF/VAT)",
    "address": "string",
    "email": "string or null",
    "phone": "string or null"
  },
  "receiver": {
    "name": "string",
    "tax_id": "string",
    "address": "string or null"
  },
  "description": "string - brief summary of what's being invoiced",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "amount": number
    }
  ],
  "subtotal": number,
  "tax_rate": number (percentage),
  "tax_amount": number,
  "withholding_rate": number (percentage, 0 if none),
  "withholding_amount": number,
  "total": number,
  "currency": "EUR/USD/GBP",
  "payment_method": "string or null",
  "iban": "string or null",
  "notes": "string or null"
}`;
        }

        return `Eres un experto extractor de datos de facturas. Analiza la imagen de la factura proporcionada y extrae TODA la información en un objeto JSON válido.

REGLAS:
1. Devuelve SOLO JSON válido, sin explicaciones
2. Usa null para campos faltantes
3. Las fechas en formato YYYY-MM-DD
4. Los números sin símbolos de moneda
5. Detecta el idioma de la factura automáticamente
6. Sé preciso con los números - no estimes

FORMATO DE SALIDA:
{
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD o null",
  "issuer": {
    "name": "string",
    "tax_id": "string (NIF/CIF)",
    "address": "string",
    "email": "string o null",
    "phone": "string o null"
  },
  "receiver": {
    "name": "string",
    "tax_id": "string",
    "address": "string o null"
  },
  "description": "string - breve resumen de lo facturado",
  "line_items": [
    {
      "description": "string",
      "quantity": número,
      "unit_price": número,
      "amount": número
    }
  ],
  "subtotal": número,
  "tax_rate": número (porcentaje),
  "tax_amount": número,
  "withholding_rate": número (porcentaje, 0 si no hay),
  "withholding_amount": número,
  "total": número,
  "currency": "EUR/USD/GBP",
  "payment_method": "string o null",
  "iban": "string o null",
  "notes": "string o null"
}`;
    },

    /**
     * Initialize Vision AI
     */
    async init() {
        // Try to connect to Ollama first (local, free)
        const ollamaOk = await this.testOllama();
        if (ollamaOk) {
            this.provider = 'ollama';
            this.isReady = true;
            console.log('Vision AI: Connected to Ollama');
            return true;
        }

        // Check for API keys
        const savedProvider = await DB.getSetting('ai_provider');
        const savedKey = await DB.getSetting('ai_api_key');

        if (savedProvider && savedKey) {
            this.provider = savedProvider;
            this.isReady = true;
            console.log(`Vision AI: Using ${savedProvider}`);
            return true;
        }

        console.log('Vision AI: No provider available');
        this.isReady = false;
        return false;
    },

    /**
     * Test Ollama connection
     */
    async testOllama() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
                const data = await response.json();
                // Check if any vision model is available
                const visionModels = data.models?.filter(m => 
                    m.name.includes('vl') || 
                    m.name.includes('vision') || 
                    m.name.includes('llava') || 
                    m.name.includes('moondream') ||
                    m.name.includes('minicpm') ||
                    m.name.includes('gemma3')
                );
                
                return visionModels?.length > 0;
            }
            return false;
        } catch {
            return false;
        }
    },

    /**
     * Get available Ollama models
     */
    async getOllamaModels() {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            const data = await response.json();
            return data.models || [];
        } catch {
            return [];
        }
    },

    /**
     * Process invoice with Vision AI
     */
    async processInvoice(imageBase64) {
        if (!this.isReady) {
            await this.init();
        }

        this.isProcessing = true;
        const lang = i18n?.getLang() || 'es';

        try {
            // Ensure base64 format
            let base64 = imageBase64;
            if (imageBase64.startsWith('data:')) {
                base64 = imageBase64.split(',')[1];
            }

            let result;

            switch (this.provider) {
                case 'ollama':
                    result = await this.processWithOllama(base64, lang);
                    break;
                case 'openai':
                    result = await this.processWithOpenAI(base64, lang);
                    break;
                case 'gemini':
                    result = await this.processWithGemini(base64, lang);
                    break;
                case 'huggingface':
                    result = await this.processWithHuggingFace(base64, lang);
                    break;
                default:
                    throw new Error('No AI provider configured');
            }

            // Parse and validate the result
            const parsed = this.parseResult(result);

            return {
                ...parsed,
                rawResponse: result,
                confidence: 0.95,
                engine: `Vision AI (${this.getProviderName()})`
            };

        } catch (error) {
            console.error('Vision AI error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    },

    /**
     * Process with Ollama (local)
     */
    async processWithOllama(base64, lang) {
        const selectedModel = await DB.getSetting('ollama_vision_model') || 'qwen2.5vl:7b';

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt(lang)
                    },
                    {
                        role: 'user',
                        content: lang === 'es' ? 
                            'Extrae todos los datos de esta factura como JSON:' :
                            'Extract all invoice data as JSON:',
                        images: [base64]
                    }
                ],
                stream: false,
                format: 'json'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama error: ${error}`);
        }

        const data = await response.json();
        return data.message?.content || '';
    },

    /**
     * Process with OpenAI
     */
    async processWithOpenAI(base64, lang) {
        const apiKey = await DB.getSetting('ai_api_key');
        const model = await DB.getSetting('openai_model') || 'gpt-4o-mini';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt(lang)
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: lang === 'es' ? 
                                    'Extrae todos los datos de esta factura como JSON:' :
                                    'Extract all invoice data as JSON:'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    },

    /**
     * Process with Google Gemini
     */
    async processWithGemini(base64, lang) {
        const apiKey = await DB.getSetting('ai_api_key');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: this.getSystemPrompt(lang) + '\n\n' + (lang === 'es' ? 'Extrae los datos de esta factura:' : 'Extract invoice data:') },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        responseMimeType: 'application/json'
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || '';
    },

    /**
     * Process with HuggingFace
     */
    async processWithHuggingFace(base64, lang) {
        const apiKey = await DB.getSetting('ai_api_key');

        const response = await fetch(
            'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: {
                        image: base64
                    },
                    parameters: {
                        prompt: this.getSystemPrompt(lang)
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error('HuggingFace API error');
        }

        const data = await response.json();
        return typeof data === 'string' ? data : JSON.stringify(data);
    },

    /**
     * Parse AI response to structured data
     */
    parseResult(responseText) {
        try {
            let jsonStr = responseText;

            // Try to extract JSON from response
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1];

            const objMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objMatch) jsonStr = objMatch[0];

            const data = JSON.parse(jsonStr);

            // Map to our internal format
            return {
                invoiceNumber: data.invoice_number || null,
                date: data.date || null,
                dueDate: data.due_date || null,
                issuer: {
                    name: data.issuer?.name || null,
                    nif: data.issuer?.tax_id || null,
                    address: data.issuer?.address || null,
                    email: data.issuer?.email || null,
                    phone: data.issuer?.phone || null
                },
                receiver: {
                    name: data.receiver?.name || null,
                    nif: data.receiver?.tax_id || null,
                    address: data.receiver?.address || null
                },
                description: data.description || null,
                items: data.line_items || [],
                baseAmount: parseFloat(data.subtotal) || 0,
                subtotal: parseFloat(data.subtotal) || 0,
                ivaPercent: parseFloat(data.tax_rate) || 21,
                ivaAmount: parseFloat(data.tax_amount) || 0,
                irpfPercent: parseFloat(data.withholding_rate) || 0,
                irpfAmount: parseFloat(data.withholding_amount) || 0,
                total: parseFloat(data.total) || 0,
                currency: data.currency || 'EUR',
                paymentMethod: data.payment_method || null,
                iban: data.iban || null,
                notes: data.notes || null
            };
        } catch (error) {
            console.error('Parse error:', error);
            // Return basic structure
            return {
                invoiceNumber: null,
                date: null,
                dueDate: null,
                issuer: { name: null, nif: null, address: null },
                receiver: { name: null, nif: null, address: null },
                description: null,
                items: [],
                baseAmount: 0,
                ivaPercent: 21,
                ivaAmount: 0,
                total: 0,
                currency: 'EUR'
            };
        }
    },

    /**
     * Get provider display name
     */
    getProviderName() {
        const names = {
            ollama: 'Ollama (Local)',
            openai: 'OpenAI GPT-4o',
            gemini: 'Google Gemini',
            huggingface: 'HuggingFace'
        };
        return names[this.provider] || 'Unknown';
    },

    /**
     * Check if ready
     */
    isAvailable() {
        return this.isReady;
    },

    /**
     * Get setup instructions
     */
    getSetupInstructions(lang = 'es') {
        const isEs = lang === 'es';
        
        return {
            ollama: {
                title: isEs ? 'Ollama (Recomendado)' : 'Ollama (Recommended)',
                subtitle: isEs ? '100% local, gratis, privado' : '100% local, free, private',
                steps: isEs ? [
                    '1. Descarga Ollama de ollama.com',
                    '2. Instala y se ejecutará automáticamente',
                    '3. Abre terminal/CMD y ejecuta:',
                    '   ollama pull qwen2.5vl:7b',
                    '4. ¡Listo! BillSnap lo detecta automáticamente'
                ] : [
                    '1. Download Ollama from ollama.com',
                    '2. Install and it will run automatically',
                    '3. Open terminal/CMD and run:',
                    '   ollama pull qwen2.5vl:7b',
                    '4. Done! BillSnap detects it automatically'
                ],
                command: 'ollama pull qwen2.5vl:7b'
            },
            openai: {
                title: 'OpenAI',
                subtitle: isEs ? 'La mejor calidad, cuesta ~$0.001/factura' : 'Best quality, costs ~$0.001/invoice',
                steps: isEs ? [
                    '1. Ve a platform.openai.com',
                    '2. Crea una cuenta y obtén tu API key',
                    '3. Entra en BillSnap > Configuración > IA',
                    '4. Selecciona OpenAI y pega tu key'
                ] : [
                    '1. Go to platform.openai.com',
                    '2. Create account and get your API key',
                    '3. Go to BillSnap > Settings > AI',
                    '4. Select OpenAI and paste your key'
                ]
            },
            gemini: {
                title: 'Google Gemini',
                subtitle: isEs ? 'Gratis (15 req/min)' : 'Free (15 req/min)',
                steps: isEs ? [
                    '1. Ve a aistudio.google.com',
                    '2. Crea una cuenta (gratis)',
                    '3. Obtén tu API key',
                    '4. En BillSnap > Configuración > IA, selecciona Gemini'
                ] : [
                    '1. Go to aistudio.google.com',
                    '2. Create account (free)',
                    '3. Get your API key',
                    '4. In BillSnap > Settings > AI, select Gemini'
                ]
            }
        };
    },

    /**
     * Get model recommendations based on device
     */
    getRecommendedModel() {
        const memory = navigator.deviceMemory || 4;
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

        if (isMobile || memory < 6) {
            return {
                model: 'moondream:latest',
                reason: 'Dispositivo con pocos recursos'
            };
        } else if (memory < 10) {
            return {
                model: 'minicpm-v:latest',
                reason: 'Buen equilibrio velocidad/calidad'
            };
        } else {
            return {
                model: 'qwen2.5vl:7b',
                reason: 'La mejor calidad para facturas'
            };
        }
    }
};

// Make globally available
window.VisionAI = VisionAI;
