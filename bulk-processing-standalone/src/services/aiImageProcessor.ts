import { removeBackground } from "@imgly/background-removal";

export interface PhotoSize {
    label: string;
    widthMm: number;
    heightMm: number;
    widthInch: number;
    heightInch: number;
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
        label: "Stamp",
        widthMm: 25,
        heightMm: 30,
        widthInch: parseFloat((25 / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((30 / MM_PER_INCH).toFixed(2)),
    },
    {
        label: "ID / Visa",
        widthMm: 51,
        heightMm: 51,
        widthInch: parseFloat((51 / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((51 / MM_PER_INCH).toFixed(2)),
    },
];

export class AIImageProcessor {
    private isInitialized = false;

    async initialize() {
        this.isInitialized = true;
    }

    /**
     * Measure average brightness of opaque (person) pixels only.
     */
    private async calculateAverageBrightness(blob: Blob): Promise<number> {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(128);

            img.onload = () => {
                canvas.width = 100;
                canvas.height = Math.round(100 * (img.height / img.width));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                try {
                    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let totalLuminance = 0;
                    let count = 0;

                    for (let i = 0; i < data.length; i += 4) {
                        const a = data[i + 3];
                        if (a > 10) {
                            totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                            count++;
                        }
                    }
                    resolve(count > 0 ? totalLuminance / count : 128);
                } catch {
                    resolve(128);
                }
            };
            img.onerror = () => resolve(128);
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * Pixel-level unsharp mask for crisp, sharp edges.
     */
    private applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number = 0.4) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const src = imageData.data;
        const copy = new Uint8ClampedArray(src);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    const center = copy[idx + c];
                    const neighbors =
                        copy[((y - 1) * width + x) * 4 + c] +
                        copy[((y + 1) * width + x) * 4 + c] +
                        copy[(y * width + (x - 1)) * 4 + c] +
                        copy[(y * width + (x + 1)) * 4 + c];
                    const blur = neighbors / 4;
                    const diff = center - blur;
                    src[idx + c] = Math.max(0, Math.min(255, Math.round(center + amount * diff)));
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Per-pixel lighting correction on opaque pixels only.
     * Face structure is never altered — only RGB channel values shift proportionally.
     */
    private applyLightingCorrection(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        brightnessFactor: number,
        contrastFactor: number
    ) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const bMul = brightnessFactor / 100;
        const cMul = contrastFactor / 100;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 10) continue; // skip transparent (background)
            for (let c = 0; c < 3; c++) {
                let val = data[i + c] * bMul;
                val = (val - 128) * cMul + 128;
                data[i + c] = Math.max(0, Math.min(255, Math.round(val)));
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Process a single image:
     *   1. Remove background only (face untouched)
     *   2. Fit onto white canvas at the requested photo size
     *   3. Smart lighting: leave good lighting alone, neutralize high, boost low
     *   4. Sharpen edges
     *
     * @param file     The input image file
     * @param photoSize  The desired output dimensions (defaults to Passport 35×45mm)
     */
    async processImage(file: File, photoSize?: PhotoSize): Promise<Blob> {
        const size = photoSize ?? PHOTO_SIZE_PRESETS[0]; // default: Passport

        try {
            // ── STEP 1: Remove background ONLY ──
            const bgRemovedBlob = await removeBackground(file, {
                progress: (key: string, current: number, total: number) => {
                    console.log(`BG removal: ${key}: ${current} of ${total}`);
                },
            });

            return new Promise((resolve, reject) => {
                const img = new Image();
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                img.onload = async () => {
                    if (!ctx) {
                        resolve(file);
                        return;
                    }

                    // ── STEP 2: Canvas at the chosen photo size (300 DPI) ──
                    canvas.width = mmToPixels(size.widthMm);
                    canvas.height = mmToPixels(size.heightMm);

                    // Crisp edges — no smoothing
                    ctx.imageSmoothingEnabled = false;

                    // White background
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // ── STEP 3: Scale & center person ──
                    const paddingFactor = 0.95;
                    const fitW = canvas.width * paddingFactor;
                    const fitH = canvas.height * paddingFactor;
                    const scale = Math.min(fitW / img.width, fitH / img.height);
                    const drawW = img.width * scale;
                    const drawH = img.height * scale;
                    const xOff = (canvas.width - drawW) / 2;
                    const yOff = (canvas.height - drawH) / 2;

                    ctx.drawImage(img, 0, 0, img.width, img.height, xOff, yOff, drawW, drawH);

                    // ── STEP 4: Smart lighting correction ──
                    const avg = await this.calculateAverageBrightness(bgRemovedBlob);

                    // Good lighting zone: 110–160 → don't touch
                    // Low lighting: < 110 → boost brightness
                    // High lighting: > 160 → neutralize / bring down
                    let bFactor = 100;
                    let cFactor = 100;

                    if (avg < 110) {
                        // Low light — boost proportionally
                        const target = 135;
                        bFactor = Math.min(130, (target / avg) * 100);
                        // Slight contrast bump so it doesn't wash out
                        cFactor = Math.min(112, 100 + (bFactor - 100) * 0.4);
                    } else if (avg > 160) {
                        // Too bright — bring it down
                        const target = 140;
                        bFactor = Math.max(75, (target / avg) * 100);
                        cFactor = 105; // tiny contrast lift to retain detail
                    }
                    // else: good lighting (110-160) — leave untouched

                    if (Math.abs(bFactor - 100) > 2 || Math.abs(cFactor - 100) > 2) {
                        this.applyLightingCorrection(ctx, canvas.width, canvas.height, bFactor, cFactor);
                    }

                    // ── STEP 5: Sharpen edges ──
                    this.applySharpen(ctx, canvas.width, canvas.height, 0.45);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error("Failed to create blob"));
                        },
                        "image/jpeg",
                        0.95
                    );
                };

                img.onerror = () => reject(new Error("Failed to load image"));
                img.src = URL.createObjectURL(bgRemovedBlob);
            });
        } catch (error) {
            console.error("AI Image Processing Error:", error);
            return file;
        }
    }
}
