import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

export const exportCanvasToPDF = async (imageDataUrl: string, width: number, height: number, filename: string = 'final.pdf') => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
  const pngImage = await pdfDoc.embedPng(imageBytes);

  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });

  const pdfBytes = await pdfDoc.save();
  // Using 'as any' to bypass the SharedArrayBuffer vs ArrayBuffer conflict in strict environments
  saveAs(new Blob([pdfBytes as any], { type: 'application/pdf' }), filename);
};

/**
 * Export multiple canvas page images into a single multi-page PDF.
 */
export const exportMultiPagePDF = async (
  pages: { dataUrl: string; width: number; height: number }[],
  filename: string = 'edited.pdf'
) => {
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([page.width, page.height]);
    const imageBytes = await fetch(page.dataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(imageBytes);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: page.width,
      height: page.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  saveAs(new Blob([pdfBytes as any], { type: 'application/pdf' }), filename);
};

export const bulkExportPDF = async (templateImage: string, records: any[], renderRecordFn: (record: any) => Promise<string>, width: number, height: number) => {
  const pdfDoc = await PDFDocument.create();
  
  for (const record of records) {
    const pageImage = await renderRecordFn(record);
    const page = pdfDoc.addPage([width, height]);
    const imageBytes = await fetch(pageImage).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(imageBytes);
    
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  saveAs(new Blob([pdfBytes as any], { type: 'application/pdf' }), 'bulk_export.pdf');
};
