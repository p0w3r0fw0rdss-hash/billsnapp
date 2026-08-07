# BillSnap - Roadmap Completo para Producción

> **Última actualización**: Análisis completo de lo que falta, precios, anti-abuso, y plan técnico

---

## 📊 ESTADO ACTUAL

### ✅ LO QUE YA FUNCIONA (70%)

| Componente | Estado | Detalle |
|-----------|--------|---------|
| **UI/UX** | ✅ | Diseño Apple, responsive, dark/light mode |
| **Multi-idioma** | ✅ | Español + Inglés completos |
| **Login/Auth** | ✅ | Usuarios, roles (Admin/Contable/Viewer) |
| **Base de datos** | ✅ | IndexedDB local, CRUD completo |
| **OCR Tesseract** | ✅ | Local, gratis, español/inglés |
| **Extracción de datos** | ✅ | Fecha, emisor, NIF, importes, IVA |
| **Clasificación** | ✅ | Gasto vs Ingreso automático |
| **Categorización** | ✅ | 13 categorías de gasto, 6 de ingreso |
| **Contabilidad** | ✅ | Ingresos, gastos, IVA, beneficio |
| **Dashboard** | ✅ | Stats + gráficos Chart.js |
| **PDFs** | ✅ | 6 tipos de informes |
| **Exportar** | ✅ | CSV, JSON backup/import |
| **Multi-empresa** | ✅ | Varias empresas por cuenta |
| **Email** | ✅ | Mailto (preparado SMTP/SendGrid) |
| **Billing** | ✅ | 5 planes, límites, usage tracking |
| **Landing page** | ✅ | Profesional, responsive, i18n |

### ⚠️ LO QUE FALTA (30%)

| Componente | Prioridad | Dificultad | Tiempo |
|-----------|----------|-----------|--------|
| **Stripe real** | 🔴 Crítica | Media | 2-3 días |
| **Deploy Vercel** | 🔴 Crítica | Fácil | 1 día |
| **Dominio** | 🔴 Crítica | Fácil | 1 día |
| **IA nativa servidor** | 🟡 Alta | Alta | 3-5 días |
| **Google Sheets OAuth** | 🟡 Alta | Media | 2 días |
| **Envío email real** | 🟡 Alta | Fácil | 1 día |
| **App desktop (Tauri)** | 🟢 Media | Alta | 5-7 días |
| **Detección hardware** | 🟢 Media | Media | 2 días |
| **Anti-piracy** | 🟢 Media | Media | 3 días |
| **Tests** | 🟢 Media | Media | 3 días |
| **Documentación** | 🟢 Baja | Fácil | 2 días |

---

## 💰 ESTRATEGIA DE PRECIOS

### Análisis de mercado (España + Internacional)

| Competidor | Precio | Mercado | Facturas/mes |
|-----------|--------|---------|-------------|
| **renn** | Gratis / 15€/mes | España | 25 / ∞ |
| **Cuentica** | 9.90€/mes | España | ∞ |
| **Quipu** | 12-60€/mes | España | ∞ |
| **Holded** | 7.50-100€/mes | España | ∞ |
| **FreshBooks** | $23-70/mes | USA/UK | 5-∞ |
| **Wave** | Gratis / $16/mes | USA/Canadá | ∞ |
| **Zoho Invoice** | Gratis / $15/mes | Global | 5-∞ |
| **Invoice Ninja** | Gratis / $14/mes | Global | ∞ |

### Nuestro posicionamiento

> **BillSnap = Facturación + OCR automático + Contabilidad**
> 
> Ningún competidor combina estas 3 cosas a precio accesible.

---

## 📦 VERSIÓN LOCAL (App Desktop)

### Precio propuesto

| Plan | Precio | Facturas | Usuarios | Empresas | Actualizaciones |
|------|--------|----------|----------|----------|-----------------|
| **Starter** | **99€** | Ilimitadas | 1 | 1 | v1.x gratis |
| **Pro** | **179€** | Ilimitadas | 1 | 3 | v1.x + v2.x |
| **Business** | **249€** | Ilimitadas | 3 | 10 | Todas + prioridad |

### ¿Por qué estos precios?

| Análisis | Detalle |
|----------|---------|
| **99€** | Precio psicológico bajo. Cualquier autónomo puede pagarlo. Menos de 1 mes de gestoría. |
| **179€** | Precio medio. Incluye más empresas + actualizaciones. |
| **249€** | Precio premium. Multi-usuario + soporte prioritario. |
| **vs competencia** | 99€ = 6-10 meses de Cuentica/Quipu. Se "amortiza" rápido. |

### Anti-piracy para versión local

| Estrategia | Cómo funciona |
|-----------|---------------|
| **Licencia por hardware** | UUID del PC + MAC address |
| **Activación online** | Una vez al instalar (después offline) |
| **Límite reactivaciones** | 2 gratis, luego contactar soporte |
| **Verificación periódica** | Cada 30 días (si hay internet) |
| **Ofuscación código** | Tauri/Electron incluye protección básica |
| **Precio accesible** | 99€ es "demasiado barato para piratear" para empresas |

### Actualizaciones de pago

| Versión | Precio | Qué incluye |
|---------|--------|-------------|
| **v1.x** | Gratis | Correcciones, mejoras menores |
| **v2.0** | 40% del precio (40-100€) | Nuevas funciones mayores |
| **v3.0** | 40% del precio | Nuevas funciones mayores |

---

## ☁️ VERSIÓN CLOUD (Suscripción)

### Precio propuesto

| Plan | Mensual | Trimestral | Anual | Facturas/mes | Usuarios | IA |
|------|---------|------------|-------|-------------|----------|-----|
| **Free** | 0€ | 0€ | 0€ | 25 | 1 | Tesseract |
| **Starter** | **9€** | 25€ (8.33€/mes) | 79€ (6.58€/mes) | 200 | 1 | + WebLLM |
| **Pro** | **19€** | 52€ (17.33€/mes) | 179€ (14.92€/mes) | 1,000 | 3 | + Vision AI |
| **Business** | **39€** | 107€ (35.67€/mes) | 379€ (31.58€/mes) | 5,000 | 10 | + API externa |
| **Enterprise** | **79€** | 217€ (72.33€/mes) | 749€ (62.42€/mes) | Ilimitado | ∞ | Todo |

### Anti-abuso de suscripción

| Problema | Solución |
|----------|----------|
| **"Me suscribo 3 meses y me voy"** | Plan trimestral más caro por mes que anual |
| **"Uso intensivo en 1 mes"** | Límites claros por plan, no se pueden acumular |
| **"Comparto cuenta"** | Límite de usuarios por plan |
| **"Exporto todo y me voy"** | Datos exportables siempre, pero IA requiere suscripción activa |
| **"Solo uso en trimestre"** | Plan trimestral con precio intermedio |

### Facturación mínima

| Regla | Implementación |
|-------|----------------|
| **Mínimo 1 mes** | No se puede suscribir por días |
| **Cancelación** | Efectiva al final del periodo pagado |
| **Reactivación** | Sin penalización, pero empieza nuevo ciclo |
| **Datos** | Se conservan 90 días tras cancelar |

---

## 🤖 OPCIONES DE IA POR ESCENARIO

### ESCENARIO 1: Usuario con GPU potente (8GB+ VRAM)

```
App detecta GPU → Instala Ollama automáticamente
→ Descarga qwen2.5vl:7b (la mejor para facturas)
→ Procesamiento local, sin internet
→ Precisión: 95%+
→ Coste: 0€
```

### ESCENARIO 2: Usuario con GPU media (4-6GB VRAM)

```
App detecta GPU → Instala Ollama automáticamente
→ Descarga moondream o minicpm-v (más ligero)
→ Procesamiento local
→ Precisión: 85-90%
→ Coste: 0€
```

### ESCENARIO 3: Sin GPU, RAM 16GB+

```
App detecta sin GPU → Usa WebLLM (WebGPU)
→ Descarga Phi-3.5 Mini o Llama 3.2 3B
→ Procesamiento en navegador
→ Precisión: 80-85%
→ Coste: 0€
```

### ESCENARIO 4: Sin GPU, RAM 4-8GB

```
App detecta RAM limitada → Sugiere API externa
→ Usuario introduce API key (Google Gemini es gratis)
→ Procesamiento en la nube
→ Precisión: 95%+
→ Coste: 0-5€/mes según uso
```

### ESCENARIO 5: RAM <4GB o sin nada

```
Fallback a Tesseract.js
→ OCR básico, sin IA
→ Precisión: 70-75%
→ Coste: 0€
```

### ESCENARIO 6: Versión Cloud

```
Servidor BillSnap procesa con:
→ IA nativa (nuestro servidor con GPU)
→ El usuario paga suscripción
→ Precisión: 95%+
→ Incluido en el plan
```

---

## 🏗️ ARQUITECTURA TÉCNICA FINAL

### Versión Local (Tauri/Electron)

```
┌─────────────────────────────────────────────────┐
│  BillSnap Desktop App                           │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Interfaz (HTML/CSS/JS)                  │  │
│  │  - Dashboard                             │  │
│  │  - Subida facturas                       │  │
│  │  - Tabla contabilidad                    │  │
│  │  - Generación PDFs                       │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Motor IA (selección automática)         │  │
│  │                                          │  │
│  │  1. Ollama (si instalado)                │  │
│  │     └── qwen2.5vl:7b                     │  │
│  │                                          │  │
│  │  2. WebLLM (si WebGPU disponible)       │  │
│  │     └── Phi-3.5 / Llama 3.2             │  │
│  │                                          │  │
│  │  3. Transformers.js (fallback)           │  │
│  │     └── TrOCR                            │  │
│  │                                          │  │
│  │  4. API externa (si configurada)         │  │
│  │     └── OpenAI / Gemini / HF             │  │
│  │                                          │  │
│  │  5. Tesseract.js (fallback final)        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Almacenamiento                          │  │
│  │  - SQLite local                          │  │
│  │  - Exportar/Importar JSON                │  │
│  │  - Google Sheets (opcional)              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Versión Cloud (Vercel + Supabase)

```
┌─────────────────────────────────────────────────┐
│  BillSnap Cloud                                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Frontend (Vercel)                       │  │
│  │  - HTML/CSS/JS                           │  │
│  │  - PWA instalable                        │  │
│  │  - WebLLM (si WebGPU)                   │  │
│  │  - Transformers.js                       │  │
│  │  - Tesseract.js                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Backend (Supabase / Vercel Functions)   │  │
│  │  - Autenticación                         │  │
│  │  - Base de datos PostgreSQL              │  │
│  │  - Storage (facturas, logos)             │  │
│  │  - Edge Functions (procesamiento IA)     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  IA Nativa (nuestro servidor)            │  │
│  │  - GPU server (RunPod / Vast.ai)         │  │
│  │  - Modelo fine-tuned para facturas ES    │  │
│  │  - Procesamiento por usuario             │  │
│  │  - Incluido en plan Pro+                 │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Pagos (Stripe)                          │  │
│  │  - Suscripciones                         │  │
│  │  - Webhooks                              │  │
│  │  - Portal cliente                        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 📈 PROYECCIÓN DE INGRESOS

### Año 1 (Conservador)

| Canal | Usuarios | ARPU | MRR | ARR |
|-------|----------|------|-----|-----|
| Cloud Free | 2,000 | 0€ | 0€ | 0€ |
| Cloud Starter | 200 | 9€ | 1,800€ | 21,600€ |
| Cloud Pro | 50 | 19€ | 950€ | 11,400€ |
| Cloud Business | 10 | 39€ | 390€ | 4,680€ |
| Local Starter | 100 | 99€ | - | 9,900€ |
| Local Pro | 50 | 179€ | - | 8,950€ |
| Local Business | 20 | 249€ | - | 4,980€ |
| **TOTAL** | | | **3,140€/mes** | **61,510€** |

### Año 3 (Optimista)

| Canal | Usuarios | ARPU | MRR | ARR |
|-------|----------|------|-----|-----|
| Cloud (todos) | 10,000 | 15€ | 150,000€ | 1,800,000€ |
| Local (todos) | 2,000 | 150€ | - | 300,000€ |
| White Label | 20 | 149€ | 2,980€ | 35,760€ |
| **TOTAL** | | | **152,980€/mes** | **2,135,760€** |

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1: MVP Cloud (Semana 1-2)
- [ ] Deploy en Vercel
- [ ] Supabase para auth + DB
- [ ] Stripe básico (planes Free + Starter)
- [ ] Landing page conectada
- [ ] **RESULTADO**: App funcional en la nube

### Fase 2: IA Nativa Cloud (Semana 3-4)
- [ ] Servidor GPU (RunPod ~50€/mes)
- [ ] Fine-tune modelo en facturas españolas
- [ ] API para procesamiento
- [ ] Incluir en plan Pro+
- [ ] **RESULTADO**: IA nativa funcionando

### Fase 3: App Desktop (Semana 5-8)
- [ ] Empaquetar con Tauri
- [ ] Detección de hardware
- [ ] Instalación automática Ollama
- [ ] Sistema de licencias
- [ ] **RESULTADO**: App de escritorio vendible

### Fase 4: Marketing (Semana 9-10)
- [ ] SEO (blog + keywords)
- [ ] Google Ads
- [ ] Redes sociales
- [ ] ProductHunt
- [ ] **RESULTADO**: Primeros clientes

### Fase 5: Expansión (Mes 3+)
- [ ] Más idiomas (FR, PT, DE)
- [ ] API REST para integraciones
- [ ] White label para asesorías
- [ ] App móvil (React Native)
- [ ] **RESULTADO**: Producto completo

---

## 📋 FORMATOS SOPORTADOS

| Formato | Soporte | Método |
|---------|---------|--------|
| **JPG/JPEG** | ✅ Sí | OCR + IA |
| **PNG** | ✅ Sí | OCR + IA |
| **HEIC** (iPhone) | ✅ Sí | Conversión automática |
| **WebP** | ✅ Sí | OCR + IA |
| **PDF (texto)** | ✅ Sí | Extracción directa |
| **PDF (escaneado)** | ✅ Sí | OCR + IA |
| **DOCX (Word)** | ✅ Sí | Extracción texto |
| **XLSX (Excel)** | ✅ Sí | Lectura directa |
| **CSV** | ✅ Sí | Lectura directa |
| **Factura manuscrita** | ❌ No | Demasiado impreciso |

---

## 🏆 RESUMEN EJECUTIVO

| Aspecto | Decisión |
|---------|----------|
| **Producto** | App facturación + OCR + contabilidad |
| **Mercado** | España + Internacional (ES/EN) |
| **Diferenciador** | Única app con OCR + facturación + contabilidad |
| **Local** | 99-249€ compra única, Tauri |
| **Cloud** | 0-79€/mes, Vercel + Supabase |
| **IA** | Cascada: Ollama → WebLLM → Transformers → API → Tesseract |
| **Anti-piracy** | Hardware fingerprint + precio accesible |
| **Anti-abuso** | Límites claros + facturación mínima |
| **Formatos** | Fotos, PDFs, DOCX, XLSX (NO manuscritas) |
| **Tiempo MVP** | 2-3 semanas |
| **Tiempo completo** | 2-3 meses |
| **Inversión inicial** | ~200€ (dominio + hosting + GPU server) |
