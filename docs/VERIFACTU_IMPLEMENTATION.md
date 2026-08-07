# BillSnap - Guía de Implementación Verifactu

---

## 📋 Resumen Rápido

| Pregunta | Respuesta |
|----------|-----------|
| **¿Es obligatorio?** | SÍ, para julio 2027 (autónomos), enero 2027 (empresas) |
| **¿Es gratis implementarlo?** | SÍ (código abierto) + certificado digital (~30-60€/año) |
| **¿Es difícil?** | Medio. Hay librerías que ayudan mucho |
| **¿Cuánto tarda?** | 2-4 semanas con librerías existentes |
| **¿Tenemos que hacerlo nosotros?** | Podemos usar APIs de terceros o hacerlo nosotros |

---

## 🔧 Qué necesita BillSnap para ser Verifactu

### Requisitos técnicos

| Requisito | Qué es | Dificultad | ¿Gratis? |
|-----------|--------|-----------|----------|
| **QR en factura** | Código QR con URL a AEAT | Fácil | ✅ Sí |
| **Hash SHA-256 encadenado** | Cada factura vinculada a la anterior | Media | ✅ Sí |
| **Registro de eventos** | Log de cada acción (crear, modificar, anular) | Fácil | ✅ Sí |
| **Exportación XML** | Formato estándar para AEAT | Media | ✅ Sí |
| **Firma electrónica** | Firma digital del registro | Media | ⚠️ Necesita certificado |
| **Comunicación AEAT** | Envío de registros por SOAP/API | Compleja | ✅ Sí (endpoint gratis) |
| **Almacenamiento inmutable** | Registros que no se pueden modificar | Fácil | ✅ Sí |
| **Texto "VERI*FACTU"** | Mención obligatoria en factura | Fácil | ✅ Sí |

---

## 🆓 Opciones GRATIS para implementar

### Opción 1: Librerías Open Source (GRATIS)

Hay implementaciones completas en GitHub:

| Librería | Lenguaje | Qué hace | Link |
|----------|----------|----------|------|
| **verifactu-api-python** | Python (Flask) | API completa + envío AEAT | github.com/EduardoRuizM/verifactu-api-python |
| **VeriFactu** | .NET (C#) | Paquete NuGet completo | github.com/mdiago/VeriFactu |
| **verifactu-php** | PHP | Implementación completa | github.com/esesperio/verifactu-php |
| **verifactu-rb** | Ruby | Implementación completa | github.com/mybooking-es/verifactu-rb |
| **aeat-verifactu** | Multi | Esquemas XSD oficiales | github.com/hectorsipe/aeat-verifactu |
| **Veri-factuSender** | Multi | Guía técnica + código | github.com/JoseRGWeb/Veri-factuSender |

### Opción 2: Implementar nosotros mismos (GRATIS)

Los componentes individuales son todos gratuitos:

```javascript
// 1. QR Code - Librería npm (gratis)
import QRCode from 'qrcode';

function generateVerifactuQR(invoice) {
    const url = `https://www2.agenciatributaria.es/wlpl/TIKE-CONT/ValidarQR?` +
        `nif=${invoice.issuerNIF}&` +
        `numserie=${invoice.series}/${invoice.number}&` +
        `fecha=${formatDate(invoice.date)}&` +
        `importe=${invoice.total.toFixed(2)}`;
    
    return QRCode.toDataURL(url);
}

// 2. Hash SHA-256 encadenado - Nativo del navegador (gratis)
async function generateHash(previousHash, invoiceData) {
    const data = previousHash + JSON.stringify(invoiceData);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3. Registro de eventos - IndexedDB (gratis)
async function logEvent(type, invoiceId, data) {
    await DB.saveSetting(`event_${Date.now()}`, {
        type, // 'create', 'modify', 'void', 'export'
        invoiceId,
        timestamp: new Date().toISOString(),
        data
    });
}

// 4. XML Generation - JavaScript puro (gratis)
function generateVerifactuXML(invoice, hash) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<veri:RegistroFacturacion xmlns:veri="urn:aeat:verifactu:1.0">
    <veri:Cabecera>
        <veri:Version>1.0</veri:Version>
        <veri:Emisor>
            <veri:Nombre>${invoice.issuerName}</veri:Nombre>
            <veri:NIF>${invoice.issuerNIF}</veri:NIF>
        </veri:Emisor>
    </veri:Cabecera>
    <veri:Factura>
        <veri:Serie>${invoice.series}</veri:Serie>
        <veri:Numero>${invoice.number}</veri:Numero>
        <veri:Fecha>${invoice.date}</veri:Fecha>
        <veri:TipoFactura>F1</veri:TipoFactura>
        <veri:Desglose>
            <veri:BaseImponible>${invoice.baseAmount}</veri:BaseImponible>
            <veri:TipoImpositivo>${invoice.ivaPercent}</veri:TipoImpositivo>
            <veri:CuotaIVA>${invoice.ivaAmount}</veri:CuotaIVA>
            <veri:Total>${invoice.total}</veri:Total>
        </veri:Desglose>
    </veri:Factura>
    <veri:Huella>${hash}</veri:Huella>
</veri:RegistroFacturacion>`;
}
```

### Opción 3: API de terceros (PAGA pero fácil)

| API | Precio | Tiempo integración | Ventaja |
|-----|--------|-------------------|---------|
| **BeeL.** | ~0.01-0.05€/factura | 1-3 días | Más fácil, JSON simple |
| **Verifacti** | Desde 9€/mes | 1-2 días | Todo incluido |
| **Facturware** | Por uso | 1-2 días | Java, bien documentado |
| **efsta** | Custom | 3-5 días | Para POS/retail |

---

## 💳 El Certificado Digital (ÚNICO GASTO)

Para comunicarse con la AEAT, necesitas un **certificado digital**:

| Proveedor | Precio | Para quién |
|-----------|--------|-----------|
| **FNMT** (Fábrica Nacional) | Gratis | Autónomos (presencial) |
| **Camerfirma** | ~30€/año | Empresas |
| **Safelayer** | ~40€/año | Empresas |
| **eIDAS** (europeo) | Variable | Internacional |

**Para autónomos**: El certificado de la FNMT es **GRATIS** (vas a una oficina de registro).

---

## 🏗️ Plan de Implementación para BillSnap

### Fase 1: QR + Hash (Semana 1) - FÁCIL

```javascript
// Ya implementado nativamente en el navegador
- Generar QR con la URL de AEAT
- Calcular hash SHA-256 encadenado
- Mostrar QR en la factura PDF
- Añadir texto "VERI*FACTU"
```

### Fase 2: Registro de eventos (Semana 2) - FÁCIL

```javascript
// Guardar en IndexedDB
- Log de cada factura creada
- Log de cada modificación
- Log de cada anulación
- Exportación del log
```

### Fase 3: XML + Exportación (Semana 3) - MEDIA

```javascript
- Generar XML según esquema AEAT
- Exportar registros en XML
- Validar contra XSD oficial
```

### Fase 4: Comunicación AEAT (Semana 4) - COMPLEJA

```javascript
- Integrar certificado digital
- Comunicación SOAP con AEAT
- Envío de registros
- Recepción de confirmaciones
```

---

## 💡 Recomendación

### Para empezar RÁPIDO y BARATO:

```
1. Implementar QR + Hash nosotros (gratis, 1 semana)
2. Usar librería open source para XML (gratis)
3. El certificado digital lo pone el usuario (gratis para autónomos)
4. Comunicación AEAT al final (puede ser vía API de terceros)
```

### Para empezar FÁCIL pero con coste:

```
1. Usar API de BeeL. o Verifacti (~0.01-0.05€/factura)
2. Nosotros solo generamos la factura
3. La API se encarga de todo lo Verifactu
4. Incluir ese coste en el precio del plan Pro/Business
```

---

## 📊 Comparativa de esfuerzo

| Componente | Nosotros (gratis) | API terceros (pagar) |
|-----------|-------------------|---------------------|
| QR | 1 día | Automático |
| Hash | 1 día | Automático |
| Eventos | 2 días | Automático |
| XML | 3 días | Automático |
| Certificado | Usuario lo gestiona | API lo gestiona |
| Envío AEAT | 1 semana | Automático |
| **TOTAL** | **2-3 semanas** | **1-3 días** |
| **Coste** | **0€** (nuestro tiempo) | **~0.01-0.05€/factura** |

---

## ✅ Checklist de Implementación

### Paso 1: Componentes básicos (GRATIS)
- [ ] Generar QR con URL AEAT (`npm install qrcode`)
- [ ] Hash SHA-256 encadenado (`crypto.subtle.digest`)
- [ ] Texto "VERI*FACTU" en factura
- [ ] Registro de eventos en IndexedDB
- [ ] Exportación JSON de eventos

### Paso 2: XML y exportación (GRATIS)
- [ ] Generar XML según esquema AEAT
- [ ] Validar XML contra XSD oficial
- [ ] Exportar XML para AEAT
- [ ] Almacenamiento inmutable

### Paso 3: Certificado digital (30-60€/año o gratis FNMT)
- [ ] Documentar cómo obtener certificado
- [ ] Implementar carga de certificado en app
- [ ] Firma XMLDSig

### Paso 4: Comunicación AEAT (gratis o API de pago)
- [ ] Opción A: SOAP directo con AEAT (gratis, complejo)
- [ ] Opción B: API BeeL./Verifacti (~0.01-0.05€/factura)
- [ ] Recepción de confirmaciones
- [ ] Gestión de errores/rechazos

### Paso 5: Declaración responsable
- [ ] Redactar declaración responsable
- [ ] Registrar como proveedor de software
- [ ] Incluir en documentación

---

## 🎯 Conclusión

| Aspecto | Veredicto |
|---------|-----------|
| **¿Es gratis?** | SÍ, casi todo. Solo el certificado digital cuesta (y para autónomos es gratis) |
| **¿Es difícil?** | No. Hay librerías open source que hacen el trabajo pesado |
| **¿Cuánto tarda?** | 2-4 semanas para implementación completa |
| **¿Merece la pena?** | SÍ. Es OBLIGATORIO y nos diferencia de la competencia |
| **¿Podemos cobrar más por ello?** | SÍ. Verifactu justifica el plan Pro/Business |

---

## 📚 Recursos

| Recurso | URL |
|---------|-----|
| Wiki comunitaria Verifactu | verifactu-aeat.github.io |
| Esquemas XSD oficiales | github.com/hectorsipe/aeat-verifactu |
| Implementación Python | github.com/EduardoRuizM/verifactu-api-python |
| Guía técnica | github.com/JoseRGWeb/Veri-factuSender |
| API BeeL. (para integrar) | docs.beel.es |
| API Verifacti | verifacti.com |
| Sede electrónica AEAT | sede.agenciatributaria.gob.es |
