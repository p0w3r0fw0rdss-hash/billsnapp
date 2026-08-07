# BillSnap - Production Checklist

## ❌ PENDIENTE (Crítico para producción)

### 1. Logo/Favicon
- [x] Logo proporcionado (BillSnap.png)
- [ ] Generar favicon.ico (16x16, 32x32)
- [ ] Generar apple-touch-icon.png (180x180)
- [ ] Generar icon-192.png (PWA)
- [ ] Generar icon-512.png (PWA)
- [ ] Integrar logo en sidebar y login

### 2. OCR/IA - Completamente funcional
- [x] Tesseract.js integrado (local, gratis)
- [x] Extracción de datos con regex
- [ ] **PROBLEMA**: Tesseract CDN puede fallar
- [ ] **SOLUCIÓN**: Incluir Tesseract localmente o usar fallback
- [ ] Test real con factura foto
- [ ] Preprocesado de imagen (contraste, B/N, rotación)

### 3. IA Externa - APIs configurables
- [x] OpenAI API (gpt-4o-mini)
- [x] Google Gemini API
- [x] HuggingFace API
- [x] Ollama (local)
- [ ] **FALTA**: Interfaz para configurar API keys
- [ ] **FALTA**: Test de conexión real
- [ ] **FALTA**: Selector de modelo por proveedor

### 4. IA Nativa (NUEVO - CRÍTICO)
- [ ] **MODELO**: Usar PaddleOCR.js o EasyOCR (en navegador)
- [ ] **ALTERNATIVA**: Modelo ONNX pre-entrenado
- [ ] **ALTERNATIVA**: Conexión a Ollama con modelo incluido
- [ ] **SOLUCIÓN**: Implementar con transformers.js (HuggingFace)

### 5. Login/Auth - Necesita correcciones
- [x] Sistema básico implementado
- [ ] **PROBLEMA**: No persiste entre sesiones
- [ ] **PROBLEMA**: No hay registro de usuarios
- [ ] **FALTA**: Recuperar contraseña
- [ ] **FALTA**: Roles funcionales (Admin/Contable/Viewer)

### 6. Base de Datos - IndexedDB funciona
- [x] IndexedDB implementado
- [x] CRUD de facturas
- [x] Configuración guardada
- [ ] **FALTA**: Migración de datos entre versiones
- [ ] **FALTA**: Backup automático
- [ ] **FALTA**: Sincronización offline/online

### 7. Google Sheets - Implementado pero no testeado
- [x] Conexión con API
- [x] Sincronización bidireccional
- [ ] **PROBLEMA**: Necesita OAuth real
- [ ] **SOLUCIÓN**: Usar API Key simple o Service Account
- [ ] **FALTA**: Interfaz HTML sobre Sheets

### 8. Facturación/Pagos (NUEVO)
- [ ] **SISTEMA DE COBRO**:
  - Plan Free: 25 facturas/mes
  - Plan Starter: 200 facturas/mes - 4.99€
  - Plan Pro: 1000 facturas/mes - 9.99€
  - Plan Business: 5000 facturas/mes - 24.99€
- [ ] **INTEGRACIÓN PAGO**:
  - Stripe (recomendado)
  - PayPal
  - Transferencia bancaria
- [ ] **GESTIÓN SUSCRIPCIONES**:
  - Límites por plan
  - Upgrade/downgrade
  - Facturación recurrente

### 9. Multi-idioma - Implementado
- [x] Español completo
- [x] Inglés completo
- [ ] **FALTA**: Francés, Portugués, Alemán (opcional)

### 10. PDFs - Implementado
- [x] Factura individual
- [x] Informe mensual
- [x] Informe trimestral
- [x] Informe anual
- [x] Libro contable
- [x] Resumen fiscal

### 11. UI/UX - Rediseñado
- [x] Estilo Apple/Silicon Valley
- [x] Modo oscuro/claro
- [x] Animaciones suaves
- [x] Responsive
- [ ] **FALTA**: Onboarding tutorial
- [ ] **FALTA**: Tooltips informativos
- [ ] **FALTA**: Keyboard shortcuts

---

## ✅ FUNCIONAL (Ya implementado)

1. ✅ Interfaz profesional (Apple-like)
2. ✅ Modo oscuro/claro
3. ✅ Multi-idioma (ES/EN)
4. ✅ IndexedDB storage
5. ✅ CRUD facturas
6. ✅ Dashboard con gráficos
7. ✅ Exportar CSV/JSON
8. ✅ Generar PDFs (6 tipos)
9. ✅ Sistema de login básico
10. ✅ Google Sheets (estructura)

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1: Crítico (Ahora)
1. Integrar logo y favicon
2. Arreglar OCR/Tesseract
3. Implementar IA nativa con transformers.js
4. Arreglar login/auth
5. Configurar APIs de IA

### Fase 2: Importante (Después)
1. Sistema de cobro con Stripe
2. Límites por plan
3. Google Sheets OAuth
4. Onboarding tutorial

### Fase 3: Mejora (Futuro)
1. Más idiomas
2. App móvil (Tauri)
3. API REST para integraciones
4. Analytics avanzados
