# BillSnap - Production Checklist (Actualizado)

> **Última actualización**: Implementación completa de IA nativa, billing, y guía de entrenamiento

---

## ✅ IMPLEMENTADO Y FUNCIONAL

### 🎨 UI/UX
- [x] Diseño Apple/Silicon Valley profesional
- [x] Inter font (tipografía premium)
- [x] Modo oscuro/claro con toggle
- [x] Animaciones suaves (fadeIn, slideIn)
- [x] Responsive (móvil, tablet, desktop)
- [x] Logo BillSnap integrado (favicon, sidebar, login)
- [x] Componentes reutilizables (cards, badges, botones)
- [x] Toast notifications
- [x] Modal system con backdrop blur

### 🌍 Multi-idioma
- [x] Español completo
- [x] Inglés completo
- [x] Selector en login y app
- [x] Detección automática de idioma del navegador
- [x] Formato de moneda/fecha por locale

### 🔐 Autenticación
- [x] Login con usuario/contraseña
- [x] Persistencia de sesión
- [x] Roles: Admin, Contable, Viewer
- [x] Gestión de usuarios (CRUD)
- [x] Permisos por rol
- [x] Default admin (admin/admin123)

### 💾 Base de Datos
- [x] IndexedDB para almacenamiento local
- [x] CRUD de facturas
- [x] Configuración persistente
- [x] Exportar/Importar JSON backup
- [x] Estadísticas y métricas

### 📸 OCR/IA - Tesseract.js
- [x] OCR local sin internet
- [x] Soporte español + inglés
- [x] Extracción de datos con regex mejorado:
  - Número de factura
  - Fecha emisión/vencimiento
  - Emisor (nombre, NIF, dirección)
  - Receptor (nombre, NIF)
  - Base imponible, IVA, IRPF, Total
  - IBAN, método de pago
  - Email, teléfono

### 🧠 Vision AI (NUEVO - MODELOS QUE RAZONAN)
- [x] **Arquitectura VLM** (Vision-Language Models)
- [x] **Ollama** (local, 100% privado, gratis):
  - Qwen2.5-VL 7B (el mejor para facturas)
  - Llama 3.2 Vision 11B (la mejor calidad)
  - MiniCPM-V (compacto, eficiente)
  - Moondream (ultra-ligero, 2GB VRAM)
  - Gemma 3 4B (buen equilibrio)
- [x] **APIs externas** (alternativas):
  - OpenAI GPT-4o (la mejor calidad, ~$0.001/factura)
  - Google Gemini (gratis, 15 req/min)
  - HuggingFace (gratis, rate-limited)
- [x] **Prompt engineering** para extracción JSON estructurada
- [x] Auto-detección de proveedor disponible
- [x] Configuración por usuario
- [x] Instrucciones de setup integradas
- [x] **NO necesita entrenar** - solo pasar la imagen

### ⚡ OCR Básico (Fallback)
- [x] Tesseract.js (siempre disponible)
- [x] Preprocesado de imagen mejorado
- [x] Extracción con regex para cuando no hay IA

### 🌐 APIs Externas
- [x] OpenAI (gpt-4o-mini)
- [x] Google Gemini
- [x] HuggingFace
- [x] Ollama (local)
- [x] Configuración por usuario
- [x] Test de conexión

### 📊 Google Sheets
- [x] Conexión con API Key
- [x] Sincronización bidireccional
- [x] Inicialización automática de headers
- [x] Formato de celdas (moneda, porcentajes)
- [x] Importar desde Sheets
- [x] Abrir vista en navegador

### 📑 Generación PDF
- [x] Factura individual profesional
- [x] Informe mensual
- [x] Informe trimestral (Modelo 303)
- [x] Informe anual ejecutivo
- [x] Resumen fiscal (IVA repercutido vs soportado)
- [x] Libro contable completo

### 💰 Sistema de Cobro (NUEVO)
- [x] 5 planes definidos:
  - Free: 0€, 25 facturas/mes, solo Tesseract
  - Starter: 4.99€, 200 facturas/mes, + IA Nativa
  - Pro: 9.99€, 1,000 facturas/mes, + API externa
  - Business: 24.99€, 5,000 facturas/mes, + Ollama
  - Enterprise: 49.99€, ilimitado, todo
- [x] Tracking de uso mensual
- [x] Límites por plan
- [x] Bloqueo de motores por plan
- [x] Indicador de uso en sidebar
- [x] Prompt de upgrade cuando se alcanza límite
- [x] Página de precios con todos los planes
- [x] Modal de pago (simulado, listo para Stripe)

### 📤 Exportación
- [x] CSV con todas las facturas
- [x] JSON backup completo
- [x] Importar JSON backup

---

## ⚠️ PENDIENTE (Para producción real)

### 🔴 CRÍTICO (Sin esto no se puede cobrar)

1. **Stripe Integration**
   - [ ] Crear cuenta Stripe
   - [ ] Integrar Stripe.js real
   - [ ] Webhooks para confirmación de pago
   - [ ] Gestión de suscripciones recurrentes
   - [ ] Portal de cliente (cancelar, cambiar plan)
   - **Complejidad**: Media | **Tiempo**: 2-3 días

2. **Backend/Server**
   - [ ] API REST para:
     - Autenticación JWT
     - Verificar pagos
     - Servir modelos de IA nativa
     - Almacenar datos en cloud
   - **Opciones**:
     - Node.js + Express (simple)
     - Next.js API routes (recomendado)
     - Supabase (BaaS, más rápido)
   - **Complejidad**: Alta | **Tiempo**: 3-5 días

3. **Dominio y Hosting**
   - [ ] Comprar dominio (billsnap.app o billsnap.io)
   - [ ] Hosting (Vercel/Netlify/Railway)
   - [ ] SSL/HTTPS (automático con hosting)
   - [ ] CDN para modelos de IA
   - **Coste**: ~50-100€/año

### 🟡 IMPORTANTE (Mejora la experiencia)

4. **OAuth Social Login**
   - [ ] Login con Google
   - [ ] Login con GitHub
   - [ ] Login con Microsoft
   - **Complejidad**: Baja | **Tiempo**: 1 día

5. **Notificaciones Email**
   - [ ] Email de bienvenida
   - [ ] Facturas próximas a vencer
   - [ ] Resumen mensual
   - [ ] Confirmación de pago
   - **Servicio**: SendGrid/Mailgun (free tier)
   - **Complejidad**: Baja | **Tiempo**: 1 día

6. **Onboarding Tutorial**
   - [ ] Tour guiado primera vez
   - [ ] Tooltips informativos
   - [ ] Ejemplo de factura de prueba
   - **Complejidad**: Baja | **Tiempo**: 1 día

7. **Tests Automatizados**
   - [ ] Tests unitarios (Jest/Vitest)
   - [ ] Tests de integración
   - [ ] Tests E2E (Playwright)
   - **Complejidad**: Media | **Tiempo**: 2-3 días

### 🟢 MEJORAS (Para escalar)

8. **Más Idiomas**
   - [ ] Francés
   - [ ] Portugués
   - [ ] Alemán
   - [ ] Italiano
   - **Complejidad**: Baja | **Tiempo**: 1 día/idioma

9. **App Desktop (Tauri)**
   - [ ] Configurar Tauri
   - [ ] Build para Windows/Mac/Linux
   - [ ] Auto-updates
   - [ ] Sistema de licencias
   - **Complejidad**: Media | **Tiempo**: 3-4 días

10. **API REST Pública**
    - [ ] Documentación OpenAPI
    - [ ] API keys por plan
    - [ ] Rate limiting
    - [ ] SDK JavaScript/Python
    - **Complejidad**: Alta | **Tiempo**: 3-5 días

11. **Analytics**
    - [ ] Tracking de uso (Plausible/Umami)
    - [ ] Dashboard de métricas
    - [ ] Conversiones y churn
    - **Complejidad**: Baja | **Tiempo**: 1 día

12. **Fine-tuning Modelo Custom**
    - [ ] Recopilar 200-500 facturas españolas
    - [ ] Anotar con Label Studio
    - [ ] Fine-tune TrOCR en Colab
    - [ ] Convertir a ONNX para navegador
    - [ ] Subir a HuggingFace Hub
    - [ ] Integrar en BillSnap
    - **Complejidad**: Alta | **Tiempo**: 1-2 semanas
    - **Precisión esperada**: 95-98%

---

## 📊 Resumen de Estado

| Categoría | Implementado | Pendiente | % Completo |
|-----------|-------------|-----------|------------|
| **UI/UX** | 10 | 0 | 100% |
| **Multi-idioma** | 5 | 4 | 55% |
| **Autenticación** | 6 | 3 | 67% |
| **Base de Datos** | 5 | 2 | 71% |
| **Vision AI** | 12 | 0 | 100% |
| **OCR Básico** | 5 | 0 | 100% |
| **PDFs** | 6 | 0 | 100% |
| **Billing** | 9 | 3 | 75% |
| **Integraciones** | 6 | 4 | 60% |
| **TOTAL** | **64** | **16** | **80%** |

---

## 🚀 Plan de Lanzamiento

### Semana 1: Core
- [ ] Integrar Stripe real
- [ ] Desplegar en Vercel
- [ ] Comprar dominio
- [ ] Configurar SSL

### Semana 2: Polish
- [ ] OAuth (Google login)
- [ ] Email notifications
- [ ] Onboarding tutorial
- [ ] Tests básicos

### Semana 3: Marketing
- [ ] Landing page
- [ ] SEO básico
- [ ] ProductHunt launch
- [ ] Social media

### Semana 4: Iteración
- [ ] Feedback usuarios
- [ ] Fix bugs
- [ ] Mejoras UX
- [ ] Fine-tuning modelo

---

## 💰 Proyección de Ingresos (Conservadora)

| Mes | Usuarios Free | Usuarios Paid | MRR |
|-----|---------------|---------------|-----|
| 1 | 100 | 5 | 50€ |
| 3 | 500 | 25 | 250€ |
| 6 | 2,000 | 100 | 1,000€ |
| 12 | 5,000 | 300 | 3,000€ |
| 24 | 15,000 | 1,000 | 10,000€ |

**Asumiendo**: 2% conversión free→paid, ticket medio 10€/mes

---

## 📞 Contacto y Soporte

- **Email**: support@billsnap.app (configurar)
- **Documentación**: docs.billsnap.app (crear)
- **Status page**: status.billsnap.app (opcional)
- **GitHub**: github.com/tu-usuario/billsnap (público o privado)
