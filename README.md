# 📄 FacturApp - Gestión Inteligente de Facturas

App de facturación completa con OCR inteligente. Sube fotos de facturas y extrae datos automáticamente.

## ✨ Características

### 📸 OCR Inteligente
- **Tesseract.js** - OCR local, sin internet, gratis
- **API Externa** - OpenAI, Google Gemini, HuggingFace (máxima precisión)
- **Ollama** - IA local con GPU (gratis, privado)
- **IA Nativa** - Nuestro servicio integrado (premium)

### 📋 Gestión de Facturas
- Subida masiva (hasta 30 facturas a la vez)
- Extracción automática de datos (fecha, emisor, NIF, importes, IVA)
- Ordenación automática por fecha
- Edición inline de datos extraídos
- Estados: Emitida, Pendiente, Pagada, Vencida

### 📊 Dashboard
- Resumen de ingresos mensuales
- Gráfico de gastos por categoría
- Facturas pendientes de cobro
- Estadísticas en tiempo real

### 📑 Generación de PDF
- Facturas individuales profesionales
- Informes mensuales
- Informes trimestrales (Modelo 303)
- Informes anuales
- Libro contable completo
- Resumen fiscal (IVA repercutido vs soportado)

### 💾 Almacenamiento
- **IndexedDB** - Almacenamiento local en el navegador
- **Exportar/Importar JSON** - Backup completo
- **Google Sheets** - Sincronización opcional (próximamente)

### 📧 Envío de Facturas
- **Mailto** - Abre cliente de correo
- **SMTP** - Envío directo desde la app
- **SendGrid** - Servicio profesional

### 🔐 Multi-usuario
- Login simple con roles (Admin/Trabajador)
- Perfiles de usuario
- Conexión multi-equipo a base de datos compartida

## 🚀 Instalación

### Opción 1: Uso directo (HTML)
1. Descarga o clona el repositorio
2. Abre `index.html` en tu navegador
3. ¡Listo! No necesitas instalar nada

### Opción 2: Servidor local
```bash
# Instalar dependencias (opcional)
npm install -g http-server

# Ejecutar
cd app-facturacion
npx http-server -p 8080

# Abrir en el navegador
open http://localhost:8080
```

### Opción 3: PWA (Instalable)
1. Abre la app en Chrome/Edge
2. Haz clic en "Instalar" en la barra de direcciones
3. La app se instala como aplicación nativa

## 📖 Uso

### Subir facturas
1. Ve a "Subir Facturas"
2. Selecciona el motor OCR (Tesseract es el más rápido)
3. Arrastra hasta 30 fotos de facturas
4. Haz clic en "Procesar todas"
5. Revisa los datos extraídos
6. Corrige cualquier error haciendo clic en las celdas
7. Haz clic en "Guardar todas"

### Generar informes
1. Ve a "Informes"
2. Selecciona el tipo de informe
3. Elige el periodo (mes, trimestre, año)
4. Haz clic en "Generar PDF"
5. El PDF se descarga automáticamente

### Exportar datos
1. Ve a "Configuración" → "Gestión de datos"
2. Exportar backup (JSON) - para guardar todos los datos
3. Importar backup - para restaurar datos

## 🔧 Configuración

### IA Externa (opcional)
Para usar IA externa (mayor precisión):
1. Ve a "Configuración" → "Configuración IA"
2. Selecciona el proveedor (OpenAI, Gemini, HuggingFace)
3. Introduce tu API key
4. Guarda la configuración

### Google Sheets (opcional)
1. Ve a "Configuración" → "Google Sheets"
2. Introduce la URL de tu Google Sheet
3. Introduce tu API key de Google
4. Haz clic en "Conectar Sheets"

### Datos de empresa
1. Ve a "Configuración" → "Datos de tu empresa"
2. Rellena todos los campos
3. Estos datos aparecerán en los PDFs generados

## 💰 Precios

### Versión Gratuita
- Tesseract.js (OCR local)
- Hasta 25 facturas/mes con IA nativa
- Todas las funciones básicas

### Versión Pro (próximamente)
- IA nativa integrada (sin configurar APIs)
- Facturas ilimitadas
- Soporte prioritario
- Multi-usuario avanzado

### Precios IA Nativa
| Plan | Facturas/mes | Precio |
|------|-------------|--------|
| Free | 25 | 0€ |
| Starter | 200 | 4.99€ |
| Pro | 1,000 | 9.99€ |
| Business | 5,000 | 24.99€ |
| Enterprise | Ilimitado | 49.99€ |

## 🛠️ Stack Técnico

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript vanilla
- **OCR**: Tesseract.js, OpenAI Vision, Google Gemini
- **Almacenamiento**: IndexedDB
- **PDF**: jsPDF + jsPDF-AutoTable
- **Gráficos**: Chart.js
- **PWA**: Service Worker

## 📁 Estructura del proyecto

```
app-facturacion/
├── index.html              # Archivo principal
├── public/
│   ├── manifest.json       # Configuración PWA
│   ├── sw.js               # Service Worker
│   └── icons/              # Iconos de la app
├── src/
│   └── js/
│       ├── app.js          # Controlador principal
│       ├── ocr/
│       │   ├── tesseract-ocr.js  # Motor OCR local
│       │   └── ai-api.js         # Motor OCR IA externa
│       ├── storage/
│       │   └── indexeddb.js      # Almacenamiento local
│       ├── pdf/
│       │   └── generator.js      # Generador de PDFs
│       └── utils/
│           └── helpers.js        # Funciones auxiliares
└── README.md
```

## 🔜 Próximas funciones

- [ ] Conexión Google Sheets
- [ ] Login multi-usuario con Firebase
- [ ] Envío de facturas por email (SMTP/SendGrid)
- [ ] Facturas recurrentes
- [ ] Multi-moneda
- [ ] Gestión de clientes
- [ ] Alertas de vencimiento
- [ ] App móvil (Tauri/Electron)
- [ ] API REST para integraciones

## 📄 Licencia

MIT License - Uso libre para personal y comercial

## 🤝 Contribuir

Las contribuciones son bienvenidas:
1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit los cambios (`git commit -m 'Add nueva funcion'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

## 📧 Contacto

- Email: [tu-email@ejemplo.com]
- GitHub: [tu-usuario]

---

**Hecho con ❤️ para autónomos y pequeñas empresas**
