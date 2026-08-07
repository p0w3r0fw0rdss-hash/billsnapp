# BillSnap - Documento Maestro de Negocio

> **Última actualización**: Visión final enfocada en organización y contabilidad de facturas

---

## 🎯 Visión Clara

**BillSnap** es un SaaS que **organiza y contabiliza facturas recibidas** usando IA.

No emitimos facturas (de momento). Recibimos, organizamos y contabilizamos.

### Flujo del usuario

```
USUARIO RECIBE FACTURA (de proveedor o de cliente)
         │
         ▼
SUBE A BILLSNAP (foto, PDF, documento)
         │
         ▼
IA EXTRAE DATOS automáticamente
(fecha, emisor, concepto, base, IVA, total)
         │
         ▼
SISTEMA CLASIFICA
├─ ¿Emisor somos nosotros? → INGRESO (cliente nos paga)
└─ ¿Emisor es otro? → GASTO (nosotros pagamos)
         │
         ▼
CONTABILIDAD AUTOMÁTICA
├─ Total ingresos
├─ Total gastos
├─ IVA soportado (gastos)
├─ IVA repercutido (ingresos)
├─ Beneficio/pérdida
└─ A pagar a Hacienda
         │
         ▼
INFORMES PARA GESTOR/HACIENDA
├─ PDF trimestral
├─ Exportar CSV/JSON
└─ Resumen fiscal
```

---

## 👤 Público Objetivo

| Perfil | Necesidad | Dónde encontrarlos |
|--------|-----------|-------------------|
| **Autónomos** | Organizar facturas trimestrales | Foros, redes, Google |
| **PYMES** | Control de gastos e ingresos | LinkedIn, eventos |
| **Gestorías** | Recibir facturas organizadas de clientes | Partnership directo |
| **Freelancers** | Saber cuánto ganan y gastan | Comunidades online |

---

## 💰 Precios

| Plan | Precio | Facturas/mes | Usuarios | IA | Para quién |
|------|--------|-------------|----------|-----|-----------|
| **Free** | 0€ | 25 | 1 | Tesseract | Probar la app |
| **Autónomo** | 9€/mes | 200 | 1 | WebLLM | Autónomo solo |
| **PYME** | 19€/mes | 1,000 | 3 | Vision AI | Empresa pequeña |
| **Gestoría** | 49€/mes | 5,000 | 10 | Vision AI | Gestor con clientes |
| **Business** | 99€/mes | Ilimitado | Ilimitado | Todo | Empresa grande |

**Descuento anual**: 2 meses gratis (pagues 10 por 12)

---

## 🏆 Diferenciadores

| Competidor | ¿Emite facturas? | ¿Organiza recibidas? | ¿IA lee fotos? | ¿Contabilidad? |
|-----------|------------------|---------------------|----------------|----------------|
| renn | ✅ Sí | ❌ No | ❌ No | ⚠️ Básica |
| Cuentica | ✅ Sí | ❌ No | ❌ No | ✅ Sí |
| Quipu | ✅ Sí | ⚠️ Básico | ❌ No | ✅ Sí |
| Holded | ✅ Sí | ⚠️ Básico | ❌ No | ✅ Sí |
| **BillSnap** | ❌ No | ✅ **SÍ** | ✅ **SÍ** | ✅ **SÍ** |

**Nuestro único**: "Sube una foto, la IA organiza y contabiliza"

---

## 🧠 Arquitectura IA

### Cascada por hardware del usuario

```
GPU potente → Ollama (Vision AI, la mejor calidad)
GPU medio → Ollama (modelos ligeros)
RAM 16GB+ → WebLLM (Phi-3.5, Llama 3.2)
RAM 4-8GB → API key (OpenAI/Gemini)
RAM <4GB → Tesseract (OCR básico)
```

### Proveedores soportados

| Proveedor | Tipo | Coste para usuario |
|-----------|------|-------------------|
| **Ollama** | Local | Gratis |
| **WebLLM** | Navegador | Gratis |
| **Transformers.js** | Navegador | Gratis |
| **OpenAI** | API | ~0.001€/factura |
| **Google Gemini** | API | Gratis (15 req/min) |
| **HuggingFace** | API | Gratis (limitado) |
| **Tesseract** | Local | Gratis |

---

## 📱 Formatos Soportados

| Tipo | Formatos | Método |
|------|----------|--------|
| **Fotos** | JPG, PNG, HEIC, WebP | OCR + IA |
| **PDFs** | PDF (texto y escaneado) | Extracción + OCR |
| **Documentos** | DOCX | Extracción texto |
| **Hojas de cálculo** | XLSX, CSV | Lectura directa |
| **❌ NO** | Facturas manuscritas | Demasiado impreciso |

---

## 📊 Funcionalidades por Plan

| Función | Free | Autónomo | PYME | Gestoría | Business |
|---------|------|----------|------|----------|----------|
| Facturas/mes | 25 | 200 | 1,000 | 5,000 | Ilimitado |
| Usuarios | 1 | 1 | 3 | 10 | Ilimitado |
| OCR Tesseract | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebLLM (IA navegador) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Vision AI (Ollama) | ❌ | ❌ | ✅ | ✅ | ✅ |
| API externa | ❌ | ❌ | ❌ | ✅ | ✅ |
| Clasificación auto | ✅ | ✅ | ✅ | ✅ | ✅ |
| Categorías | 5 | Ilimitadas | Ilimitadas | Ilimitadas | Ilimitadas |
| Dashboard | Básico | Completo | Completo | Completo | Completo |
| Informes PDF | ❌ | ✅ | ✅ | ✅ | ✅ |
| Exportar CSV/JSON | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-empresa | 1 | 1 | 3 | 20 | Ilimitado |
| Multi-idioma | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soporte | Email | Email | Email | Prioritario | Dedicado |

---

## 🛡️ Anti-Piracy y Anti-Abuso

### Local (futuro, con Tauri)
- Licencia vinculada a hardware
- Precio accesible (99-249€)
- Actualizaciones mayores de pago

### Cloud (actual)
- Freemium: 25 facturas gratis
- Plan anual con 2 meses gratis
- Límites claros por plan
- Datos exportables siempre

---

## 📈 Proyección de Ingresos

### Año 1 (Conservador)

| Plan | Usuarios | MRR |
|------|----------|-----|
| Free | 2,000 | 0€ |
| Autónomo | 200 | 1,800€ |
| PYME | 50 | 950€ |
| Gestoría | 10 | 490€ |
| Business | 5 | 495€ |
| **TOTAL** | | **3,735€/mes** |

### Año 3 (Optimista)

| Plan | Usuarios | MRR |
|------|----------|-----|
| Free | 20,000 | 0€ |
| Autónomo | 2,000 | 18,000€ |
| PYME | 500 | 9,500€ |
| Gestoría | 100 | 4,900€ |
| Business | 50 | 4,950€ |
| **TOTAL** | | **37,350€/mes = ~448K€/año** |

---

## 🚀 Plan de Lanzamiento

### Fase 1: MVP (Semana 1-4)
- [ ] Subir fotos/PDFs
- [ ] OCR con Tesseract
- [ ] IA extrae datos
- [ ] Clasificar: GASTO vs INGRESO
- [ ] Tabla organizada por fecha
- [ ] Categorías (luz, teléfono, material, etc.)
- [ ] Dashboard básico (total gastos, ingresos)
- [ ] Exportar CSV
- [ ] Deploy en Vercel

### Fase 2: Monetización (Semana 5-8)
- [ ] Integrar Stripe
- [ ] Planes Free, Autónomo, PYME
- [ ] Informes PDF trimestrales
- [ ] Multi-empresa
- [ ] Landing page

### Fase 3: IA Avanzada (Semana 9-12)
- [ ] WebLLM (IA en navegador)
- [ ] Vision AI (Ollama)
- [ ] API externa (OpenAI/Gemini)
- [ ] Auto-categorización inteligente

### Fase 4: Expansión (Mes 4+)
- [ ] Plan Gestoría
- [ ] Multi-usuario con roles
- [ ] App desktop (Tauri)
- [ ] Más idiomas
- [ ] Partnership con gestorías

---

## 📚 Documentos del Proyecto

| Documento | Contenido |
|-----------|-----------|
| `BUSINESS_MODEL.md` | Este documento (negocio) |
| `GO_TO_MARKET.md` | Estrategia de mercado |
| `PRODUCTION_CHECKLIST.md` | Estado de desarrollo |
| `docs/TRAINING_GUIDE.md` | Guía de entrenamiento IA |
| `docs/VERIFACTU_IMPLEMENTATION.md` | Verifactu (para futuro) |
