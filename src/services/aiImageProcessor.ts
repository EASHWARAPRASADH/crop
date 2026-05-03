import { removeBackground } from "@imgly/background-removal";

export interface PhotoSize {
    label: string;
    widthMm: number;
    heightMm: number;
    widthInch: number;
    heightInch: number;
}

export interface ProcessingOptions {
    addFormalCoat?: boolean;
    backgroundColor?: string; // Hex color or 'transparent'
}

// 300 DPI for print-quality output
const DPI = 300;
const MM_PER_INCH = 25.4;

function mmToPixels(mm: number): number {
    return Math.round((mm / MM_PER_INCH) * DPI);
}

// Three preset photo sizes
export const PHOTO_SIZE_PRESETS: PhotoSize[] = [
    {
        label: "Passport",
        widthMm: 35,
        heightMm: 45,
        widthInch: parseFloat((35 / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((45 / MM_PER_INCH).toFixed(2)),
    },
    {
        label: "ID Card",
        widthMm: 22,
        heightMm: 22,
        widthInch: parseFloat((22 / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((22 / MM_PER_INCH).toFixed(2)),
    },
    {
        label: "ID/Visa",
        widthMm: 51,
        heightMm: 51,
        widthInch: parseFloat((51 / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((51 / MM_PER_INCH).toFixed(2)),
    },
];

// ─────────────────────────────────────────────────
//  Helper: load a Blob into an HTMLImageElement
// ─────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
    });
}

// ─────────────────────────────────────────────────
//  Helper: Downscale image before processing
// ─────────────────────────────────────────────────
async function shrinkFile(file: File | Blob, maxDim: number = 1024): Promise<Blob> {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);

    let { width, height } = img;
    if (width <= maxDim && height <= maxDim) {
        return file; // Already small enough
    }

    if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
    } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to shrink file"));
        }, file.type || "image/png", 0.9);
    });
}

// ─────────────────────────────────────────────────
//  Helper: Bounding box of opaque pixels
// ─────────────────────────────────────────────────
interface BBox { x: number; y: number; w: number; h: number; }

function getOpaqueBoundingBox(ctx: CanvasRenderingContext2D, width: number, height: number): BBox {
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const a = data[(y * width + x) * 4 + 3];
            if (a > 20) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX <= minX || maxY <= minY) {
        return { x: 0, y: 0, w: width, h: height };
    }
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// ─────────────────────────────────────────────────
//  Face detection: browser API + fallback heuristic
// ─────────────────────────────────────────────────
interface FaceBox { x: number; y: number; width: number; height: number; }

async function detectFace(img: HTMLImageElement): Promise<FaceBox | null> {
    // Try browser FaceDetector API (Chrome / Edge)
    if (typeof (window as any).FaceDetector !== "undefined") {
        try {
            const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            const faces = await detector.detect(img);
            if (faces.length > 0) {
                const bb = faces[0].boundingBox;
                return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
            }
        } catch {
            // fall through to heuristic
        }
    }

    // Fallback: use opaque-pixel heuristic on a temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext("2d")!;
    tCtx.drawImage(img, 0, 0);

    const bbox = getOpaqueBoundingBox(tCtx, img.width, img.height);

    // Estimate face as top ~35% of the opaque person area
    const faceH = bbox.h * 0.35;
    const faceW = bbox.w * 0.6;
    const faceX = bbox.x + (bbox.w - faceW) / 2;
    const faceY = bbox.y;

    return { x: faceX, y: faceY, width: faceW, height: faceH };
}

// ─────────────────────────────────────────────────
//  Smart crop: head & shoulders from any input
// ─────────────────────────────────────────────────
function computeSmartCrop(
    imgW: number,
    imgH: number,
    face: FaceBox,
    targetAspect: number // width / height
): { sx: number; sy: number; sw: number; sh: number } {
    // We want the face to be roughly 30-40% of the final height,
    // positioned at about 25-35% from top

    const faceCenter = { x: face.x + face.width / 2, y: face.y + face.height / 2 };

    // Target crop height: face should be ~30% of it
    let cropH = face.height / 0.30;
    let cropW = cropH * targetAspect;

    // If crop is larger than image, scale down
    if (cropW > imgW) {
        cropW = imgW;
        cropH = cropW / targetAspect;
    }
    if (cropH > imgH) {
        cropH = imgH;
        cropW = cropH * targetAspect;
    }

    // Position: face center at ~30% from top of crop
    let sy = faceCenter.y - cropH * 0.30;
    let sx = faceCenter.x - cropW / 2;

    // Clamp to image bounds
    sx = Math.max(0, Math.min(sx, imgW - cropW));
    sy = Math.max(0, Math.min(sy, imgH - cropH));

    return {
        sx: Math.round(sx),
        sy: Math.round(sy),
        sw: Math.round(cropW),
        sh: Math.round(cropH),
    };
}

// ─────────────────────────────────────────────────
//  Main processor class
// ─────────────────────────────────────────────────
export class AIImageProcessor {
    private isInitialized = false;

    async initialize() {
        this.isInitialized = true;
    }

    // ── Apply Professional Histogram Stretching (Auto-Levels) to Match Benchmark ──
    private applyAutoContrastAndBalance(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Calculate histogram of luminance (ignoring white background)
        const hist = new Array(256).fill(0);
        let total = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            // Skip pure white/near white background and fully transparent pixels
            if (a < 50 || (r > 240 && g > 240 && b > 240)) continue;
            
            const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            hist[lum]++;
            total++;
        }

        if (total === 0) return;

        // Find 2nd and 98th percentiles to avoid extreme noise/dead pixels
        let minL = 0, maxL = 255;
        let count = 0;
        for (let i = 0; i < 256; i++) {
            count += hist[i];
            if (count > total * 0.02) { minL = i; break; }
        }
        count = 0;
        for (let i = 255; i >= 0; i--) {
            count += hist[i];
            if (count > total * 0.02) { maxL = i; break; }
        }

        if (maxL <= minL) return;
        
        // Scale factor to stretch the contrast to full 0-255 range
        const scale = 255 / (maxL - minL);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            // Skip the white background
            if (a < 50 || (r > 240 && g > 240 && b > 240)) continue;
            
            // Apply stretch to each channel to preserve color balance but deepen blacks
            data[i]   = Math.max(0, Math.min(255, (r - minL) * scale));
            data[i+1] = Math.max(0, Math.min(255, (g - minL) * scale));
            data[i+2] = Math.max(0, Math.min(255, (b - minL) * scale));
        }

        ctx.putImageData(imgData, 0, 0);
    }

    // ── Color deepening + hair blackening ──
    // Boosts saturation for richer colors, deepens dark pixels for hair
    // Skips skin-tone hues (10°-40°) to protect the face
    private applyColorEnhancement(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 10) continue; // skip transparent

            const r = d[i], g = d[i + 1], b = d[i + 2];

            // Convert to HSL
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
            const l = (max + min) / 2;
            const delta = max - min;

            let h = 0, s = 0;
            if (delta > 0) {
                s = delta / (1 - Math.abs(2 * l - 1));
                if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
                else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
                else h = 60 * ((rn - gn) / delta + 4);
                if (h < 0) h += 360;
            }

            // Detect skin tone (hue 10-40°, saturation > 0.2, lightness 0.2-0.7)
            const isSkin = h >= 10 && h <= 40 && s > 0.2 && l > 0.2 && l < 0.7;

            if (isSkin) {
                // Don't touch skin — preserve face exactly
                continue;
            }

            // Deepen dark hair pixels (low luminance, not skin)
            if (l < 0.25) {
                // Push very dark pixels even darker for deep black hair
                const darkenFactor = 0.82;
                d[i] = Math.max(0, Math.round(r * darkenFactor));
                d[i + 1] = Math.max(0, Math.round(g * darkenFactor));
                d[i + 2] = Math.max(0, Math.round(b * darkenFactor));
                continue;
            }

            // Boost saturation and depth for non-skin pixels (richer, deeper colors)
            if (s > 0.05 && l > 0.1 && l < 0.9) {
                const satBoost = 1.35; // 35% saturation boost for deep colors
                const newS = Math.min(1, s * satBoost);
                const newL = l * 0.93; // Deepen the lightness slightly

                // Convert back from HSL to RGB
                const c2 = (1 - Math.abs(2 * newL - 1)) * newS;
                const x = c2 * (1 - Math.abs((h / 60) % 2 - 1));
                const m = l - c2 / 2;

                let r1 = 0, g1 = 0, b1 = 0;
                if (h < 60) { r1 = c2; g1 = x; }
                else if (h < 120) { r1 = x; g1 = c2; }
                else if (h < 180) { g1 = c2; b1 = x; }
                else if (h < 240) { g1 = x; b1 = c2; }
                else if (h < 300) { r1 = x; b1 = c2; }
                else { r1 = c2; b1 = x; }

                d[i] = Math.max(0, Math.min(255, Math.round((r1 + m) * 255)));
                d[i + 1] = Math.max(0, Math.min(255, Math.round((g1 + m) * 255)));
                d[i + 2] = Math.max(0, Math.min(255, Math.round((b1 + m) * 255)));
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // ── Two-pass unsharp mask for crisp edges ──
    private applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number = 0.6) {
        for (let pass = 0; pass < 2; pass++) {
            const imageData = ctx.getImageData(0, 0, w, h);
            const src = imageData.data;
            const copy = new Uint8ClampedArray(src);

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;
                    if (copy[idx + 3] < 10) continue; // skip background

                    for (let c = 0; c < 3; c++) {
                        const center = copy[idx + c];
                        const neighbors =
                            copy[((y - 1) * w + x) * 4 + c] +
                            copy[((y + 1) * w + x) * 4 + c] +
                            copy[(y * w + (x - 1)) * 4 + c] +
                            copy[(y * w + (x + 1)) * 4 + c];
                        const blur = neighbors / 4;
                        const diff = center - blur;
                        src[idx + c] = Math.max(0, Math.min(255, Math.round(center + amount * diff)));
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
            // Reduce amount on second pass for subtlety
            amount *= 0.5;
        }
    }



    // ── Adaptive lighting based on Gemini analysis ──
    private applyAdaptiveLighting(ctx: CanvasRenderingContext2D, w: number, h: number, lightingQuality: string) {
        if (lightingQuality === 'good') return; // Already well-lit, skip

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 50) continue; // skip transparent

            if (lightingQuality === 'dark') {
                // Boost brightness for underexposed images
                data[i]     = Math.min(255, Math.round(data[i] * 1.15 + 10));
                data[i + 1] = Math.min(255, Math.round(data[i + 1] * 1.15 + 10));
                data[i + 2] = Math.min(255, Math.round(data[i + 2] * 1.15 + 10));
            } else if (lightingQuality === 'bright') {
                // Reduce brightness for overexposed images
                data[i]     = Math.max(0, Math.round(data[i] * 0.88));
                data[i + 1] = Math.max(0, Math.round(data[i + 1] * 0.88));
                data[i + 2] = Math.max(0, Math.round(data[i + 2] * 0.88));
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    // ── Draw formal black coat/blazer (Gender specific) ──
    private drawFormalCoat(
        ctx: CanvasRenderingContext2D,
        canvasW: number,
        canvasH: number,
        faceBox: FaceBox,
        gender: "male" | "female"
    ) {
        const faceCX = faceBox.x + faceBox.width / 2;
        const fW = faceBox.width;

        // Estimate physical chin level. 
        // faceBox usually cuts off around the mouth or upper chin.
        const chinY = faceBox.y + faceBox.height + fW * 0.15;

        // Proportions 
        const shoulderW = canvasW * 1.5; // Ensure shoulders go way past canvas edges
        const neckW = fW * 0.7;          // Width of the collar area

        const shoulderL = faceCX - shoulderW / 2;
        const shoulderR = faceCX + shoulderW / 2;
        const neckL = faceCX - neckW / 2;
        const neckR = faceCX + neckW / 2;

        const collarTopY = chinY + fW * 0.05;    // top of the shirt collar (neck level)
        const shoulderY = chinY + fW * 0.55;     // outer shoulders drop down
        const vDepth = chinY + fW * 0.95;        // bottom of the V-neck
        const coatBottom = canvasH + 2;          // bleed past canvas edge

        ctx.save();

        // ── 1. Main Blazer Body (with sloping shoulders & rich deep blacks) ──
        const blazerGrad = ctx.createLinearGradient(0, shoulderY, canvasW, shoulderY);
        blazerGrad.addColorStop(0, "#0a0a0a");
        blazerGrad.addColorStop(0.2, "#141414");
        blazerGrad.addColorStop(0.5, "#1c1c1c");
        blazerGrad.addColorStop(0.8, "#141414");
        blazerGrad.addColorStop(1, "#0a0a0a");
        ctx.fillStyle = blazerGrad;

        ctx.beginPath();
        // Left side from bottom up
        ctx.moveTo(shoulderL + fW * 0.1, coatBottom);
        // Left shoulder outer edge
        ctx.lineTo(shoulderL, shoulderY + fW * 0.2);
        // Sloping left shoulder to collar
        ctx.quadraticCurveTo(shoulderL + fW * 0.2, shoulderY - fW * 0.1, neckL, collarTopY);
        
        // V-Neck down to button
        ctx.lineTo(faceCX, vDepth);
        
        // Right collar up
        ctx.lineTo(neckR, collarTopY);
        // Sloping right shoulder
        ctx.quadraticCurveTo(shoulderR - fW * 0.2, shoulderY - fW * 0.1, shoulderR, shoulderY + fW * 0.2);
        // Right side down to bottom
        ctx.lineTo(shoulderR - fW * 0.1, coatBottom);
        ctx.closePath();
        ctx.fill();

        if (gender === 'male') {
            // ── Male: White Shirt (Spread Collar) + Thick Black Tie (Benchmark Style) ──
            
            // 1. Shirt Base (covers existing clothes)
            ctx.fillStyle = "#F8F8F8";
            ctx.beginPath();
            ctx.moveTo(neckL - fW*0.1, collarTopY); // wider neck base to ensure no old clothes peek through
            ctx.lineTo(faceCX, vDepth * 0.95);  
            ctx.lineTo(neckR + fW*0.1, collarTopY);
            ctx.quadraticCurveTo(faceCX, chinY - fW * 0.05, neckL - fW*0.1, collarTopY);
            ctx.closePath();
            ctx.fill();

            // 2. Thick Black Tie (Matches Benchmark)
            const knotTop = chinY + fW * 0.15;
            const knotBottom = knotTop + fW * 0.18;
            const knotWidth = fW * 0.18; // Very wide knot like benchmark
            
            ctx.fillStyle = "#050505"; // Pitch black tie
            
            // Tie Knot
            ctx.beginPath();
            ctx.moveTo(faceCX - knotWidth/2, knotTop);
            ctx.lineTo(faceCX + knotWidth/2, knotTop);
            ctx.lineTo(faceCX + knotWidth/2.5, knotBottom);
            ctx.lineTo(faceCX - knotWidth/2.5, knotBottom);
            ctx.closePath();
            ctx.fill();
            
            // Tie Body (Wide, tapering slightly outwards, thick presence)
            ctx.beginPath();
            ctx.moveTo(faceCX - knotWidth/2.5, knotBottom);
            ctx.lineTo(faceCX + knotWidth/2.5, knotBottom);
            ctx.lineTo(faceCX + knotWidth/1.5, vDepth * 0.95); // Wide body
            ctx.lineTo(faceCX, vDepth * 0.95 + fW * 0.1); 
            ctx.lineTo(faceCX - knotWidth/1.5, vDepth * 0.95);
            ctx.closePath();
            ctx.fill();

            // 3. Wide-Spread White Collar Points (Matches Benchmark)
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#DDDDDD";
            ctx.lineWidth = Math.max(1, canvasW * 0.002);
            
            // Left Spread Collar
            ctx.beginPath();
            ctx.moveTo(neckL - fW * 0.1, collarTopY);
            ctx.lineTo(faceCX - fW * 0.35, knotTop + fW * 0.12); // Points spread far outward
            ctx.lineTo(faceCX - knotWidth/2, knotTop + fW*0.05); // Meets tie knot cleanly
            ctx.quadraticCurveTo(faceCX - fW * 0.2, chinY + fW * 0.05, neckL - fW * 0.1, collarTopY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke(); 

            // Right Spread Collar
            ctx.beginPath();
            ctx.moveTo(neckR + fW * 0.1, collarTopY);
            ctx.lineTo(faceCX + fW * 0.35, knotTop + fW * 0.12); // Points spread far outward
            ctx.lineTo(faceCX + knotWidth/2, knotTop + fW*0.05); // Meets tie knot cleanly
            ctx.quadraticCurveTo(faceCX + fW * 0.2, chinY + fW * 0.05, neckR + fW * 0.1, collarTopY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke(); 

        } else {
            // ── Female: Elegant Blouse (No tie, softer neckline) ──
            ctx.fillStyle = "#F8F8F8";
            ctx.beginPath();
            ctx.moveTo(neckL, collarTopY);
            ctx.lineTo(faceCX, vDepth * 0.85); // blouse V doesn't go all the way to button
            ctx.lineTo(neckR, collarTopY);
            // Softer scoop under chin
            ctx.quadraticCurveTo(faceCX, chinY - fW * 0.02, neckL, collarTopY);
            ctx.closePath();
            ctx.fill();

            // Blouse center fold
            ctx.strokeStyle = "#EDEDED";
            ctx.lineWidth = Math.max(1, canvasW * 0.003);
            ctx.beginPath();
            ctx.moveTo(faceCX, vDepth * 0.85); // from bottom of blouse V
            ctx.lineTo(faceCX, vDepth * 0.95); // hidden fold down to blazer button
            ctx.stroke();

            // Soft curved lapel/collar for the blouse (instead of sharp points)
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(neckL, collarTopY);
            ctx.quadraticCurveTo(faceCX - fW * 0.15, chinY + fW * 0.3, faceCX, vDepth * 0.75);
            ctx.quadraticCurveTo(faceCX - fW * 0.2, chinY + fW * 0.1, neckL, collarTopY);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(neckR, collarTopY);
            ctx.quadraticCurveTo(faceCX + fW * 0.15, chinY + fW * 0.3, faceCX, vDepth * 0.75);
            ctx.quadraticCurveTo(faceCX + fW * 0.2, chinY + fW * 0.1, neckR, collarTopY);
            ctx.fill();
        }

        // ── 5. Blazer Lapels (Benchmark Wide Spread) ──
        ctx.fillStyle = "#0f0f0f"; 
        
        // Left Lapel
        ctx.beginPath();
        ctx.moveTo(neckL - fW*0.1, collarTopY);
        // Wide male notch matching the benchmark's classic 90s style business suit
        const notchL = gender === 'female' ? neckL - fW * 0.08 : neckL - fW * 0.35; 
        ctx.lineTo(notchL, collarTopY + fW * 0.15); // High notch
        ctx.lineTo(notchL + fW * 0.15, collarTopY + fW * 0.25); // Notch inner
        ctx.lineTo(faceCX - 2, vDepth); // Down to button
        ctx.lineTo(faceCX - 2, vDepth + fW * 0.05);
        ctx.lineTo(neckL - fW * 0.5, collarTopY + fW * 0.5); // Wide outer lapel bulk
        ctx.closePath();
        ctx.fill();

        // Right Lapel
        ctx.beginPath();
        ctx.moveTo(neckR + fW*0.1, collarTopY);
        const notchR = gender === 'female' ? neckR + fW * 0.08 : neckR + fW * 0.35;
        ctx.lineTo(notchR, collarTopY + fW * 0.15); 
        ctx.lineTo(notchR - fW * 0.15, collarTopY + fW * 0.25);
        ctx.lineTo(faceCX + 2, vDepth);
        ctx.lineTo(faceCX + 2, vDepth + fW * 0.05);
        ctx.lineTo(neckR + fW * 0.5, collarTopY + fW * 0.5); 
        ctx.closePath();
        ctx.fill();

        // ── 6. Coat Center Seam ──
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = Math.max(2, canvasW * 0.004);
        ctx.beginPath();
        ctx.moveTo(faceCX, vDepth);
        ctx.lineTo(faceCX, coatBottom);
        ctx.stroke();

        // ── 7. Button ──
        const btnY = vDepth + fW * 0.15;
        const btnR = Math.max(3, canvasW * 0.009);
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.arc(faceCX, btnY, btnR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── 8. Shoulder Seams ──
        ctx.strokeStyle = "rgba(40, 40, 40, 0.4)";
        ctx.lineWidth = Math.max(1, canvasW * 0.002);
        ctx.beginPath();
        ctx.moveTo(neckL - fW * 0.2, collarTopY + fW * 0.1);
        ctx.lineTo(shoulderL + fW * 0.4, shoulderY + fW * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(neckR + fW * 0.2, collarTopY + fW * 0.1);
        ctx.lineTo(shoulderR - fW * 0.4, shoulderY + fW * 0.1);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Replaces local rendering with a deterministic local pipeline.
     * No more external AI - everything runs in-browser for speed and privacy.
     */
    async processImage(file: File, photoSize?: PhotoSize, options?: ProcessingOptions): Promise<Blob> {
        const size = photoSize ?? PHOTO_SIZE_PRESETS[0];
        const addCoat = options?.addFormalCoat ?? false;
        const bgColor = options?.backgroundColor ?? "#FFFFFF";

        const targetW_px = mmToPixels(size.widthMm);
        const targetH_px = mmToPixels(size.heightMm);

        try {
            // 1. Remove Background FIRST from the raw file to get a transparent subject
            const transparentBlob = await removeBackground(file, {
                output: { format: "image/png", quality: 0.95 }
            });

            // 2. Load the transparent subject
            const transparentUrl = URL.createObjectURL(transparentBlob);
            const img = await loadImage(transparentUrl);
            
            // 3. Detect Face for Smart Cropping (using the transparent version)
            const face = await detectFace(img);
            
            // 4. Create Main Processing Canvas
            const canvas = document.createElement("canvas");
            canvas.width = targetW_px;
            canvas.height = targetH_px;
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

            // 5. Apply Background Color (unless transparent)
            if (bgColor !== 'transparent') {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // 6. Smart Crop & Alignment
            if (face) {
                const crop = computeSmartCrop(img.width, img.height, face, canvas.width / canvas.height);
                ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback: simple center cover
                const aspect = img.width / img.height;
                const targetAspect = canvas.width / canvas.height;
                let sx, sy, sw, sh;
                if (aspect > targetAspect) {
                    sh = img.height;
                    sw = sh * targetAspect;
                    sx = (img.width - sw) / 2;
                    sy = 0;
                } else {
                    sw = img.width;
                    sh = sw / targetAspect;
                    sx = 0;
                    sy = (img.height - sh) / 2;
                }
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            }

            // 7. Apply Enhancements (Sharpen, Contrast, etc.)
            this.applyAutoContrastAndBalance(ctx, canvas.width, canvas.height);
            this.applySharpen(ctx, canvas.width, canvas.height, 0.4);

            // 8. Optional: Draw Procedural Coat
            if (addCoat && face) {
                this.drawFormalCoat(ctx, canvas.width, canvas.height, face, 'male');
            }

            // Cleanup
            URL.revokeObjectURL(transparentUrl);

            // 9. Return Final Result
            return new Promise<Blob>((resolve, reject) => {
                const format = bgColor === 'transparent' ? "image/png" : "image/jpeg";
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas export failed"));
                }, format, 0.95);
            });

        } catch (error) {
            console.error("Local Image Processing failed:", error);
            return file;
        }
    }
}
