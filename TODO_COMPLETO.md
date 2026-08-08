# BillSnap - TODO Completo para Lanzamiento

> **Objetivo**: App 100% funcional para producción

---

## 📋 LO QUE NECESITO DE TI PARA FUNCIONAR

### Datos que necesito que me des:

| Dato | Para qué | Cuándo lo necesito |
|------|----------|-------------------|
| **Logo final** (PNG/SVG) | Favicon, app, landing | Ya lo tienes |
| **Nombre de dominio** | billsnap.app o el que elijas | Antes de deploy |
| **Cuenta Stripe** | Para cobrar | Antes de activar pagos |
| **Stripe API Keys** | Test + Producción | Antes de activar pagos |
| **Cuenta Vercel** | Hosting cloud | Antes de deploy |
| **Cuenta Supabase** | Base de datos cloud | Antes de deploy |
| **Google Cloud API Key** | Para Google Sheets | Opcional |
| **Email de soporte** | Para contacto | Antes de lanzar |

---

## 🏗️ ARQUITECTURA COMPLETA

```
┌─────────────────────────────────────────────────────────────┐
│                        BillSnap                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FRONTEND (HTML/CSS/JS)                               │  │
│  │  - Landing page                                       │  │
│  │  - App principal                                      │  │
│  │  - PWA (instalable)                                   │  │
│  │  - i18n (ES/EN)                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BACKEND (Supabase + Vercel Functions)                │  │
│  │  - Auth (login/registro)                              │  │
│  │  - Database (PostgreSQL)                              │  │
│  │  - Storage (facturas, logos)                          │  │
│  │  - Edge Functions (IA, Verifactu)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  IA / OCR                                             │  │
│  │  - Tesseract.js (local, gratis)                       │  │
│  │  - WebLLM (navegador, gratis)                         │  │
│  │  - Transformers.js (navegador, gratis)                │  │
│  │  - IA Nativa servidor (Gemini Flash, ~0.0005€/fact)   │  │
│  │  - APIs externas (OpenAI, Gemini, HF)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FACTURACIÓN                                          │  │
│  │  - Emitir facturas con logo                           │  │
│  │  - Verifactu (QR, hash, XML)                          │  │
│  │  - Generación PDF                                     │  │
│  │  - Envío email                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PAGOS (Stripe)                                       │  │
│  │  - Suscripciones cloud                                │  │
│  │  - Compra local (395€/895€)                           │  │
│  │  - Packs de facturas                                  │  │
│  │  - Webhooks                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 ESTRUCTURA DE ARCHIVOS FINAL

```
billsnap/
├── index.html                  ← App principal
├── landing.html                ← Landing page
├── favicon.png                 ← Logo/favicon
├── manifest.json               ← PWA
├── sw.js                       ← Service Worker
│
├── src/
│   ├── css/
│   │   └── styles.css          ← Estilos principales
│   │
│   ├── js/
│   │   ├── app.js              ← Controlador principal
│   │   ├── config.js           ← Configuración
│   │   │
│   │   ├── i18n/
│   │   │   ├── es.js           ← Español
│   │   │   ├── en.js           ← Inglés
│   │   │   └── i18n.js         ← Sistema i18n
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.js         ← Login/registro
│   │   │   └── roles.js        ← Gestión roles
│   │   │
│   │   ├── ocr/
│   │   │   ├── tesseract.js    ← OCR local
│   │   │   ├── webllm.js       ← WebLLM
│   │   │   ├── transformers.js ← Transformers.js
│   │   │   └── api.js          ← APIs externas
│   │   │
│   │   ├── ai/
│   │   │   ├── native.js       ← IA nativa servidor
│   │   │   └── local.js        ← IA local (Ollama)
│   │   │
│   │   ├── invoice/
│   │   │   ├── create.js       ← Crear factura
│   │   │   ├── edit.js         ← Editar factura
│   │   │   ├── process.js      ← Procesar factura recibida
│   │   │   └── emit.js         ← Emitir factura propia
│   │   │
│   │   ├── verifactu/
│   │   │   ├── hash.js         ← Hash SHA-256
│   │   │   ├── qr.js           ← Generar QR
│   │   │   ├── xml.js          ← Generar XML
│   │   │   └── submit.js       ← Enviar a AEAT
│   │   │
│   │   ├── accounting/
│   │   │   ├── classify.js     ← Clasificar gasto/ingreso
│   │   │   ├── categorize.js   ← Categorizar
│   │   │   ├── calculate.js    ← Calcular IVA, IRPF
│   │   │   └── summary.js      ← Resúmenes contables
│   │   │
│   │   ├── reports/
│   │   │   ├── pdf.js          ← Generar PDFs
│   │   │   ├── monthly.js      ← Informe mensual
│   │   │   ├── quarterly.js    ← Informe trimestral
│   │   │   └── annual.js       ← Informe anual
│   │   │
│   │   ├── storage/
│   │   │   ├── indexeddb.js    ← Almacenamiento local
│   │   │   ├── supabase.js     ← Almacenamiento cloud
│   │   │   └── sheets.js       ← Google Sheets
│   │   │
│   │   ├── billing/
│   │   │   ├── plans.js        ← Planes y precios
│   │   │   ├── stripe.js       ← Integración Stripe
│   │   │   └── credits.js      ← Sistema de créditos
│   │   │
│   │   ├── company/
│   │   │   └── companies.js    ← Multi-empresa
│   │   │
│   │   └── email/
│   │       └── email.js        ← Envío emails
│   │
│   └── assets/
│       ├── logo.png
│       └── icons/
│
├── supabase/
│   ├── schema.sql              ← Base de datos
│   ├── functions/              ← Edge Functions
│   │   ├── process-invoice/
│   │   ├── generate-pdf/
│   │   ├── verifactu-submit/
│   │   └── stripe-webhook/
│   └── seed.sql                ← Datos iniciales
│
├── tauri/                      ← App desktop
│   ├── src-tauri/
│   └── tauri.conf.json
│
└── docs/
    ├── API.md
    ├── DEPLOY.md
    └── USER_GUIDE.md
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Core (Semana 1)
- [ ] Refactorizar app.js modular
- [ ] Sistema de autenticación completo
- [ ] Base de datos Supabase
- [ ] Upload y procesamiento facturas
- [ ] Tabla de facturas con CRUD
- [ ] Clasificación gasto/ingreso
- [ ] Dashboard con gráficos
- [ ] Exportar CSV/JSON

### FASE 2: IA (Semana 2)
- [ ] Tesseract.js (ya hecho)
- [ ] WebLLM integration
- [ ] Transformers.js integration
- [ ] IA nativa servidor (Gemini Flash)
- [ ] Detección automática de hardware
- [ ] Selector de motor IA

### FASE 3: Facturación (Semana 3)
- [ ] Crear factura propia
- [ ] Editar factura
- [ ] Añadir logo empresa
- [ ] Generar PDF factura
- [ ] Enviar por email
- [ ] Verifactu - Hash SHA-256
- [ ] Verifactu - QR obligatorio
- [ ] Verifactu - XML export

### FASE 4: Pagos (Semana 4)
- [ ] Integrar Stripe
- [ ] Planes de suscripción
- [ ] Compra única local
- [ ] Packs de facturas
- [ ] Webhooks Stripe
- [ ] Portal cliente

### FASE 5: Deploy (Semana 5)
- [ ] Deploy Vercel
- [ ] Configurar dominio
- [ ] Supabase producción
- [ ] SSL/HTTPS
- [ ] PWA manifest
- [ ] Service Worker

### FASE 6: Desktop (Semana 6-7)
- [ ] Tauri setup
- [ ] Detección hardware
- [ ] Bundle Ollama
- [ ] Sistema licencias
- [ ] Build Windows/Mac/Linux

---

## 💰 PRECIOS IMPLEMENTADOS

### LOCAL
| Plan | Precio | Incluye |
|------|--------|---------|
| **BillSnap Local** | 395€ | App + 500 facturas IA + packs |
| **BillSnap Pro** | 895€ | App + API libre + IA local + instalación |

**Packs de facturas:**
- 500 facturas = 1€
- 1,000 facturas = 2€
- 5,000 facturas = 10€
- 10,000 facturas = 20€

**Mantenimiento:** 99€/año (desde año 2)

### CLOUD
| Plan | Mensual | Facturas | Usuarios | Empresas |
|------|---------|----------|----------|----------|
| Free | 0€ | 20 | 1 | 1 |
| Starter | 9€ | 100 | 1 | 1 |
| Basic | 15€ | 300 | 1 | 1 |
| Pro | 20€ | 500 | 1 | 1 |
| +Extra | +15€ | +500 | - | - |
| Business | 49€ | 5,000 | 10 | 5 |
| Enterprise | 79€ | 10,000 | ∞ | ∞ |

---

## 🎯 SIGUIENTE PASO

Dime:
1. **¿Empezamos por la Fase 1 (Core)?**
2. **¿Tienes ya cuenta de Supabase?** (gratis)
3. **¿Tienes ya cuenta de Stripe?** (gratis para test)
4. **¿Qué dominio quieres?** (billsnap.app, billsnap.io, etc.)
