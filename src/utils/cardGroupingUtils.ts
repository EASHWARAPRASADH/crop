/**
 * Card Grouping Utilities
 * 
 * Enforces CR80 standard sizes (86x54mm) and implements
 * specific A3 grid layouts: 5x4 (Single) and 5x2 (Double-Sided Sets).
 */

// Standards at 180 DPI (Scale 2.5)
const DPI = 180;
export const CR80_WIDTH_PX = Math.round((54 / 25.4) * DPI);  // ~383px
export const CR80_HEIGHT_PX = Math.round((86 / 25.4) * DPI); // ~609px

// A3 size in points (72 DPI)
export const A3_WIDTH_PT = 842;
export const A3_HEIGHT_PT = 1191;

// A3 in pixels at 2.5x scale (180 DPI)
export const A3_WIDTH_PX = Math.round((297 / 25.4) * DPI);  // ~2105px
export const A3_HEIGHT_PX = Math.round((420 / 25.4) * DPI); // ~2976px

export type GroupingMode = 'single' | 'double';

export interface GridInfo {
  mode: GroupingMode;
  rows: number;
  cols: number;
  cardWidth: number;   
  cardHeight: number;  
  offsetX: number;     
  offsetY: number;     
  gapX: number;        
  gapY: number;        
  pageWidth: number;
  pageHeight: number;
}

export interface SlotInfo {
  row: number;
  col: number;
  isEmpty: boolean;
  imageDataUrl?: string; // extracted card image
  backImageDataUrl?: string; // only for Double mode
}

export interface FileAnalysis {
  fileName: string;
  file: File;
  totalPages: number;
  lastPageImage: string;
  grid: GridInfo | null;
  slots: SlotInfo[];
  filledCount: number;
  emptyCount: number;
}

const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  if (imageCache.has(dataUrl)) {
    return Promise.resolve(imageCache.get(dataUrl)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (imageCache.size > 20) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) imageCache.delete(firstKey);
      }
      imageCache.set(dataUrl, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

const getImageData = async (dataUrl: string): Promise<{ data: ImageData; width: number; height: number }> => {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return {
    data: ctx.getImageData(0, 0, canvas.width, canvas.height),
    width: canvas.width,
    height: canvas.height,
  };
};

/**
 * Detect the card grid structure (rows/cols) but force CR80 dimensions.
 */
export const detectCardGrid = async (
  pageImageDataUrl: string
): Promise<GridInfo> => {
  const { data: imageData, width, height } = await getImageData(pageImageDataUrl);
  const pixels = imageData.data;

  const rowBrightness = new Float32Array(height);
  const colBrightness = new Float32Array(width);

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      rowSum += brightness;
      colBrightness[x] += brightness;
    }
    rowBrightness[y] = rowSum / width;
  }

  for (let x = 0; x < width; x++) {
    colBrightness[x] /= height;
  }

  const THRESHOLD = 240; 
  const MIN_GAP = Math.max(3, Math.round(height * 0.005));

  const findGaps = (brightness: Float32Array, length: number): { start: number; end: number }[] => {
    const gaps: { start: number; end: number }[] = [];
    let inGap = false;
    let gapStart = 0;

    for (let i = 0; i < length; i++) {
      if (brightness[i] >= THRESHOLD) {
        if (!inGap) {
          inGap = true;
          gapStart = i;
        }
      } else {
        if (inGap) {
          if (i - gapStart >= MIN_GAP) {
            gaps.push({ start: gapStart, end: i });
          }
          inGap = false;
        }
      }
    }
    if (inGap && length - gapStart >= MIN_GAP) {
      gaps.push({ start: gapStart, end: length });
    }
    return gaps;
  };

  const hGaps = findGaps(rowBrightness, height);
  const vGaps = findGaps(colBrightness, width);

  const cardRowRanges: { start: number; end: number }[] = [];
  const cardColRanges: { start: number; end: number }[] = [];

  if (hGaps.length === 0) {
    cardRowRanges.push({ start: 0, end: height });
  } else {
    if (hGaps[0].start > MIN_GAP * 2) cardRowRanges.push({ start: 0, end: hGaps[0].start });
    for (let i = 0; i < hGaps.length - 1; i++) {
      cardRowRanges.push({ start: hGaps[i].end, end: hGaps[i + 1].start });
    }
    if (height - hGaps[hGaps.length - 1].end > MIN_GAP * 2) cardRowRanges.push({ start: hGaps[hGaps.length - 1].end, end: height });
  }

  if (vGaps.length === 0) {
    cardColRanges.push({ start: 0, end: width });
  } else {
    if (vGaps[0].start > MIN_GAP * 2) cardColRanges.push({ start: 0, end: vGaps[0].start });
    for (let i = 0; i < vGaps.length - 1; i++) {
      cardColRanges.push({ start: vGaps[i].end, end: vGaps[i + 1].start });
    }
    if (width - vGaps[vGaps.length - 1].end > MIN_GAP * 2) cardColRanges.push({ start: vGaps[vGaps.length - 1].end, end: width });
  }

  const rows = Math.max(1, cardRowRanges.length);
  const cols = Math.max(1, cardColRanges.length);

  // Determine if content implies Horizontal or Vertical standard card
  const avgW = cardColRanges.length > 0 ? (cardColRanges[0].end - cardColRanges[0].start) : width / cols;
  const avgH = cardRowRanges.length > 0 ? (cardRowRanges[0].end - cardRowRanges[0].start) : height / rows;
  
  const isLandscape = avgW > avgH;
  let cardWidth = isLandscape ? CR80_HEIGHT_PX : CR80_WIDTH_PX;
  let cardHeight = isLandscape ? CR80_WIDTH_PX : CR80_HEIGHT_PX;
  let mode: GroupingMode = 'single';

  // Dynamic Double-Sided Set Detection (5x2 combined)
  if (cols === 5 && rows <= 2) {
    mode = 'double';
    cardHeight = CR80_HEIGHT_PX * 2; // Extract Front and Back head-to-head block
  }

  const offsetX = cardColRanges.length > 0 ? cardColRanges[0].start : 0;
  const offsetY = cardRowRanges.length > 0 ? cardRowRanges[0].start : 0;

  const gapX = cols > 1 && vGaps.length > 0 ? Math.round(vGaps.reduce((s, g) => s + (g.end - g.start), 0) / vGaps.length) : 0;
  const gapY = rows > 1 && hGaps.length > 0 ? Math.round(hGaps.reduce((s, g) => s + (g.end - g.start), 0) / hGaps.length) : 0;

  return { mode, rows, cols, cardWidth, cardHeight, offsetX, offsetY, gapX, gapY, pageWidth: width, pageHeight: height };
};

export const extractCardFromPage = async (
  pageImageDataUrl: string,
  row: number,
  col: number,
  grid: GridInfo
): Promise<string> => {
  const img = await loadImage(pageImageDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = grid.cardWidth;
  canvas.height = grid.cardHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const sx = grid.offsetX + col * (grid.cardWidth + grid.gapX);
  const sy = grid.offsetY + row * (grid.cardHeight + grid.gapY);

  ctx.drawImage(img, sx, sy, grid.cardWidth, grid.cardHeight, 0, 0, grid.cardWidth, grid.cardHeight);
  return canvas.toDataURL('image/png');
};

export const isSlotEmpty = async (
  pageImageDataUrl: string,
  row: number,
  col: number,
  grid: GridInfo
): Promise<boolean> => {
  const cardDataUrl = await extractCardFromPage(pageImageDataUrl, row, col, grid);
  const { data: imageData } = await getImageData(cardDataUrl);
  const pixels = imageData.data;
  const totalPixels = imageData.width * imageData.height;

  let whiteCount = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    if (brightness > 245) whiteCount++;
  }
  return whiteCount / totalPixels > 0.95;
};

export const analyzePageSlots = async (
  pageImageDataUrl: string,
  grid: GridInfo
): Promise<SlotInfo[]> => {
  const slots: SlotInfo[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const empty = await isSlotEmpty(pageImageDataUrl, r, c, grid);
      const cardImage = empty ? undefined : await extractCardFromPage(pageImageDataUrl, r, c, grid);
      slots.push({ row: r, col: c, isEmpty: empty, imageDataUrl: cardImage });
    }
  }
  return slots;
};

/**
 * Composite gathered cards back onto the unified A3 template
 */
export const compositeCardsOntoA3 = async (
  fillerCards: string[], 
  grid: GridInfo,
  templateDataUrl: string
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = grid.pageWidth;
  canvas.height = grid.pageHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // 1. Draw a Blank White Background (matching the template's exact physical dimensions)
  // This physically mirrors the source page without mixing its printed contents into the new file!
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, grid.pageWidth, grid.pageHeight);

  const cw = grid.cardWidth;
  const ch = grid.cardHeight;
  const { rows, cols, offsetX, offsetY, gapX, gapY } = grid;

  let fillIdx = 0;
  
  // Standard Grid iteration handles BOTH single and double because 
  // double acts as unified double-tall card slots physically
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (fillIdx >= fillerCards.length) break;
      const x = offsetX + c * (cw + gapX);
      const y = offsetY + r * (ch + gapY);

      const cardSrc = fillerCards[fillIdx++];
      if (cardSrc) {
        const img = await loadImage(cardSrc);
        ctx.drawImage(img, x, y, cw, ch);
      }
    }
  }

  return canvas.toDataURL('image/png', 0.9); // using 0.9 compression helps memory
};
