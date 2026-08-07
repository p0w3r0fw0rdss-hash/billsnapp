# BillSnap - Documento Maestro de Negocio y Arquitectura

> **Última actualización**: Estructura completa de negocio, precios, y arquitectura técnica

---

## 🎯 Visión

**BillSnap** es una app de facturación con IA que extrae datos de facturas automáticamente (fotos, PDFs, documentos). Sin entrenar, sin complicaciones.

**Mercado objetivo**: Autónomos, PYMES, asesores fiscales, emprendedores (España + internacional)

**Diferenciador**: IA que RAZONA sobre documentos (no OCR que hay que entrenar)

---

## 📊 Análisis de Mercado

### Competencia directa (España)

| App | Precio | Qué hace | Debilidad |
|-----|--------|----------|-----------|
| **renn** | Gratis (25 facturas/mes), 15€/mes | Facturación + Verifactu | Sin OCR/IA |
| **Cuentica** | 9.90€/mes | Facturación + modelos fiscales | Sin OCR/IA |
| **Quipu** | 12-60€/mes | Facturación + contabilidad | Sin OCR/IA |
| **Holded** | 7.50-100€/mes | ERP completo | Complejo, sin OCR |
| **Xolo** | 75-149€/mes | Facturación + gestoría | Caro |

### Competencia internacional

| App | Precio | Qué hace | Debilidad |
|-----|--------|----------|-----------|
| **FreshBooks** | $23-70/mes | Facturación | Sin OCR/IA |
| **Wave** | Gratis / $16/mes | Facturación básica | Sin IA |
| **Zoho Invoice** | Gratis / $15/mes | Facturación | Sin OCR |
| **Invoice Ninja** | Gratis / $14/mes | Facturación | Sin IA |
| **ScanToExcel** | Gratis (10/día), $29/mes | Solo OCR → Excel | Sin facturación |

### 💡 Conclusión
> **Ninguna combina OCR/IA + facturación + contabilidad + PDFs en una sola app a precio accesible.** Hay un hueco claro en el mercado.

---

## 💰 Estrategia de Precios

### MODELO DUAL: Local (compra) + Cloud (suscripción)

---

### 🖥️ VERSIÓN LOCAL (App Desktop)

**Precio**: Compra única + actualizaciones opcionales

| Plan | Precio | Qué incluye | Licencia |
|------|--------|-------------|----------|
| **BillSnap Starter** | **99€** | App básica, Tesseract OCR, 1 empresa | 1 PC, perpetua v1.x |
| **BillSnap Pro** | **179€** | + IA (Ollama/WebLLM), múltiples empresas, todos los PDFs | 1 PC, perpetua v1.x |
| **BillSnap Business** | **249€** | + Multi-usuario (3), Google Sheets, email | 3 PCs, perpetua v1.x |

**Actualizaciones opcionales**:
- Actualización mayor (v2.0): 40% del precio original = 40-100€
- Soporte prioritario: 29€/año

**Anti-piracy**:
- Licencia vinculada a hardware (fingerprint del PC)
- Activación online una vez (después funciona offline)
- Máximo 2 reactivaciones (cambio de PC)
- Si quiere más PCs: compra licencia adicional

**¿Por qué no abusarán?**
- 99€ es barato para una empresa, no merece la pena piratear
- Las actualizaciones mayores generan ingresos recurrentes
- El valor está en la IA, que mejora constantemente

---

### ☁️ VERSIÓN CLOUD (Suscripción)

**Precio**: Mensual/anual con descuento

| Plan | Mensual | Anual (ahorro) | Facturas/mes | Usuarios | IA |
|------|---------|----------------|-------------|----------|-----|
| **Free** | 0€ | 0€ | 25 | 1 | Tesseract |
| **Starter** | 9€ | 79€/año (27% dto) | 200 | 1 | + WebLLM |
| **Pro** | 19€ | 179€/año (21% dto) | 1,000 | 3 | + Vision AI |
| **Business** | 39€ | 379€/año (19% dto) | 5,000 | 10 | + API externa |
| **Enterprise** | 79€ | 749€/año (21% dto) | Ilimitado | Ilimitado | Todo + personalizado |

**Anti-abuso de suscripción** (el que se suscribe 3 meses y se va):
- Plan anual con descuento significativo (incentivar compromiso)
- Facturación trimestral: 29€/trimestre (Starter), 59€ (Pro)
- Los datos se exportan pero la IA no funciona sin suscripción
- Funciones premium (IA, PDFs avanzados) solo con suscripción activa

---

### 🎯 Precios para Asesorías Fiscales (White Label)

| Plan | Precio | Qué incluye |
|------|--------|-------------|
| **BillSnap para Asesorías** | 149€/mes | Marca blanca, clientes ilimitados, API |

---

## 🏗️ Arquitectura Técnica

### Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                          BillSnap                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐          ┌─────────────────┐               │
│  │  VERSIÓN LOCAL  │          │  VERSIÓN CLOUD  │               │
│  │  (Tauri App)    │          │  (Web/PWA)      │               │
│  └────────┬────────┘          └────────┬────────┘               │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    MOTOR DE IA                          │     │
│  │                                                         │     │
│  │  Prioridad 1: Ollama (local, mejor calidad)            │     │
│  │       ↓ fallback                                        │     │
│  │  Prioridad 2: WebLLM (navegador, sin instalar)         │     │
│  │       ↓ fallback                                        │     │
│  │  Prioridad 3: Transformers.js (navegador, visión)      │     │
│  │       ↓ fallback                                        │     │
│  │  Prioridad 4: API externa (OpenAI/Gemini/HF)          │     │
│  │       ↓ fallback                                        │     │
│  │  Prioridad 5: Tesseract.js (OCR básico)               │     │
│  │                                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    ALMACENAMIENTO                       │     │
│  │                                                         │     │
│  │  Local: IndexedDB (navegador) / SQLite (Tauri)         │     │
│  │  Cloud: Supabase (PostgreSQL) + Storage                 │     │
│  │  Sync: Google Sheets (opcional)                         │     │
│  │                                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    FUNCIONALIDADES                      │     │
│  │                                                         │     │
│  │  ✅ Subir fotos/PDFs/docs/Excel                        │     │
│  │  ✅ OCR automático con IA                               │     │
│  │  ✅ Tabla organizada por fecha                          │     │
│  │  ✅ Emitir facturas con logo propio                     │     │
│  │  ✅ PDFs (facturas, informes, contabilidad)            │     │
│  │  ✅ Exportar CSV/Excel/JSON                             │     │
│  │  ✅ Multi-idioma (ES/EN)                                │     │
│  │  ✅ Multi-moneda (EUR/USD/GBP)                          │     │
│  │  ✅ Gestión de clientes                                 │     │
│  │  ✅ Dashboard con gráficos                              │     │
│  │                                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Selector de IA por Hardware del Usuario

```
USUARIO ABRE BILLSNAP
         │
         ▼
┌─────────────────────────────────────┐
│  Detectar recursos del PC           │
│  - RAM total                        │
│  - GPU disponible                   │
│  - VRAM                             │
│  - Navegador (WebGPU?)              │
└────────────────┬────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┬─────────────┐
    ▼            ▼            ▼              ▼             ▼
 GPU potente  GPU+RAM     RAM 16GB+      RAM 4-8GB     RAM <4GB
 (8GB+ VRAM)  (4-8GB)     sin GPU        sin GPU       sin GPU
    │            │            │              │             │
    ▼            ▼            ▼              ▼             ▼
 Ollama       Ollama      WebLLM        API Key      Tesseract
 qwen2.5vl    moondream   Phi-3.5       OpenAI/Gemini
 :7b          /minicpm    /Llama 3.2
              -V          3B
    │            │            │              │             │
    ▼            ▼            ▼              ▼             ▼
 ⭐⭐⭐⭐⭐   ⭐⭐⭐⭐    ⭐⭐⭐⭐      ⭐⭐⭐⭐⭐    ⭐⭐⭐
 Vision AI    Vision AI   Razona         Vision AI     OCR
 ve fotos     ve fotos    sobre OCR      ve fotos      básico
```

---

### Versiones de la App

| Característica | Local (Tauri) | Cloud (Web) |
|---------------|---------------|-------------|
| **Distribución** | Descarga directa | GitHub + Vercel |
| **Motor IA** | Ollama + fallbacks | WebLLM + API + Tesseract |
| **Almacenamiento** | SQLite local | Supabase (PostgreSQL) |
| **Multi-usuario** | Sí (red local) | Sí (cloud) |
| **Offline** | ✅ 100% | ⚠️ Parcial (PWA) |
| **Actualizaciones** | Manual o auto-update | Automático |
| **Precio** | Compra única 99-249€ | Suscripción 0-79€/mes |

---

## 📋 Funcionalidades por Plan

### VERSIÓN LOCAL

| Función | Starter (99€) | Pro (179€) | Business (249€) |
|---------|--------------|------------|-----------------|
| Subir fotos/PDFs/docs | ✅ | ✅ | ✅ |
| OCR Tesseract | ✅ | ✅ | ✅ |
| IA Ollama/WebLLM | ❌ | ✅ | ✅ |
| Facturas con logo | ✅ | ✅ | ✅ |
| PDF individual | ✅ | ✅ | ✅ |
| Informes PDF | ❌ | ✅ | ✅ |
| Contabilidad | ❌ | ✅ | ✅ |
| Multi-empresa | 1 | 3 | 10 |
| Multi-usuario | 1 | 1 | 3 |
| Google Sheets | ❌ | ❌ | ✅ |
| Email facturas | ❌ | ❌ | ✅ |
| Exportar CSV/JSON | ✅ | ✅ | ✅ |
| Multi-idioma | ✅ | ✅ | ✅ |
| Multi-moneda | ❌ | ✅ | ✅ |
| Gestión clientes | ❌ | ✅ | ✅ |
| Dashboard | Básico | Completo | Completo |
| Actualizaciones | v1.x | v1.x | v1.x |

### VERSIÓN CLOUD

| Función | Free | Starter (9€) | Pro (19€) | Business (39€) | Enterprise (79€) |
|---------|------|-------------|-----------|----------------|------------------|
| Facturas/mes | 25 | 200 | 1,000 | 5,000 | Ilimitado |
| Usuarios | 1 | 1 | 3 | 10 | Ilimitado |
| OCR Tesseract | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebLLM (navegador) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Vision AI (Ollama) | ❌ | ❌ | ✅ | ✅ | ✅ |
| API externa | ❌ | ❌ | ❌ | ✅ | ✅ |
| Facturas con logo | ❌ | ✅ | ✅ | ✅ | ✅ |
| PDFs informes | ❌ | ✅ | ✅ | ✅ | ✅ |
| Contabilidad | ❌ | ❌ | ✅ | ✅ | ✅ |
| Google Sheets | ❌ | ❌ | ✅ | ✅ | ✅ |
| Email | ❌ | ❌ | ❌ | ✅ | ✅ |
| Multi-moneda | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gestión clientes | ❌ | ❌ | ✅ | ✅ | ✅ |
| API REST | ❌ | ❌ | ❌ | ❌ | ✅ |
| Marca blanca | ❌ | ❌ | ❌ | ❌ | ✅ |
| Soporte | Email | Email | Email | Prioritario | Dedicado |

---

## 🛡️ Anti-Piracy y Anti-Abuso

### Para versión LOCAL:

| Estrategia | Cómo funciona |
|-----------|---------------|
| **Hardware fingerprint** | Licencia vinculada a componentes del PC (CPU, motherboard, disco) |
| **Activación online** | Una vez al instalar (después offline) |
| **Límite de reactivaciones** | 2 reactivaciones gratis, luego contactar soporte |
| **Verificación periódica** | Cada 30 días, si hay internet verifica licencia |
| **Precio accesible** | 99€ es "demasiado barato para piratear" para empresas |

### Para versión CLOUD:

| Estrategia | Cómo funciona |
|-----------|---------------|
| **Freemium** | 25 facturas/mes gratis (enganchar) |
| **Plan anual con descuento** | Incentivar compromiso a largo plazo |
| **Funciones premium** | IA avanzada solo con suscripción activa |
| **Exportar datos** | Siempre puede exportar, pero la IA no funciona sin pagar |
| **Facturación por uso** | Límites claros por plan |

### Para asesorías que "usan 3 meses":

| Estrategia | Cómo funciona |
|-----------|---------------|
| **Plan trimestral** | 29€/trimestre (Starter) - más caro por mes que anual |
| **Facturación mínima** | Mínimo 3 meses en planes mensuales |
| **Compromiso anual** | Mejor precio si paga anual |
| **Valor continuo** | Dashboard, alertas, backups - útil todo el año |

---

## 📱 Tipos de Archivo Soportados

| Tipo | Formatos | Método de lectura |
|------|----------|-------------------|
| **Fotos** | JPG, PNG, HEIC, WebP, BMP | OCR + IA |
| **PDFs** | PDF (texto y escaneado) | Extracción texto + OCR si escaneado |
| **Documentos** | DOCX (Word) | Extracción texto |
| **Hojas de cálculo** | XLSX, CSV | Lectura directa |
| **❌ NO soportado** | Facturas manuscritas | (demasiado impreciso) |

---

## 🚀 Plan de Lanzamiento

### Fase 1: MVP Cloud (Semana 1-2)
- [ ] Deploy en Vercel
- [ ] Funcionalidades core (subir, OCR, tabla, PDF básico)
- [ ] Plan Free funcionando
- [ ] Landing page básica

### Fase 2: Monetización Cloud (Semana 3-4)
- [ ] Integrar Stripe
- [ ] Planes Starter y Pro
- [ ] Facturas con logo
- [ ] Informes PDF

### Fase 3: App Local (Semana 5-6)
- [ ] Empaquetar con Tauri
- [ ] Sistema de licencias
- [ ] Bundle Ollama
- [ ] Detector de hardware

### Fase 4: Marketing (Semana 7-8)
- [ ] Landing page profesional
- [ ] SEO (español + inglés)
- [ ] ProductHunt launch
- [ ] Redes sociales

### Fase 5: Expansión (Mes 3+)
- [ ] Más idiomas (FR, PT, DE)
- [ ] App móvil (React Native)
- [ ] API REST para integraciones
- [ ] Marca blanca para asesorías

---

## 📈 Proyección de Ingresos

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

## 💡 Resumen Ejecutivo

| Aspecto | Decisión |
|---------|----------|
| **Producto** | App facturación con IA que razona sobre documentos |
| **Mercado** | Autónomos, PYMES, asesores fiscales (ES + EN) |
| **Diferenciador** | IA sin entrenar, entiende cualquier formato |
| **Local** | 99-249€ compra única, Tauri app |
| **Cloud** | 0-79€/mes, GitHub + Vercel |
| **Anti-piracy** | Hardware fingerprint + precio accesible |
| **Anti-abuso** | Planes anuales con descuento + límites claros |
| **Formatos** | Fotos, PDFs, DOCX, XLSX (NO manuscritas) |
| **IA** | Cascada: Ollama → WebLLM → Transformers.js → API → Tesseract |
