import { jsPDF } from 'jspdf';

export interface PDFConfig {
  siteName: string;
  comune_provincia: string;
  activeComune: string;
  pec?: string;
  email?: string;
  tel?: string;
}

/**
 * Draws the official municipal coat of arms (stemma) using jsPDF primitives.
 */
export const drawStemma = (doc: jsPDF, x: number, y: number) => {
  doc.setDrawColor(30, 58, 95); 
  doc.setLineWidth(0.8);
  doc.setFillColor(248, 250, 252); 
  
  // Base shield
  doc.rect(x, y + 6, 14, 12, 'FD');
  doc.ellipse(x + 7, y + 18, 7, 5, 'FD'); 

  // Crown
  doc.setFillColor(217, 119, 6); 
  doc.rect(x + 1, y + 2, 12, 3, 'F');
  doc.rect(x + 1, y, 2, 2, 'F');
  doc.rect(x + 5, y, 2, 2, 'F');
  doc.rect(x + 9, y, 2, 2, 'F');
  doc.rect(x + 11, y, 2, 2, 'F');

  // Decorative lines inside
  doc.setDrawColor(59, 130, 246); 
  doc.line(x + 3, y + 11, x + 11, y + 11);
  doc.line(x + 2, y + 14, x + 12, y + 14);
  doc.line(x + 4, y + 17, x + 10, y + 17);
};

/**
 * Draws the standard institutional header used in all official documents.
 */
export const drawInstitutionalHeader = (
  doc: jsPDF, 
  config: PDFConfig, 
  protocolInfo?: { 
    title: string; 
    code: string; 
    date?: string; 
    status?: string 
  }
) => {
  drawStemma(doc, 20, 9);

  doc.setTextColor(30, 58, 95); 
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  
  const nomeEnte = config.siteName.toUpperCase();
  const cleanEnteName = nomeEnte.startsWith("COMUNE DI") 
    ? nomeEnte.replace("COMUNE DI ", "CITTÀ DI ") 
    : `CITTÀ DI ${config.activeComune.toUpperCase()}`;
  doc.text(cleanEnteName, 40, 19);
  
  doc.setTextColor(100, 116, 139); 
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Provincia di ${config.comune_provincia || 'Agrigento'}`, 40, 23);
  
  doc.setTextColor(71, 85, 105); 
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SETTORE VIGILANZA E SANITÀ ANIMALE", 40, 28);
  
  doc.setTextColor(148, 163, 184); 
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Ufficio Tutela Ambientale e Gestione Territoriale del Randagismo", 40, 32);

  if (protocolInfo) {
    doc.setFillColor(241, 245, 249); 
    doc.rect(130, 12, 60, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(130, 12, 60, 22, 'D');

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(protocolInfo.title.toUpperCase(), 133, 17);
    
    doc.setTextColor(15, 23, 42); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(protocolInfo.code.length > 15 ? 8 : 10);
    doc.text(protocolInfo.code, 133, 23);
    
    if (protocolInfo.status || protocolInfo.date) {
      doc.setTextColor(100, 116, 139); 
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      if (protocolInfo.status) {
          doc.setTextColor(15, 118, 110);
          doc.text(protocolInfo.status.toUpperCase(), 133, 29);
      } else if (protocolInfo.date) {
          doc.text(`DATA: ${protocolInfo.date}`, 133, 29);
      }
    }
  }

  // Main separator
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(1.5);
  doc.line(20, 39, 190, 39);
};

/**
 * Draws the institutional footer with PEC and legal references.
 */
export const drawInstitutionalFooter = (doc: jsPDF, config: PDFConfig) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 20, 190, pageHeight - 20);
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    
    const footerText = `Documento informatico sottoscritto digitalmente ai sensi del D.Lgs. n. 82/2005. ${config.siteName} - Servizio Benessere Animale. PEC: ${config.pec || 'protocollo@pec.comune.it'}`;
    doc.text(footerText, 105, pageHeight - 15, { align: 'center' });
};

/**
 * Helper to add a colored section title to the document.
 */
export const addPdfSection = (doc: jsPDF, title: string, y: number) => {
  doc.setFillColor(30, 58, 95);
  doc.rect(20, y - 4, 170, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), 23, y);
  return y + 2; // Returns next Y coordinate
};

/**
 * Helper to add a two-column grid row.
 */
export const addPdfGridRow = (
  doc: jsPDF, 
  label1: string, value1: string, 
  label2: string, value2: string, 
  y: number
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(115, 115, 115);
  doc.text(label1.toUpperCase(), 22, y);
  doc.text(label2.toUpperCase(), 107, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 95);
  doc.text(value1, 22, y + 5);
  doc.text(value2, 107, y + 5);
  
  return y + 12; // Returns next Y coordinate
};
