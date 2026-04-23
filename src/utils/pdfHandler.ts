import * as pdfjsLib from 'pdfjs-dist';

// @ts-ignore: Polyfill for Promise.withResolvers used by pdfjs-dist v5
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Use local worker via Vite URL import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Helper: convert a File to a Uint8Array (required by pdfjs-dist v5).
 * Using Uint8Array avoids the "readableStream is not a function" error
 * that occurs when passing raw ArrayBuffer to getDocument().
 */
const fileToUint8Array = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

export interface PDFMetadata {
  textItems: {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontName: string;
  }[];
  imageItems: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export const getPageMetadata = async (file: File, pageNum: number = 1): Promise<PDFMetadata> => {
  const data = await fileToUint8Array(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(pageNum);
  
  const textContent = await page.getTextContent();
  
  const textItems = textContent.items
    .filter((item: any) => item.str && item.transform && item.transform.length >= 6)
    .map((item: any) => {
      const transform = item.transform;
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
      return {
        str: item.str,
        x: transform[4],
        y: transform[5],
        width: item.width || 0,
        height: item.height || fontSize,
        fontSize,
        fontName: item.fontName,
      };
    });

  const imageItems: { x: number; y: number; width: number; height: number }[] = [];

  return { textItems, imageItems };
};

export const loadPDFPageAsImage = async (
  file: File, 
  pageNum: number = 1, 
  maskItems?: { x: number; y: number; width: number; height: number }[]
): Promise<string> => {
  const data = await fileToUint8Array(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(pageNum);
  
  const scale = 2.5;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Could not create canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context as any,
    viewport: viewport,
  }).promise;

  if (maskItems && maskItems.length > 0) {
    context.fillStyle = '#ffffff';
    maskItems.forEach(item => {
      if (item.width > 0 && item.height > 0) {
        const rect = viewport.convertToViewportRectangle([
          item.x, item.y, item.x + item.width, item.y + item.height
        ]);
        const x = Math.min(rect[0], rect[2]);
        const y = Math.min(rect[1], rect[3]);
        const w = Math.abs(rect[2] - rect[0]);
        const h = Math.abs(rect[3] - rect[1]);
        if (w < canvas.width * 0.9 && h < canvas.height * 0.9) {
          context.fillRect(x, y, w, h);
        }
      }
    });
  }

  return canvas.toDataURL('image/png');
};

export const getPDFPageCount = async (file: File): Promise<number> => {
  const data = await fileToUint8Array(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  return pdf.numPages;
};

/**
 * Load ALL pages of a PDF as an array of data URL images.
 */
export const loadAllPDFPages = async (file: File, scale: number = 2.5): Promise<string[]> => {
  const data = await fileToUint8Array(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context as any,
      viewport,
    }).promise;

    pages.push(canvas.toDataURL('image/png'));
  }

  return pages;
};

/**
 * Load a single page from a PDF ArrayBuffer (avoids re-reading the file).
 */
export const loadPDFPageFromBuffer = async (
  arrayBuffer: ArrayBuffer,
  pageNum: number = 1,
  scale: number = 2.5
): Promise<string> => {
  const data = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context as any,
    viewport,
  }).promise;

  return canvas.toDataURL('image/png');
};
