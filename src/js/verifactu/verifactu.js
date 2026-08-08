/**
 * BillsnApp - Verifactu Module
 * Generates compliant invoice records for Spanish tax authority (AEAT)
 */

const Verifactu = {
    /**
     * Generate SHA-256 hash for invoice
     */
    async generateHash(previousHash, invoiceData) {
        const data = (previousHash || '') + JSON.stringify({
            number: invoiceData.invoice_number,
            date: invoiceData.date,
            issuer: invoiceData.issuer_tax_id,
            total: invoiceData.total
        });
        
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Generate QR code URL for AEAT verification
     */
    generateQRUrl(invoice) {
        const nif = invoice.company_tax_id || '';
        const number = invoice.invoice_number || '';
        const date = invoice.date ? invoice.date.replace(/-/g, '/') : '';
        const total = (invoice.total || 0).toFixed(2);
        
        return `https://www2.agenciatributaria.es/wlpl/TIKE-CONT/ValidarQR?nif=${nif}&numserie=${encodeURIComponent(number)}&fecha=${date}&importe=${total}`;
    },

    /**
     * Generate QR code as data URL
     */
    async generateQRCode(text) {
        // Simple QR code generation using canvas
        // In production, use a proper QR library
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Simple placeholder - in production use qrcode.js
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', size/2, size/2);
        ctx.fillText('(Verifactu)', size/2, size/2 + 20);
        
        return canvas.toDataURL('image/png');
    },

    /**
     * Generate Verifactu XML
     */
    generateXML(invoice, company) {
        const now = new Date().toISOString();
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<RegistroFacturacion xmlns="urn:aeat:verifactu:1.0">
    <Cabecera>
        <Version>1.0</Version>
        <Emisor>
            <Nombre>${this.escapeXml(company.name || '')}</Nombre>
            <NIF>${company.tax_id || ''}</NIF>
        </Emisor>
        <FechaHora>${now}</FechaHora>
    </Cabecera>
    <Factura>
        <Serie>${invoice.series || 'A'}</Serie>
        <Numero>${invoice.invoice_number || ''}</Numero>
        <Fecha>${invoice.date || ''}</Fecha>
        <TipoFactura>F1</TipoFactura>
        <Destinatario>
            <Nombre>${this.escapeXml(invoice.client_name || '')}</Nombre>
            <NIF>${invoice.client_tax_id || ''}</NIF>
        </Destinatario>
        <Desglose>
            <BaseImponible>${(invoice.base_amount || 0).toFixed(2)}</BaseImponible>
            <TipoImpositivo>${invoice.tax_rate || 21}</TipoImpositivo>
            <CuotaIVA>${(invoice.tax_amount || 0).toFixed(2)}</CuotaIVA>
            <Total>${(invoice.total || 0).toFixed(2)}</Total>
        </Desglose>
    </Factura>
    <Huella>${invoice.verifactu_hash || ''}</Huella>
</RegistroFacturacion>`;
    },

    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    /**
     * Process invoice for Verifactu compliance
     */
    async processInvoice(invoice, company) {
        // Get previous hash for chaining
        const previousInvoices = await SupabaseDB.getEmittedInvoices({ 
            company_id: invoice.company_id 
        });
        const previousHash = previousInvoices.length > 0 ? 
            previousInvoices[0].verifactu_hash : '';

        // Generate hash
        const hash = await this.generateHash(previousHash, invoice);

        // Generate QR URL
        const qrUrl = this.generateQRUrl({
            ...invoice,
            company_tax_id: company.tax_id
        });

        // Generate QR code
        const qrCode = await this.generateQRCode(qrUrl);

        // Generate XML
        const xml = this.generateXML(invoice, company);

        return {
            verifactu_hash: hash,
            verifactu_qr: qrCode,
            verifactu_xml: xml,
            verifactu_status: 'pending',
            verifactu_date: new Date().toISOString()
        };
    },

    /**
     * Submit to AEAT (placeholder - requires backend)
     */
    async submitToAEAT(invoiceId) {
        // In production, this would:
        // 1. Get the invoice data
        // 2. Sign with digital certificate
        // 3. Submit via SOAP to AEAT
        // 4. Handle response
        
        console.log('Verifactu submission would happen here');
        return { success: true, message: 'Submitted (simulated)' };
    },

    /**
     * Add Verifactu fields to invoice PDF
     */
    getVerifactuPDFData(invoice) {
        return {
            hash: invoice.verifactu_hash,
            qrUrl: this.generateQRUrl(invoice),
            legend: 'VERI*FACTU',
            status: invoice.verifactu_status
        };
    },

    /**
     * Validate invoice for Verifactu
     */
    validateInvoice(invoice) {
        const errors = [];
        
        if (!invoice.invoice_number) errors.push('Invoice number required');
        if (!invoice.date) errors.push('Date required');
        if (!invoice.client_name) errors.push('Client name required');
        if (!invoice.total || invoice.total <= 0) errors.push('Total must be positive');
        if (!invoice.base_amount || invoice.base_amount <= 0) errors.push('Base amount required');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

// Make globally available
window.Verifactu = Verifactu;
