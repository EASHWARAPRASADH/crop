import { Group, Rect, Text, Image, Transformer, Circle, RegularPolygon, Line, Shape, Path } from 'react-konva';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { AVAILABLE_SHAPES } from '../../data/shapes';
import { useCanvasImage } from '../../hooks/useCanvasImage';
import { getBatchImage, batchImageStore } from '../../utils/batchImageStore';
import { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { formatIfDate } from '../../utils/dateUtils';

const cardSizes: Record<string, { width: number; height: number }> = {
  '86x54': { width: 244, height: 153 },
  '100x70': { width: 283, height: 198 },
  '54x86': { width: 153, height: 244 },
  '70x100': { width: 198, height: 283 },
};

const getKonvaFill = (fill: string, width: number, height: number) => {
  if (!fill) return { fill: '#ffffff' };
  if (typeof fill === 'string' && fill.includes('linear-gradient')) {
    const colors = fill.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
    if (colors && colors.length >= 2) {
      return {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: width, y: height },
        fillLinearGradientColorStops: [0, colors[0], 1, colors[colors.length - 1]],
      };
    }
  }
  return { fill };
};

function CanvasElement({ 
  element, onDragEnd, onTransformEnd, onClick, onDblClick, 
  isSelected, isReviewStep, record, mapping, isMappingStep, 
  onMappingClick, onGuidesChange, cardSize, recordIndex 
}: {
  element: any;
  onDragEnd: (id: string, pos: { x: number; y: number }) => void;
  onTransformEnd: (id: string, attrs: any) => void;
  onClick: (id: string, e: any) => void;
  onDblClick?: (id: string, e: any) => void;
  isSelected?: boolean;
  isReviewStep?: boolean;
  record?: any;
  mapping?: Record<string, string>;
  isMappingStep?: boolean;
  onMappingClick?: (id: string, sideName: string, e: any) => void;
  onGuidesChange?: (guides: {type: 'vertical'|'horizontal', pos: number}[]) => void;
  cardSize?: {width: number, height: number};
  recordIndex?: number;
}) {
  const mappedKey = mapping?.[element.id];
  const rawDynamicValue = (record && mappedKey) ? record[mappedKey] : null;
  const dynamicValue = formatIfDate(rawDynamicValue);
  const storeDatasetImages = useConfiguratorStore(state => state.design.idCard.bulkWorkflow.datasetImages);
  const imageMatchColumn = useConfiguratorStore(state => state.design.idCard.bulkWorkflow.imageMatchColumn);

  const [generatedSrc, setGeneratedSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const value = (dynamicValue !== undefined && dynamicValue !== null) ? String(dynamicValue).trim() : (element.content || '');
    
    if (element.type === 'qr') {
      let val = value || 'QR';
      
      if (element.qrMode === 'dummy') {
        val = element.qrDummyText || 'DUMMY-QR';
      } else if (element.qrMode === 'full_row' && record) {
        if (element.qrFullRowFormat === 'json') {
          val = JSON.stringify(record);
        } else if (element.qrFullRowFormat === 'csv') {
          val = Object.values(record).join(',');
        } else {
          // Default text format: Field: Value
          val = Object.entries(record)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');
        }
      }

      // Use 2x resolution for better scannability (Standard margin is 4)
      QRCode.toDataURL(val, { 
        margin: 4, 
        width: (element.width || 100) * 2, 
        color: { 
          dark: element.fill || '#000000', 
          light: '#ffffff' // Solid white background for contrast
        } 
      })
        .then(url => { if (active) setGeneratedSrc(url); })
        .catch(() => {});
    } else if (element.type === 'barcode') {
      let val = value || '123456789';
      
      if (element.barcodeMode === 'series') {
        const start = element.barcodeSeriesStart || 1001;
        const currentNum = start + (recordIndex || 0);
        val = `${element.barcodeSeriesPrefix || ''}${currentNum}${element.barcodeSeriesSuffix || ''}`;
      }

      try {
        const canvas = document.createElement('canvas');
        // Increase bar width and height for 2x resolution feel, plus solid background and margin
        JsBarcode(canvas, val, { 
          displayValue: false, 
          margin: 10, 
          width: 4, // doubled bar width
          height: (element.height || 40) * 2,
          lineColor: element.fill || '#000000', 
          background: '#ffffff' // Solid white background
        });
        if (active) setGeneratedSrc(canvas.toDataURL());
      } catch (e) {
        // Silently fail for invalid barcode formats until they type a valid one
      }
    }
    return () => { active = false; };
  }, [element.type, dynamicValue, element.content, element.width, element.height, element.fill, element.barcodeMode, element.barcodeSeriesStart, element.barcodeSeriesPrefix, element.barcodeSeriesSuffix, recordIndex]);

  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSIzIj48L2NpcmNsZT48cGF0aCBkPSJNMjEgMTVsLTUtNWwtNiA2Ij48L3BhdGg+PC9zdmc+';
  const dynString = dynamicValue?.toString()?.trim() || '';
  
  // Image lookup: checks both the Zustand store and module-level batchImageStore
  const findImageUrl = (rawKey: string | undefined | null): string | undefined => {
    if (!rawKey) return undefined;
    const trimmed = rawKey.toString().trim();
    if (!trimmed) return undefined;
    
    // Core check function
    const checkKey = (k: string): string | undefined => {
      // 1. Check Zustand store first
      if (storeDatasetImages) {
        if (storeDatasetImages[k]) return storeDatasetImages[k];
        // Case-insensitive fallback
        const lower = k.toLowerCase();
        for (const imgKey of Object.keys(storeDatasetImages)) {
          if (imgKey.toLowerCase() === lower) return storeDatasetImages[imgKey];
        }
      }
      
      // 2. Check module-level batch image store
      const batchUrl = getBatchImage(k);
      if (batchUrl) return batchUrl;
      
      return undefined;
    };

    // Advanced check: extract number and check against all images
    const checkNumberOnly = (numStr: string): string | undefined => {
       if (!numStr) return undefined;
       if (storeDatasetImages) {
           for (const imgKey of Object.keys(storeDatasetImages)) {
               if (imgKey.replace(/\D/g, '') === numStr) return storeDatasetImages[imgKey];
           }
       }
       for (const imgKey of Object.keys(batchImageStore)) {
           if (imgKey.replace(/\D/g, '') === numStr) return batchImageStore[imgKey];
       }
       return undefined;
    };

    // Try exact value first
    let found = checkKey(trimmed);
    if (found) return found;

    // If Excel contained "183411.JPG", strip extension and try again
    const extIdx = trimmed.lastIndexOf('.');
    if (extIdx > 0) {
      const baseKey = trimmed.substring(0, extIdx).trim();
      if (baseKey !== trimmed) {
        found = checkKey(baseKey);
        if (found) return found;
      }
    }

    // Try numeric-only mapping
    // If dataset says "file photo no:183411.JPG", extracts "183411"
    const numOnly = trimmed.replace(/\D/g, '');
    if (numOnly && numOnly.length > 0) {
        found = checkNumberOnly(numOnly);
        if (found) return found;
    }

    return undefined;
  };

  let imageSrc: string | null = element.src || null;
  
  if ((element.type === 'image' || element.type === 'frame' || element.type === 'line') && mappedKey && record) {
    // Priority: Dynamic lookup from dataset
    let dynamicSrc: string | null = null;

    // Strategy 1: Use the global imageMatchColumn
    if (imageMatchColumn) {
      const matchVal = record[imageMatchColumn];
      if (matchVal !== undefined && matchVal !== null) {
        const matchKey = String(matchVal).trim();
        dynamicSrc = findImageUrl(matchKey) || null;
      }
    }
    
    // Strategy 2: Use the element's own mapped column
    if (!dynamicSrc) {
      const directVal = record[mappedKey];
      if (directVal !== undefined && directVal !== null) {
        const directKey = String(directVal).trim();
        dynamicSrc = findImageUrl(directKey) || null;
      }
    }
    
    // Strategy 3: Check if the value itself is a URL
    if (!dynamicSrc && dynString) {
      if (dynString.startsWith('http')) {
        dynamicSrc = dynString;
      } else {
        dynamicSrc = findImageUrl(dynString) || null;
      }
    }

    // Only override imageSrc if we actually found something in the dataset
    if (dynamicSrc) {
      imageSrc = dynamicSrc;
    }
  } else if (element.type === 'qr' || element.type === 'barcode') {
    imageSrc = generatedSrc;
  }
  
  if (element.type === 'image' && element._debugLogged !== imageSrc) {
    console.log(`[IdCardPreview Debug] Image Element ID: ${element.id}`);
    console.log(`- Mapped Key: ${mappedKey}`);
    console.log(`- Record present: ${!!record}`);
    console.log(`- Image Match Column: ${imageMatchColumn}`);
    if (record) {
      console.log(`- Record Match Val: ${record[imageMatchColumn]}`);
      console.log(`- Record Direct Val: ${record[mappedKey]}`);
    }
    console.log(`- Store Keys Count: ${Object.keys(storeDatasetImages || {}).length}`);
    console.log(`- BatchStore Keys Count: ${Object.keys(batchImageStore || {}).length}`);
    console.log(`- Resolved Image Src (first 30 chars): ${imageSrc ? imageSrc.substring(0, 30) : 'null'}`);
    element._debugLogged = imageSrc;
  }

  // Final fallback
  if (!imageSrc) imageSrc = fallbackImage;

  const image = useCanvasImage(imageSrc);
  const lastClickTimeRef = useRef(0);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      // Attach to the outer Group/Shape provided by shapeRef
      trRef.current.nodes([shapeRef.current]);
      const layer = trRef.current.getLayer();
      if (layer) layer.batchDraw();
    }
  }, [isSelected, element, trRef.current, shapeRef.current]);

  const handleTap = (e: any) => {
    e.cancelBubble = true;
    if (isMappingStep && onMappingClick) {
      const sideName = (e.target.parent as any)?.sideName || 'front';
      onMappingClick(element.id, sideName, e);
      return;
    }
    const time = new Date().getTime();
    if (time - lastClickTimeRef.current < 400) {
      if (onDblClick) onDblClick(element.id, e);
    } else {
      if (onClick) onClick(element.id, e);
    }
    lastClickTimeRef.current = time;
  };

  const commonProps = {
    ref: shapeRef,
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    scaleX: element.scaleX || 1,
    scaleY: element.scaleY || 1,
    opacity: element.opacity !== undefined ? element.opacity : 1,
    draggable: !isReviewStep,
    onDragMove: (e: any) => {
      if (isReviewStep || !cardSize || !onGuidesChange) return;

      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      let w = element.width || node.width();
      let h = element.height || node.height();
      if (element.type === 'text') {
        w = node.width() * scaleX;
        h = node.height() * scaleY;
      } else {
        w = w * scaleX;
        h = h * scaleY;
      }
      
      const newGuides: {type: 'vertical'|'horizontal', pos: number}[] = [];
      const threshold = 5;
      
      const showGrid = useConfiguratorStore.getState().design.idCard.showGrid;
      
      const xPoints = [0, cardSize.width / 2, cardSize.width];
      const yPoints = [0, cardSize.height / 2, cardSize.height];
      
      if (showGrid) {
        for (let i = 0; i <= cardSize.width; i += 10) xPoints.push(i);
        for (let i = 0; i <= cardSize.height; i += 10) yPoints.push(i);
      }
      
      const siblings = node.parent?.children || [];
      siblings.forEach((sib: any) => {
        // Skip current node, transformer, and background/grid UI elements
        if (sib === node || sib.className === 'Transformer' || sib.name() === 'background') return;
        
        // Only allow snapping to elements that have an ID (i.e., they are design elements)
        // This prevents snapping to generic decoration groups or lines that aren't part of the design
        if (!sib.id()) {
           // Fallback check: if it's a Line or Group but has a design ID, allow it.
           // Note: Konva's className check for 'Group' is sib.className === 'Group'
           if (sib.className === 'Group' || sib.className === 'Line') return;
        }

        try {
          const sx = sib.x();
          const sy = sib.y();
          const sw = sib.width() * sib.scaleX();
          const sh = sib.height() * sib.scaleY();
          xPoints.push(sx, sx + sw / 2, sx + sw);
          yPoints.push(sy, sy + sh / 2, sy + sh);
        } catch(err) {
          // ignore
        }
      });
      
      const nLeft = node.x();
      const nCenter = node.x() + w / 2;
      const nRight = node.x() + w;
      
      let snapX: {pos: number, offset: number} | null = null;
      let minDiffX = threshold;
      
      xPoints.forEach(px => {
        [ {c: nLeft, off: 0}, {c: nCenter, off: w/2}, {c: nRight, off: w} ].forEach(pt => {
          const diff = Math.abs(pt.c - px);
          if (diff < minDiffX) {
            minDiffX = diff;
            snapX = { pos: Math.round(px), offset: pt.off };
          }
        });
      });
      
      const nTop = node.y();
      const nMiddle = node.y() + h / 2;
      const nBottom = node.y() + h;
      
      let snapY: {pos: number, offset: number} | null = null;
      let minDiffY = threshold;
      
      yPoints.forEach(py => {
        [ {c: nTop, off: 0}, {c: nMiddle, off: h/2}, {c: nBottom, off: h} ].forEach(pt => {
          const diff = Math.abs(pt.c - py);
          if (diff < minDiffY) {
            minDiffY = diff;
            snapY = { pos: Math.round(py), offset: pt.off };
          }
        });
      });
      
      if (snapX) {
        node.x(snapX.pos - snapX.offset);
        newGuides.push({ type: 'vertical', pos: snapX.pos });
      }
      
      if (snapY) {
        node.y(snapY.pos - snapY.offset);
        newGuides.push({ type: 'horizontal', pos: snapY.pos });
      }

      onGuidesChange(newGuides);
    },
    onDragEnd: (e: any) => {
      onGuidesChange?.([]);
      onDragEnd(element.id, { x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: (e: any) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      const x = node.x();
      const y = node.y();

      if (element.type === 'text') {
        // For text, we prefer resetting scale to 1 and updating width/fontSize
        // to maintain crisp typography
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd(element.id, {
          x, y, rotation,
          width: Math.max(5, node.width() * scaleX),
          fontSize: Math.round(element.fontSize * Math.max(scaleX, scaleY)),
          scaleX: 1,
          scaleY: 1
        });
      } else {
        // For images, frames, and shapes, we keep the scale for consistency
        // especially important for custom drawn frames with clipping paths
        onTransformEnd(element.id, {
          x, y, rotation,
          width: node.width(),
          height: node.height(),
          scaleX,
          scaleY
        });
      }
    },
    onClick: handleTap,
    onTap: handleTap,
  };

  let NodeComponent = null;
  switch (element.type) {
    case 'text':
      NodeComponent = <Text {...commonProps} text={dynamicValue || element.content} fontSize={element.fontSize} fill={element.fill} width={element.width} align={element.align} fontStyle={element.fontStyle} fontFamily={element.fontFamily || 'sans-serif'} lineHeight={element.lineHeight || 1.2} letterSpacing={element.letterSpacing || 0} />;
      break;
    case 'image':
    case 'qr':
    case 'barcode':
      NodeComponent = <Image {...commonProps} image={image} width={element.width} height={element.height || element.width} cornerRadius={element.cornerRadius || 0} />;
      break;
    case 'rect':
      NodeComponent = <Rect {...commonProps} width={element.width} height={element.height} fill={element.fill} cornerRadius={element.cornerRadius || 0} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'circle':
      NodeComponent = <Circle {...commonProps} x={element.x + (element.width || 0)/2} y={element.y + (element.width || 0)/2} radius={(element.width || 0) / 2} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'triangle':
      NodeComponent = <RegularPolygon {...commonProps} x={element.x + (element.width || 0)/2} y={element.y + (element.width || 0)/2} sides={3} radius={(element.width || 0) / 1.5} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'rhombus':
      NodeComponent = <RegularPolygon {...commonProps} x={element.x + (element.width || 0)/2} y={element.y + (element.width || 0)/2} sides={4} radius={(element.width || 0) / 1.4} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'line': {
      const isMask = !!(imageSrc && imageSrc !== fallbackImage);
      const w = element.width ?? 100;
      const h = element.height ?? 100;
      
      const getLineClip = (ctx: any) => {
        if (!element.points || element.points.length < 4) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0], element.points[1]);
        for (let i = 2; i < element.points.length; i += 2) {
          ctx.lineTo(element.points[i], element.points[i+1]);
        }
        ctx.closePath();
      };

      if (isMask) {
        let patternProps: any = {};
        if (image && image.width && image.height) {
          const iW = image.width;
          const iH = image.height;
          const scale = Math.max(w / iW, h / iH);
          patternProps = {
            fillPatternImage: image,
            fillPatternScale: { x: scale, y: scale },
            fillPatternOffset: {
              x: (iW - w / scale) / 2,
              y: (iH - h / scale) / 2
            },
            fillPatternRepeat: 'no-repeat'
          };
        }

        NodeComponent = (
          <Line 
            {...commonProps}
            points={element.points} 
            {...patternProps}
            stroke={element.stroke || '#5d5fef'} 
            strokeWidth={isSelected ? (element.strokeWidth || 1) + 1 : (element.strokeWidth || 1)} 
            strokeScaleEnabled={false}
            tension={element.tension ?? 0.5} 
            lineCap="round" 
            lineJoin="round" 
            closed={element.closed ?? true}
          />
        );
      } else {
        NodeComponent = (
          <Line 
            {...commonProps} 
            points={element.points} 
            stroke={element.stroke || '#5d5fef'} 
            strokeWidth={element.strokeWidth || 2} 
            tension={element.tension ?? 0.5} 
            lineCap="round" 
            lineJoin="round" 
            closed={element.closed ?? false}
          />
        );
      }
      break;
    }
    case 'frame': {
      const w = element.width || 100;
      const h = element.height || 100;
      const shapeId = element.shapeType || 'rect';
      const found = AVAILABLE_SHAPES.find(s => s.id === shapeId);
      const hasImage = !!(imageSrc && imageSrc !== fallbackImage);

      // If we have a registry shape, use the built-in Konva Path component
      if (found && found.path) {
        let patternProps: any = {};
        if (hasImage && image && image.width && image.height) {
          const iW = image.width;
          const iH = image.height;
          // Scale the image to cover the 100x100 path space
          const scale = Math.max(100 / iW, 100 / iH);
          patternProps = {
            fillPatternImage: image,
            fillPatternScale: { x: scale, y: scale },
            fillPatternOffset: {
              x: (iW - 100 / scale) / 2,
              y: (iH - 100 / scale) / 2
            },
            fillPatternRepeat: 'no-repeat'
          };
        }

        NodeComponent = (
          <Path
            {...commonProps}
            data={found.path}
            scaleX={w / 100}
            scaleY={h / 100}
            {...patternProps}
            fill={!hasImage ? (element.fill || '#f1f5f9') : undefined}
            stroke={element.stroke || (isSelected ? '#5d5fef' : '#e2e8f0')}
            strokeWidth={(isSelected ? (element.strokeWidth || 1) + 1 : (element.strokeWidth || 1)) * (100 / w)}
            strokeScaleEnabled={false}
          />
        );
      } else {
        // Fallback for legacy circle or basic rect
        const getClipFunc = (ctx: any) => {
          ctx.beginPath();
          if (shapeId === 'circle') {
            ctx.arc(w/2, h/2, Math.min(w,h)/2, 0, Math.PI * 2);
          } else {
            const r = element.cornerRadius || 0;
            ctx.roundRect(0, 0, w, h, r);
          }
          ctx.closePath();
        };

        let patternProps: any = {};
        if (hasImage && image && image.width && image.height) {
          const iW = image.width;
          const iH = image.height;
          const scale = Math.max(w / iW, h / iH);
          patternProps = {
            fillPatternImage: image,
            fillPatternScale: { x: scale, y: scale },
            fillPatternOffset: {
              x: (iW - w / scale) / 2,
              y: (iH - h / scale) / 2
            },
            fillPatternRepeat: 'no-repeat'
          };
        }

        NodeComponent = (
          <Shape
            {...commonProps}
            sceneFunc={(ctx, shape) => {
              getClipFunc(ctx);
              if (!hasImage) {
                ctx.fillStrokeShape(shape);
              } else {
                ctx.fillShape(shape);
              }
            }}
            {...patternProps}
            fill={!hasImage ? (element.fill || '#f1f5f9') : undefined}
            stroke={element.stroke || (isSelected ? '#5d5fef' : '#e2e8f0')}
            strokeWidth={isSelected ? (element.strokeWidth || 1) + 1 : (element.strokeWidth || 1)}
            strokeScaleEnabled={false}
          />
        );
      }
      break;
    }
  }

  return (
    <Group>
      {NodeComponent}
      {isSelected && !isReviewStep && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (element.type === 'line') return newBox;
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </Group>
  );
}

function BackgroundImage({ src, width, height }: { src: string, width: number, height: number }) {
  const image = useCanvasImage(src);
  
  if (!image) return null;
  
  if (!image.width || !image.height) {
    return <Image image={image} width={width} height={height} />;
  }

  const scale = Math.max(width / image.width, height / image.height);
  const ix = (image.width - width / scale) / 2;
  const iy = (image.height - height / scale) / 2;

  return (
    <Image 
      image={image} 
      width={width} 
      height={height} 
      crop={{
        x: ix,
        y: iy,
        width: width / scale,
        height: height / scale
      }}
    />
  );
}

export default function IdCardPreview({ onSelectElement, onUpdateElement, onDblClickElement, isReviewStep, forceSide, record, mapping, isMappingStep, onMappingClick, recordIndex, previewVariantId }: {
  onSelectElement?: (id: string | null, sideName?: string) => void;
  onUpdateElement?: (id: string, pos: any, sideName: string) => void;
  onDblClickElement?: (id: string, sideName: string, e: any) => void;
  isReviewStep?: boolean;
  forceSide?: 'front' | 'back';
  record?: any;
  mapping?: Record<string, string>;
  isMappingStep?: boolean;
  onMappingClick?: (id: string, sideName: string, e: any) => void;
  recordIndex?: number;
  previewVariantId?: string | null;
}) {
  const design = useConfiguratorStore((state) => state.design);
  const [guides, setGuides] = useState<{type: 'vertical'|'horizontal', pos: number}[]>([]);
  const { size, activeSide, showBothSides, showGrid } = design.idCard;
  
  const { width, height } = cardSizes[size] || cardSizes['86x54'];
  const isHorizontal = width > height;

  const renderSide = (sideName: 'front' | 'back', offsetX: number, offsetY = 0) => {
    const sideData = design.idCard[sideName];
    const isActive = sideName === activeSide;
    
    if (forceSide && sideName !== forceSide) return null;

    const sampleIdx = useConfiguratorStore(state => state.design.idCard.bulkWorkflow.sampleRecordIndex || 0);
    const activeRecordIndex = recordIndex !== undefined ? recordIndex : sampleIdx;

    let currentBgImage = sideData.backgroundImage;
    const variants = design.idCard.bulkWorkflow.templateVariants || [];
    
    if (previewVariantId && previewVariantId !== 'default') {
      const targetVariant = variants.find(v => v.id === previewVariantId);
      if (targetVariant) {
        if (sideName === 'front' && targetVariant.frontImage) currentBgImage = targetVariant.frontImage;
        if (sideName === 'back' && targetVariant.backImage) currentBgImage = targetVariant.backImage;
      }
    } else if (!previewVariantId && record && variants.length > 0) {
      for (const variant of variants) {
        const colVal = record[variant.condition.column]?.toString().trim() || '';
        const targetVal = variant.condition.value?.trim() || '';
        if (colVal && targetVal && colVal.toLowerCase() === targetVal.toLowerCase()) {
           if (sideName === 'front' && variant.frontImage) currentBgImage = variant.frontImage;
           if (sideName === 'back' && variant.backImage) currentBgImage = variant.backImage;
           break; // Stop at first match
        }
      }
    }

    return (
      <Group 
        x={offsetX} 
        y={offsetY} 
        opacity={showBothSides && !isActive && !forceSide ? 0.7 : 1}
        name={sideName}
      >
        <Rect 
          width={width} 
          height={height} 
          {...getKonvaFill(sideData.backgroundColor, width, height)} 
          cornerRadius={design.idCard.cornerRadius || 0} 
          stroke={isActive ? "#5d5fef" : "#ccc"} 
          strokeWidth={isActive ? 2 : 1} 
          shadowColor="rgba(0,0,0,0.1)" 
          shadowBlur={10} 
          shadowOffsetY={4} 
          onMouseDown={(e) => {
            if (isReviewStep) return;
            e.cancelBubble = true;
            if (onSelectElement) {
              onSelectElement(null, sideName);
            }
          }}
          onTap={(e) => {
            if (isReviewStep) return;
            e.cancelBubble = true;
            if (onSelectElement) {
              onSelectElement(null, sideName);
            }
          }}
        />
        {currentBgImage && (
          <Group clipFunc={(ctx: any) => {
            const r = design.idCard.cornerRadius || 0;
            if (r === 0) {
              ctx.rect(0, 0, width, height);
              return;
            }
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(width - r, 0);
            ctx.quadraticCurveTo(width, 0, width, r);
            ctx.lineTo(width, height - r);
            ctx.quadraticCurveTo(width, height, width - r, height);
            ctx.lineTo(r, height);
            ctx.quadraticCurveTo(0, height, 0, height - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
          }}>
            <BackgroundImage 
              src={currentBgImage} 
              width={width} 
              height={height} 
            />
          </Group>
        )}
        {showGrid && !isReviewStep && (
          <Group>
            {/* Regular grid lines */}
            <Group opacity={0.2}>
              {Array.from({ length: Math.floor(width / 10) + 1 }).map((_, i) => (
                <Line key={`grid-v-${i}`} points={[i * 10, 0, i * 10, height]} stroke="#5d5fef" strokeWidth={0.5} listening={false} dash={[2, 2]} />
              ))}
              {Array.from({ length: Math.floor(height / 10) + 1 }).map((_, i) => (
                <Line key={`grid-h-${i}`} points={[0, i * 10, width, i * 10]} stroke="#5d5fef" strokeWidth={0.5} listening={false} dash={[2, 2]} />
              ))}
            </Group>
            {/* Center cross-hair lines */}
            <Line points={[width / 2, 0, width / 2, height]} stroke="#ff00ff" strokeWidth={1} listening={false} dash={[6, 4]} opacity={0.4} />
            <Line points={[0, height / 2, width, height / 2]} stroke="#ff00ff" strokeWidth={1} listening={false} dash={[6, 4]} opacity={0.4} />
            
            {/* Trim Line / Safe Zone Indicator */}
            {design.idCard.showTrimLine && (
              <Rect 
                x={10} 
                y={10} 
                width={width - 20} 
                height={height - 20} 
                stroke="#ff00ff" 
                strokeWidth={0.5} 
                dash={[2, 2]} 
                listening={false}
                opacity={0.6}
              />
            )}
          </Group>
        )}
        <Group clipFunc={(ctx: any) => {
          const r = design.idCard.cornerRadius || 0;
          if (r === 0) {
            ctx.rect(0, 0, width, height);
            return;
          }
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.lineTo(width - r, 0);
          ctx.quadraticCurveTo(width, 0, width, r);
          ctx.lineTo(width, height - r);
          ctx.quadraticCurveTo(width, height, width - r, height);
          ctx.lineTo(r, height);
          ctx.quadraticCurveTo(0, height, 0, height - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.closePath();
        }}>
          {sideData.elements.map((el) => (
              <CanvasElement 
                key={el.id} 
                element={el} 
                onDragEnd={(id, pos) => onUpdateElement && onUpdateElement(id, pos, sideName)} 
                onTransformEnd={(id, pos) => onUpdateElement && onUpdateElement(id, pos, sideName)}
                onClick={(id) => onSelectElement && onSelectElement(id, sideName)} 
                onDblClick={(id, e) => onDblClickElement && onDblClickElement(id, sideName, e)}
                isSelected={design.idCard.selected === el.id}
                isReviewStep={isReviewStep || isMappingStep}
                isMappingStep={isMappingStep}
                onMappingClick={onMappingClick}
                record={record}
                mapping={mapping}
                onGuidesChange={setGuides}
                cardSize={{width, height}}
                recordIndex={activeRecordIndex}
              />
          ))}
        </Group>
        
        {guides.map((g, i) => (
          <Line
            key={`guide-${i}`}
            points={g.type === 'vertical' ? [g.pos, 0, g.pos, height] : [0, g.pos, width, g.pos]}
            stroke="#ff00ff"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        ))}

        {showBothSides && (
          <Text text={sideName.toUpperCase()} x={0} y={height + 15} width={width} align="center" fontSize={12} fill="#919191" fontStyle="bold" />
        )}
      </Group>
    );
  };

  return (
    <Group 
      onMouseDown={(e) => {
        if (isReviewStep) return;
        if (e.target === e.target.getStage()) {
          if (onSelectElement) {
            onSelectElement(null);
          }
        }
      }}
    >
      {renderSide(forceSide || (showBothSides ? 'front' : (activeSide as 'front' | 'back')), 0, 0)}
      {showBothSides && !forceSide && renderSide('back', isHorizontal ? 0 : width + 40, isHorizontal ? height + 40 : 0)}
    </Group>
  );
}
