/**
 * FacturApp - PDF Generator
 * Generates invoices, reports, and accounting documents
 */

const PDFGenerator = {
    /**
     * Get company data from settings
     */
    async getCompanyData() {
        return {
            name: await DB.getSetting('company_name') || 'Mi Empresa S.L.',
            nif: await DB.getSetting('company_nif') || 'B-12345678',
            address: await DB.getSetting('company_address') || 'Dirección no configurada',
            email: await DB.getSetting('company_email') || '',
            phone: await DB.getSetting('company_phone') || ''
        };
    },

    /**
     * Create a new PDF document with common styles
     */
    createDocument() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set default font
        doc.setFont('helvetica');
        
        return doc;
    },

    /**
     * Add header to PDF
     */
    addHeader(doc, company, title = 'Factura') {
        // Company name
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235); // Primary blue
        doc.text(company.name, 20, 25);

        // Company details
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`NIF/CIF: ${company.nif}`, 20, 32);
        doc.text(company.address, 20, 37);
        if (company.email) doc.text(`Email: ${company.email}`, 20, 42);
        if (company.phone) doc.text(`Tel: ${company.phone}`, 20, 47);

        // Title
        doc.setFontSize(16);
        doc.setTextColor(30, 30, 30);
        doc.text(title, 150, 25);

        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 52, 190, 52);

        return 57; // Return Y position after header
    },

    /**
     * Generate individual invoice PDF
     */
    async generateInvoicePDF(invoiceId) {
        const invoice = await DB.getInvoice(invoiceId);
        if (!invoice) throw new Error('Factura no encontrada');

        const company = await this.getCompanyData();
        const doc = this.createDocument();

        let y = this.addHeader(doc, company, 'FACTURA');

        // Invoice number and date
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(`Factura Nº: ${invoice.invoiceNumber || 'Sin número'}`, 20, y);
        doc.text(`Fecha: ${Helpers.formatDate(invoice.date)}`, 130, y);
        if (invoice.dueDate) {
            doc.text(`Vencimiento: ${Helpers.formatDate(invoice.dueDate)}`, 130, y + 6);
        }
        y += 15;

        // Client/Receiver info
        if (invoice.receiver && invoice.receiver.name) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, y, 80, 25, 'F');
            
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('FACTURAR A:', 22, y + 5);
            
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(invoice.receiver.name || '', 22, y + 12);
            if (invoice.receiver.nif) {
                doc.text(`NIF: ${invoice.receiver.nif}`, 22, y + 18);
            }
            y += 30;
        }

        // Invoice items table
        y += 5;
        
        const tableData = [];
        
        if (invoice.description) {
            tableData.push([
                invoice.description,
                '1',
                Helpers.formatCurrency(invoice.baseAmount),
                `${invoice.ivaPercent}%`,
                Helpers.formatCurrency(invoice.baseAmount)
            ]);
        }

        // Add table using autoTable plugin
        doc.autoTable({
            startY: y,
            head: [['Concepto', 'Cantidad', 'Precio Unit.', 'IVA', 'Total']],
            body: tableData.length > 0 ? tableData : [
                ['Sin concepto especificado', '1', Helpers.formatCurrency(invoice.baseAmount), `${invoice.ivaPercent}%`, Helpers.formatCurrency(invoice.baseAmount)]
            ],
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 30, halign: 'right' }
            }
        });

        y = doc.lastAutoTable.finalY + 10;

        // Totals
        const totalsX = 130;
        
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        
        doc.text('Base imponible:', totalsX, y);
        doc.text(Helpers.formatCurrency(invoice.baseAmount), 185, y, { align: 'right' });
        y += 6;

        doc.text(`IVA (${invoice.ivaPercent}%):`, totalsX, y);
        doc.text(Helpers.formatCurrency(invoice.ivaAmount), 185, y, { align: 'right' });
        y += 6;

        if (invoice.irpfPercent > 0) {
            doc.text(`IRPF (-${invoice.irpfPercent}%):`, totalsX, y);
            doc.text(`-${Helpers.formatCurrency(invoice.irpfAmount)}`, 185, y, { align: 'right' });
            y += 6;
        }

        // Total line
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line(totalsX, y, 190, y);
        y += 6;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', totalsX, y);
        doc.text(Helpers.formatCurrency(invoice.total), 185, y, { align: 'right' });
        y += 15;

        // Payment info
        if (invoice.paymentMethod || invoice.iban) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            
            if (invoice.paymentMethod) {
                doc.text(`Forma de pago: ${invoice.paymentMethod}`, 20, y);
                y += 5;
            }
            if (invoice.iban) {
                doc.text(`IBAN: ${invoice.iban}`, 20, y);
                y += 5;
            }
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Documento generado por FacturApp', 105, 285, { align: 'center' });

        return doc;
    },

    /**
     * Generate monthly report
     */
    async generateMonthlyReport(year, month) {
        const invoices = await DB.getInvoicesByMonth(year, month);
        const company = await this.getCompanyData();
        const doc = this.createDocument();

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        let y = this.addHeader(doc, company, `Informe Mensual - ${monthNames[parseInt(month) - 1]} ${year}`);

        // Summary
        const totalBase = invoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalIVA = invoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
        const totalIRPF = invoices.reduce((sum, inv) => sum + (inv.irpfAmount || 0), 0);
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

        doc.setFillColor(245, 245, 245);
        doc.rect(20, y, 170, 25, 'F');

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(`Total facturas: ${invoices.length}`, 25, y + 8);
        doc.text(`Base imponible: ${Helpers.formatCurrency(totalBase)}`, 25, y + 16);
        doc.text(`IVA total: ${Helpers.formatCurrency(totalIVA)}`, 110, y + 8);
        doc.text(`TOTAL: ${Helpers.formatCurrency(totalAmount)}`, 110, y + 16);

        y += 30;

        // Invoices table
        const tableData = invoices.map(inv => [
            Helpers.formatDate(inv.date),
            inv.invoiceNumber || '-',
            (inv.issuer?.name || '-').substring(0, 25),
            Helpers.formatCurrency(inv.baseAmount),
            Helpers.formatCurrency(inv.ivaAmount),
            Helpers.formatCurrency(inv.total)
        ]);

        doc.autoTable({
            startY: y,
            head: [['Fecha', 'Nº Factura', 'Emisor', 'Base', 'IVA', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 7
            },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 30 },
                2: { cellWidth: 50 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' }
            }
        });

        return doc;
    },

    /**
     * Generate quarterly report
     */
    async generateQuarterlyReport(year, quarter) {
        const invoices = await DB.getInvoicesByQuarter(year, quarter);
        const company = await this.getCompanyData();
        const doc = this.createDocument();

        let y = this.addHeader(doc, company, `Informe Trimestral - Q${quarter} ${year}`);

        // Summary by month
        const months = Helpers.getQuarterMonths(quarter);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        const summaryData = [];
        let totalBase = 0, totalIVA = 0, totalIRPF = 0, totalAmount = 0;

        for (const month of months) {
            const monthInvoices = invoices.filter(inv => inv.date && inv.date.substring(5, 7) === month);
            const mBase = monthInvoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
            const mIVA = monthInvoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
            const mIRPF = monthInvoices.reduce((sum, inv) => sum + (inv.irpfAmount || 0), 0);
            const mTotal = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

            totalBase += mBase;
            totalIVA += mIVA;
            totalIRPF += mIRPF;
            totalAmount += mTotal;

            summaryData.push([
                monthNames[parseInt(month) - 1],
                monthInvoices.length.toString(),
                Helpers.formatCurrency(mBase),
                Helpers.formatCurrency(mIVA),
                Helpers.formatCurrency(mTotal)
            ]);
        }

        // Add totals row
        summaryData.push([
            'TOTAL',
            invoices.length.toString(),
            Helpers.formatCurrency(totalBase),
            Helpers.formatCurrency(totalIVA),
            Helpers.formatCurrency(totalAmount)
        ]);

        doc.autoTable({
            startY: y,
            head: [['Mes', 'Facturas', 'Base Imponible', 'IVA', 'Total']],
            body: summaryData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255
            },
            bodyStyles: {
                fontSize: 9
            },
            footStyles: {
                fillColor: [240, 240, 240],
                fontStyle: 'bold'
            }
        });

        y = doc.lastAutoTable.finalY + 10;

        // Tax summary (Modelo 303 info)
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Resumen para Liquidación de IVA (Modelo 303)', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`IVA Repercutido (cobrado): ${Helpers.formatCurrency(totalIVA)}`, 25, y);
        doc.text(`Base imponible total: ${Helpers.formatCurrency(totalBase)}`, 25, y + 7);
        doc.text(`Retenciones IRPF: ${Helpers.formatCurrency(totalIRPF)}`, 25, y + 14);

        return doc;
    },

    /**
     * Generate annual report
     */
    async generateAnnualReport(year) {
        const invoices = await DB.getInvoicesByYear(year);
        const company = await this.getCompanyData();
        const doc = this.createDocument();

        let y = this.addHeader(doc, company, `Informe Anual ${year}`);

        // Annual summary
        const totalBase = invoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalIVA = invoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
        const totalIRPF = invoices.reduce((sum, inv) => sum + (inv.irpfAmount || 0), 0);
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

        // Summary cards
        const cards = [
            { label: 'Total Facturas', value: invoices.length.toString() },
            { label: 'Base Imponible', value: Helpers.formatCurrency(totalBase) },
            { label: 'Total IVA', value: Helpers.formatCurrency(totalIVA) },
            { label: 'Total IRPF', value: Helpers.formatCurrency(totalIRPF) },
            { label: 'TOTAL', value: Helpers.formatCurrency(totalAmount) }
        ];

        doc.setFillColor(37, 99, 235);
        doc.rect(20, y, 170, 20, 'F');

        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        
        let cardX = 25;
        for (const card of cards) {
            doc.text(card.label, cardX, y + 7);
            doc.setFontSize(12);
            doc.text(card.value, cardX, y + 15);
            doc.setFontSize(10);
            cardX += 35;
        }
        y += 25;

        // Monthly breakdown
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Desglose Mensual', 20, y);
        y += 8;

        const monthly = await DB.getMonthlyStats(year);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        const monthlyData = monthNames.map((name, i) => {
            const month = (i + 1).toString().padStart(2, '0');
            const stats = monthly[month] || { count: 0, base: 0, iva: 0, total: 0 };
            return [
                name,
                stats.count.toString(),
                Helpers.formatCurrency(stats.base),
                Helpers.formatCurrency(stats.iva),
                Helpers.formatCurrency(stats.total)
            ];
        });

        doc.autoTable({
            startY: y,
            head: [['Mes', 'Facturas', 'Base', 'IVA', 'Total']],
            body: monthlyData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            }
        });

        // Top issuers
        y = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Principales Emisores', 20, y);
        y += 8;

        const categories = await DB.getCategoryStats(year);
        const issuerData = Object.entries(categories)
            .slice(0, 10)
            .map(([name, amount]) => [
                name.substring(0, 40),
                Helpers.formatCurrency(amount)
            ]);

        if (issuerData.length > 0) {
            doc.autoTable({
                startY: y,
                head: [['Emisor', 'Total']],
                body: issuerData,
                theme: 'grid',
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255
                },
                bodyStyles: {
                    fontSize: 8
                }
            });
        }

        return doc;
    },

    /**
     * Generate accounting book
     */
    async generateAccountingBook(year) {
        const invoices = await DB.getInvoicesByYear(year);
        const company = await this.getCompanyData();
        const doc = this.createDocument();

        let y = this.addHeader(doc, company, `Libro Contable ${year}`);

        // Full invoice list with all details
        const tableData = invoices.map(inv => [
            Helpers.formatDate(inv.date),
            inv.invoiceNumber || '-',
            (inv.issuer?.name || '-').substring(0, 20),
            inv.issuer?.nif || '-',
            (inv.description || '-').substring(0, 25),
            Helpers.formatCurrency(inv.baseAmount),
            `${inv.ivaPercent}%`,
            Helpers.formatCurrency(inv.ivaAmount),
            Helpers.formatCurrency(inv.total)
        ]);

        doc.autoTable({
            startY: y,
            head: [['Fecha', 'Nº', 'Emisor', 'NIF', 'Concepto', 'Base', 'IVA%', 'IVA', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontSize: 7
            },
            bodyStyles: {
                fontSize: 6
            },
            columnStyles: {
                0: { cellWidth: 18 },
                1: { cellWidth: 22 },
                2: { cellWidth: 30 },
                3: { cellWidth: 18 },
                4: { cellWidth: 35 },
                5: { cellWidth: 20, halign: 'right' },
                6: { cellWidth: 12, halign: 'center' },
                7: { cellWidth: 18, halign: 'right' },
                8: { cellWidth: 22, halign: 'right' }
            }
        });

        return doc;
    },

    /**
     * Generate tax summary report
     */
    async generateTaxReport(year) {
        const invoices = await DB.getInvoicesByYear(year);
        const company = await this.getCompanyData();
        const doc = this.createDocument();

        let y = this.addHeader(doc, company, `Resumen Fiscal ${year}`);

        const totalBase = invoices.reduce((sum, inv) => sum + (inv.baseAmount || 0), 0);
        const totalIVA = invoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);
        const totalIRPF = invoices.reduce((sum, inv) => sum + (inv.irpfAmount || 0), 0);

        // Tax summary
        doc.setFillColor(245, 245, 245);
        doc.rect(20, y, 170, 40, 'F');

        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text('Resumen de Impuestos', 25, y + 8);

        doc.setFontSize(10);
        doc.text(`Base imponible total: ${Helpers.formatCurrency(totalBase)}`, 25, y + 18);
        doc.text(`IVA repercutido: ${Helpers.formatCurrency(totalIVA)}`, 25, y + 25);
        doc.text(`IRPF retenido: ${Helpers.formatCurrency(totalIRPF)}`, 25, y + 32);
        doc.text(`Total facturas: ${invoices.length}`, 120, y + 18);

        y += 45;

        // IVA breakdown by percentage
        doc.setFontSize(12);
        doc.text('Desglose por Tipo de IVA', 20, y);
        y += 8;

        const ivaBreakdown = {};
        invoices.forEach(inv => {
            const key = `${inv.ivaPercent || 21}%`;
            if (!ivaBreakdown[key]) {
                ivaBreakdown[key] = { base: 0, iva: 0, count: 0 };
            }
            ivaBreakdown[key].base += inv.baseAmount || 0;
            ivaBreakdown[key].iva += inv.ivaAmount || 0;
            ivaBreakdown[key].count++;
        });

        const ivaData = Object.entries(ivaBreakdown).map(([key, val]) => [
            key,
            val.count.toString(),
            Helpers.formatCurrency(val.base),
            Helpers.formatCurrency(val.iva)
        ]);

        doc.autoTable({
            startY: y,
            head: [['Tipo IVA', 'Facturas', 'Base Imponible', 'Cuota IVA']],
            body: ivaData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255
            }
        });

        return doc;
    },

    /**
     * Download PDF
     */
    downloadPDF(doc, filename) {
        doc.save(filename);
    },

    /**
     * Generate and download invoice PDF
     */
    async downloadInvoice(invoiceId) {
        const invoice = await DB.getInvoice(invoiceId);
        const doc = await this.generateInvoicePDF(invoiceId);
        const filename = `Factura_${invoice.invoiceNumber || invoiceId}.pdf`;
        this.downloadPDF(doc, filename);
    },

    /**
     * Generate and download monthly report
     */
    async downloadMonthlyReport(year, month) {
        const doc = await this.generateMonthlyReport(year, month);
        this.downloadPDF(doc, `Informe_Mensual_${year}_${month}.pdf`);
    },

    /**
     * Generate and download quarterly report
     */
    async downloadQuarterlyReport(year, quarter) {
        const doc = await this.generateQuarterlyReport(year, quarter);
        this.downloadPDF(doc, `Informe_Trimestral_Q${quarter}_${year}.pdf`);
    },

    /**
     * Generate and download annual report
     */
    async downloadAnnualReport(year) {
        const doc = await this.generateAnnualReport(year);
        this.downloadPDF(doc, `Informe_Anual_${year}.pdf`);
    },

    /**
     * Generate and download accounting book
     */
    async downloadAccountingBook(year) {
        const doc = await this.generateAccountingBook(year);
        this.downloadPDF(doc, `Libro_Contable_${year}.pdf`);
    },

    /**
     * Generate and download tax report
     */
    async downloadTaxReport(year) {
        const doc = await this.generateTaxReport(year);
        this.downloadPDF(doc, `Resumen_Fiscal_${year}.pdf`);
    }
};

// Make globally available
window.PDFGenerator = PDFGenerator;
