/**
 * BillSnap - Configuration
 * Central configuration for all services
 */

const CONFIG = {
    // App info
    app: {
        name: 'BillSnap',
        version: '1.0.0',
        description: 'Smart invoice management with automatic processing',
        url: 'https://billsnap.app',
        supportEmail: 'support@billsnap.app'
    },

    // Supabase (will be filled with real credentials)
    supabase: {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    },

    // Stripe (will be filled with real credentials)
    stripe: {
        publicKey: 'YOUR_STRIPE_PUBLIC_KEY',
        prices: {
            starter: 'price_starter_monthly',
            basic: 'price_basic_monthly',
            pro: 'price_pro_monthly',
            business: 'price_business_monthly',
            enterprise: 'price_enterprise_monthly',
            local_basic: 'price_local_basic',
            local_pro: 'price_local_pro',
            credits_500: 'price_credits_500',
            credits_1000: 'price_credits_1000',
            credits_5000: 'price_credits_5000',
            credits_10000: 'price_credits_10000'
        }
    },

    // AI Providers
    ai: {
        // Native AI (our server)
        native: {
            enabled: true,
            endpoint: '/api/process-invoice',
            costPerInvoice: 0.0005 // Gemini Flash
        },
        // External APIs
        providers: {
            openai: {
                name: 'OpenAI',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                models: ['gpt-4o-mini', 'gpt-4o'],
                costPerInvoice: 0.001
            },
            gemini: {
                name: 'Google Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                costPerInvoice: 0.0005
            },
            huggingface: {
                name: 'HuggingFace',
                endpoint: 'https://api-inference.huggingface.co/models/',
                models: ['Qwen/Qwen2.5-VL-7B-Instruct'],
                costPerInvoice: 0
            }
        },
        // Local Ollama
        ollama: {
            defaultUrl: 'http://localhost:11434',
            models: [
                { id: 'qwen2.5vl:7b', name: 'Qwen2.5-VL 7B', vram: '6GB', accuracy: 0.95 },
                { id: 'llama3.2-vision:11b', name: 'Llama 3.2 Vision 11B', vram: '8GB', accuracy: 0.96 },
                { id: 'minicpm-v:latest', name: 'MiniCPM-V', vram: '4GB', accuracy: 0.90 },
                { id: 'moondream:latest', name: 'Moondream', vram: '2GB', accuracy: 0.80 },
                { id: 'gemma3:4b', name: 'Gemma 3 4B', vram: '4GB', accuracy: 0.88 }
            ]
        }
    },

    // Pricing
    pricing: {
        local: {
            basic: { price: 395, invoices: 500, description: 'App + 500 facturas IA' },
            pro: { price: 895, invoices: -1, description: 'App + API libre + IA local' }
        },
        credits: {
            500: { price: 1, invoices: 500 },
            1000: { price: 2, invoices: 1000 },
            5000: { price: 10, invoices: 5000 },
            10000: { price: 20, invoices: 10000 }
        },
        cloud: {
            free: { price: 0, invoices: 20, users: 1, companies: 1, ai: 'tesseract' },
            starter: { price: 9, invoices: 100, users: 1, companies: 1, ai: 'native' },
            basic: { price: 15, invoices: 300, users: 1, companies: 1, ai: 'native' },
            pro: { price: 20, invoices: 500, users: 1, companies: 1, ai: 'native' },
            pro_extra: { price: 15, invoices: 500, users: 0, companies: 0, ai: 'native' },
            business: { price: 49, invoices: 5000, users: 10, companies: 5, ai: 'native' },
            enterprise: { price: 79, invoices: 10000, users: -1, companies: -1, ai: 'all' }
        },
        maintenance: {
            yearly: 99
        }
    },

    // Verifactu
    verifactu: {
        enabled: true,
        endpoint: 'https://www2.agenciatributaria.es/wlpl/TIKE-CONT/ValidarQR',
        endpointTest: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',
        hashAlgorithm: 'SHA-256',
        qrSize: 30 // mm
    },

    // Email
    email: {
        methods: ['mailto', 'smtp', 'sendgrid'],
        defaultMethod: 'mailto'
    },

    // Storage
    storage: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'text/csv'],
        maxFilesPerBatch: 30
    },

    // Languages
    languages: [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇬🇧' }
    ],

    // Categories
    defaultCategories: {
        expense: [
            { id: 'luz', name: 'Luz', nameEn: 'Electricity', icon: '⚡' },
            { id: 'telefono', name: 'Teléfono/Internet', nameEn: 'Phone/Internet', icon: '📱' },
            { id: 'alquiler', name: 'Alquiler', nameEn: 'Rent', icon: '🏢' },
            { id: 'material', name: 'Material', nameEn: 'Materials', icon: '📦' },
            { id: 'servicios', name: 'Servicios', nameEn: 'Services', icon: '👔' },
            { id: 'transporte', name: 'Transporte', nameEn: 'Transport', icon: '🚗' },
            { id: 'seguros', name: 'Seguros', nameEn: 'Insurance', icon: '🛡️' },
            { id: 'software', name: 'Software', nameEn: 'Software', icon: '💻' },
            { id: 'hosting', name: 'Hosting', nameEn: 'Hosting', icon: '🌐' },
            { id: 'marketing', name: 'Marketing', nameEn: 'Marketing', icon: '📢' },
            { id: 'formacion', name: 'Formación', nameEn: 'Training', icon: '📚' },
            { id: 'comidas', name: 'Comidas', nameEn: 'Meals', icon: '🍽️' },
            { id: 'otros_gasto', name: 'Otros gastos', nameEn: 'Other expenses', icon: '📋' }
        ],
        income: [
            { id: 'ventas', name: 'Ventas', nameEn: 'Sales', icon: '💰' },
            { id: 'servicios_cobro', name: 'Servicios prestados', nameEn: 'Services provided', icon: '🔧' },
            { id: 'consultoria', name: 'Consultoría', nameEn: 'Consulting', icon: '💡' },
            { id: 'comisiones', name: 'Comisiones', nameEn: 'Commissions', icon: '📈' },
            { id: 'alquileres', name: 'Alquileres', nameEn: 'Rent collected', icon: '🏠' },
            { id: 'otros_ingreso', name: 'Otros ingresos', nameEn: 'Other income', icon: '📋' }
        ]
    }
};

// Make globally available
window.CONFIG = CONFIG;
