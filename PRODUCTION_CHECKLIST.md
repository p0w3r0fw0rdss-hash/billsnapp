# BillSnap - Production Checklist

> **Visión**: Organizar y contabilizar facturas recibidas con IA
> **NO emitimos facturas** (de momento)

---

## ✅ IMPLEMENTADO

### 🎨 UI/UX
- [x] Diseño Apple/Silicon Valley
- [x] Modo oscuro/claro
- [x] Animaciones suaves
- [x] Responsive (móvil, tablet, desktop)
- [x] Logo BillSnap integrado
- [x] Toast notifications
- [x] Modal system

### 🌍 Multi-idioma
- [x] Español completo
- [x] Inglés completo
- [x] Selector en login y app

### 🔐 Autenticación
- [x] Login usuario/contraseña
- [x] Roles: Admin, Contable, Viewer
- [x] Gestión de usuarios (CRUD)
- [x] Default admin (admin/admin123)

### 💾 Base de Datos
- [x] IndexedDB local
- [x] CRUD de facturas
- [x] Configuración persistente
- [x] Exportar/Importar JSON

### 🤖 IA
- [x] Tesseract.js (OCR básico)
- [x] Vision AI (Ollama/API)
- [x] WebLLM (navegador)
- [x] Native AI (navegador)
- [x] APIs externas (OpenAI, Gemini, HF)
- [x] Auto-detección de hardware
- [x] Cascada de motores según recursos

### 📑 PDFs
- [x] Factura individual
- [x] Informe mensual
- [x] Informe trimestral
- [x] Informe anual
- [x] Libro contable
- [x] Resumen fiscal

### 💰 Billing
- [x] 5 planes definidos
- [x] Tracking de uso mensual
- [x] Límites por plan
- [x] Página de precios
- [x] Modal de pago (simulado)

### 📤 Exportación
- [x] CSV
- [x] JSON backup
- [x] Importar JSON

---

## ⚠️ PENDIENTE (Para MVP)

### 🔴 CRÍTICO (Sin esto no funciona)

1. **Clasificación GASTO vs INGRESO**
   - [ ] Detectar automáticamente si es gasto o ingreso
   - [ ] Basado en: ¿el emisor somos nosotros?
   - [ ] Permitir cambio manual
   - [ ] **Complejidad**: Baja | **Tiempo**: 1-2 días

2. **Categorías de facturas**
   - [ ] Categorías predefinidas (luz, teléfono, material, servicios, etc.)
   - [ ] Categorización automática por IA
   - [ ] Categorización manual
   - [ ] Categorías personalizables
   - [ ] **Complejidad**: Baja | **Tiempo**: 1-2 días

3. **Contabilidad básica**
   - [ ] Total ingresos del periodo
   - [ ] Total gastos del periodo
   - [ ] Beneficio/pérdida
   - [ ] IVA soportado (gastos)
   - [ ] IVA repercutido (ingresos)
   - [ ] A pagar a Hacienda
   - [ ] **Complejidad**: Media | **Tiempo**: 2-3 días

4. **Dashboard mejorado**
   - [ ] Resumen ingresos vs gastos
   - [ ] Gráfico por categoría
   - [ ] Gráfico por mes
   - [ ] Indicadores clave (KPIs)
   - [ ] **Complejidad**: Media | **Tiempo**: 2-3 días

5. **Informes para gestor**
   - [ ] PDF trimestral con todas las facturas
   - [ ] Resumen de ingresos/gastos
   - [ ] Resumen de IVA
   - [ ] Lista de facturas por categoría
   - [ ] **Complejidad**: Media | **Tiempo**: 2-3 días

### 🟡 IMPORTANTE

6. **Multi-empresa**
   - [ ] Selector de empresa activa
   - [ ] Datos separados por empresa
   - [ ] Límites por plan
   - [ ] **Complejidad**: Media | **Tiempo**: 2-3 días

7. **Stripe (cobros reales)**
   - [ ] Integrar Stripe.js
   - [ ] Webhooks de confirmación
   - [ ] Gestión de suscripciones
   - [ ] **Complejidad**: Media | **Tiempo**: 2-3 días

8. **Landing page**
   - [ ] Página de venta profesional
   - [ ] Pricing claro
   - [ ] Demo/screenshots
   - [ ] **Complejidad**: Baja | **Tiempo**: 2-3 días

### 🟢 MEJORAS

9. **Más idiomas** (FR, PT, DE)
10. **App desktop** (Tauri)
11. **Google Sheets** sync
12. **Email** envío de informes

---

## 📊 Resumen de Estado

| Categoría | Implementado | Pendiente | % Completo |
|-----------|-------------|-----------|------------|
| **UI/UX** | 10 | 0 | 100% |
| **Multi-idioma** | 5 | 4 | 55% |
| **Autenticación** | 6 | 3 | 67% |
| **Base de Datos** | 5 | 2 | 71% |
| **IA/OCR** | 10 | 0 | 100% |
| **PDFs** | 6 | 0 | 100% |
| **Billing** | 9 | 3 | 75% |
| **Clasificación** | 0 | 5 | 0% |
| **Contabilidad** | 0 | 6 | 0% |
| **TOTAL** | **51** | **23** | **69%** |

---

## 🎯 Próximos Pasos (Orden de prioridad)

1. **Clasificación GASTO/INGRESO** (1-2 días)
2. **Categorías** (1-2 días)
3. **Contabilidad básica** (2-3 días)
4. **Dashboard mejorado** (2-3 días)
5. **Informes para gestor** (2-3 días)
6. **Multi-empresa** (2-3 días)
7. **Stripe** (2-3 días)
8. **Landing page** (2-3 días)

**Tiempo estimado para MVP**: 2-3 semanas
