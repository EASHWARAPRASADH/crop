import mammoth from 'mammoth';
import { DynamicField, PREDEFINED_FIELDS } from './dynamicFields';

// PSD import is handled dynamically to avoid build issues
let PSD: any = null;
try {
  import('psd').then(module => {
    PSD = module.default || module;
  }).catch(() => {
    // PSD library not available
  });
} catch {
  // PSD library init failed
}

export interface ImportedElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex?: number;
  properties: {
    // Text properties
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: 'left' | 'center' | 'right';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    // Image properties
    src?: string;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    // Shape properties
    shape?: 'rect' | 'circle' | 'polygon' | 'line';
    fillColor?: string;
    strokeColor?: string;
    cornerRadius?: number;
    // Effects
    shadow?: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
    filters?: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      blur?: number;
    };
    blendMode?: string;
  };
}

export interface ImportResult {
  success: boolean;
  elements: ImportedElement[];
  background?: {
    color?: string;
    image?: string;
  };
  canvas: {
    width: number;
    height: number;
  };
  errors?: string[];
  warnings?: string[];
}

// Word Document Importer
export const importWordDocument = async (file: File): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    const elements: ImportedElement[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');
    
    // Extract text elements
    const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    let yOffset = 50;
    
    textElements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && text.length > 0) {
        const computedStyle = window.getComputedStyle(element as Element);
        
        elements.push({
          id: `text_${index}`,
          type: 'text',
          x: 50,
          y: yOffset,
          width: 300,
          height: 30,
          zIndex: index,
          properties: {
            text,
            fontSize: parseInt(computedStyle.fontSize) || 16,
            fontFamily: computedStyle.fontFamily || 'Arial',
            fontWeight: computedStyle.fontWeight || 'normal',
            fontStyle: computedStyle.fontStyle || 'normal',
            textAlign: (computedStyle.textAlign as any) || 'left',
            fill: computedStyle.color || '#000000',
          },
        });
        
        yOffset += 40;
      }
    });

    // Extract images
    const images = doc.querySelectorAll('img');
    images.forEach((img, index) => {
      const src = img.getAttribute('src');
      if (src) {
        elements.push({
          id: `image_${index}`,
          type: 'image',
          x: 50,
          y: yOffset,
          width: 200,
          height: 150,
          zIndex: textElements.length + index,
          properties: {
            src,
          },
        });
        yOffset += 160;
      }
    });

    return {
      success: true,
      elements,
      canvas: {
        width: 400,
        height: Math.max(yOffset + 50, 600),
      },
      errors: result.messages.filter(m => m.type === 'error').map(m => m.message),
      warnings: result.messages.filter(m => m.type === 'warning').map(m => m.message),
    };
  } catch {
    return {
      success: false,
      elements: [],
      canvas: { width: 400, height: 600 },
      errors: ['Failed to import Word document'],
    };
  }
};

// Photoshop Document Importer
export const importPhotoshopDocument = async (file: File): Promise<ImportResult> => {
  try {
    if (!PSD) {
      return {
        success: false,
        elements: [],
        canvas: { width: 400, height: 600 },
        errors: ['PSD library not available. Please use a different file format.'],
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const psd = PSD.fromBuffer(Buffer.from(arrayBuffer));
    psd.parse();
    
    const elements: ImportedElement[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const canvasWidth = psd.tree().get('width') || 400;
    const canvasHeight = psd.tree().get('height') || 600;

    // Extract background
    const background = psd.tree().get('background');
    let backgroundElement: ImportedElement | undefined;

    if (background) {
      const imageData = background.toPng();
      if (imageData) {
        backgroundElement = {
          id: 'background',
          type: 'background',
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          zIndex: -1,
          properties: {
            src: imageData,
          },
        };
      }
    }

    // Extract layers
    const extractLayers = (node: any, parentX = 0, parentY = 0, zIndex = 0): void => {
      if (node.children) {
        node.children.forEach((child: any, index: number) => {
          const layerX = (child.get('left') || 0) + parentX;
          const layerY = (child.get('top') || 0) + parentY;
          const layerWidth = child.get('width') || 100;
          const layerHeight = child.get('height') || 100;
          const layerOpacity = (child.get('opacity') || 255) / 255;
          const layerVisible = child.get('visible') !== false;

          if (child.get('type') === 'layer' && layerVisible) {
            const imageData = child.toPng();
            if (imageData) {
              elements.push({
                id: `layer_${zIndex}_${index}`,
                type: 'image',
                x: layerX,
                y: layerY,
                width: layerWidth,
                height: layerHeight,
                opacity: layerOpacity,
                visible: layerVisible,
                zIndex: zIndex + index,
                properties: {
                  src: imageData,
                },
              });
            }
          } else if (child.children) {
            extractLayers(child, layerX, layerY, zIndex + index);
          }
        });
      }
    };

    extractLayers(psd.tree());

    return {
      success: true,
      elements: backgroundElement ? [backgroundElement, ...elements] : elements,
      background: backgroundElement ? { image: backgroundElement.properties.src } : undefined,
      canvas: {
        width: canvasWidth,
        height: canvasHeight,
      },
      errors,
      warnings,
    };
  } catch {
    return {
      success: false,
      elements: [],
      canvas: { width: 400, height: 600 },
      errors: ['Failed to import Photoshop document'],
    };
  }
};

// Image File Importer
export const importImageFile = async (file: File): Promise<ImportResult> => {
  try {
    const imageUrl = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const elements: ImportedElement[] = [];
        
        // Determine if this should be a background or element
        const isBackground = img.width > 800 || img.height > 600; // Large images as background
        
        if (isBackground) {
          elements.push({
            id: 'background_image',
            type: 'background',
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
            zIndex: -1,
            properties: {
              src: imageUrl,
            },
          });
        } else {
          elements.push({
            id: 'imported_image',
            type: 'image',
            x: 50,
            y: 50,
            width: Math.min(img.width, 300),
            height: Math.min(img.height, 300),
            zIndex: 0,
            properties: {
              src: imageUrl,
            },
          });
        }

        resolve({
          success: true,
          elements,
          background: isBackground ? { image: imageUrl } : undefined,
          canvas: {
            width: isBackground ? img.width : Math.max(img.width, 400),
            height: isBackground ? img.height : Math.max(img.height, 600),
          },
        });
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          elements: [],
          canvas: { width: 400, height: 600 },
          errors: ['Failed to load image file'],
        });
      };
      
      img.src = imageUrl;
    });
  } catch {
    return {
      success: false,
      elements: [],
      canvas: { width: 400, height: 600 },
      errors: ['Failed to import image file'],
    };
  }
};

// PDF Document Importer
export const importPDFDocument = async (file: File): Promise<ImportResult> => {
  try {
    // Dynamically import pdfjs-dist to avoid SSR issues if any
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const elements: ImportedElement[] = [];
    
    // For now, we'll import the first page as a background
    const pageNum = 1;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Use 2x scale for better quality
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    } as any).promise;

    const imageUrl = canvas.toDataURL('image/png');

    elements.push({
      id: 'pdf_background',
      type: 'background',
      x: 0,
      y: 0,
      width: viewport.width / 2.0,
      height: viewport.height / 2.0,
      zIndex: -1,
      properties: {
        src: imageUrl,
      },
    });

    return {
      success: true,
      elements,
      background: { image: imageUrl },
      canvas: {
        width: viewport.width / 2.0,
        height: viewport.height / 2.0,
      },
    };
  } catch {
    return {
      success: false,
      elements: [],
      canvas: { width: 400, height: 600 },
      errors: ['Failed to import PDF document'],
    };
  }
};

// Generic file importer that detects file type
export const importFile = async (file: File): Promise<ImportResult> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.docx')) {
    return importWordDocument(file);
  } else if (fileName.endsWith('.psd')) {
    return importPhotoshopDocument(file);
  } else if (fileName.endsWith('.pdf')) {
    return importPDFDocument(file);
  } else if (fileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)) {
    return importImageFile(file);
  } else {
    return {
      success: false,
      elements: [],
      canvas: { width: 400, height: 600 },
      errors: [`Unsupported file type: ${file.name}`],
    };
  }
};

// Convert imported elements to Konva format
export const convertToKonvaFormat = (elements: ImportedElement[]): any[] => {
  return elements.map(element => {
    const konvaElement: any = {
      id: element.id,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation || 0,
      opacity: element.opacity || 1,
      visible: element.visible !== false,
      locked: element.locked || false,
      zIndex: element.zIndex || 0,
    };

    switch (element.type) {
      case 'text':
        return {
          ...konvaElement,
          type: 'text',
          text: element.properties.text || '',
          fontSize: element.properties.fontSize || 16,
          fontFamily: element.properties.fontFamily || 'Arial',
          fontStyle: element.properties.fontStyle || 'normal',
          fontWeight: element.properties.fontWeight || 'normal',
          textAlign: element.properties.textAlign || 'left',
          fill: element.properties.fill || '#000000',
          stroke: element.properties.stroke,
          strokeWidth: element.properties.strokeWidth || 0,
        };
      
      case 'image':
        return {
          ...konvaElement,
          type: 'image',
          src: element.properties.src,
          cropX: element.properties.cropX || 0,
          cropY: element.properties.cropY || 0,
          cropWidth: element.properties.cropWidth || element.width,
          cropHeight: element.properties.cropHeight || element.height,
        };
      
      case 'shape':
        return {
          ...konvaElement,
          type: element.properties.shape || 'rect',
          fill: element.properties.fillColor || '#000000',
          stroke: element.properties.strokeColor,
          strokeWidth: element.properties.strokeWidth || 0,
          cornerRadius: element.properties.cornerRadius || 0,
        };
      
      case 'background':
        return {
          ...konvaElement,
          type: 'background',
          src: element.properties.src,
        };
      
      default:
        return konvaElement;
    }
  });
};

// Convert imported elements to Fabric format
export const convertToFabricFormat = (elements: ImportedElement[]): any[] => {
  return elements.map(element => {
    const fabricElement: any = {
      id: element.id,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      angle: element.rotation || 0,
      opacity: element.opacity || 1,
      visible: element.visible !== false,
      selectable: !element.locked,
      evented: !element.locked,
    };

    switch (element.type) {
      case 'text':
        return {
          ...fabricElement,
          type: 'text',
          text: element.properties.text || '',
          fontSize: element.properties.fontSize || 16,
          fontFamily: element.properties.fontFamily || 'Arial',
          fontStyle: element.properties.fontStyle || 'normal',
          fontWeight: element.properties.fontWeight || 'normal',
          textAlign: element.properties.textAlign || 'left',
          fill: element.properties.fill || '#000000',
          stroke: element.properties.stroke,
          strokeWidth: element.properties.strokeWidth || 0,
        };
      
      case 'image':
        return {
          ...fabricElement,
          type: 'image',
          src: element.properties.src,
          cropX: element.properties.cropX || 0,
          cropY: element.properties.cropY || 0,
          cropWidth: element.properties.cropWidth || element.width,
          cropHeight: element.properties.cropHeight || element.height,
        };
      
      case 'shape':
        return {
          ...fabricElement,
          type: element.properties.shape || 'rect',
          fill: element.properties.fillColor || '#000000',
          stroke: element.properties.strokeColor,
          strokeWidth: element.properties.strokeWidth || 0,
          rx: element.properties.cornerRadius || 0,
          ry: element.properties.cornerRadius || 0,
        };
      
      case 'background':
        return {
          ...fabricElement,
          type: 'background',
          src: element.properties.src,
        };
      
      default:
        return fabricElement;
    }
  });
};
