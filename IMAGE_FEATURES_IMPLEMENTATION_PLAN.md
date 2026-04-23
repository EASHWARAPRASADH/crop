# GOTEK Advanced Image Features - Implementation Plan

## Overview
This document outlines a phased approach to implementing advanced image processing features for the GOTEK ID card system. Each phase builds upon the previous, ensuring a solid foundation for complex features.

---

## Phase 1: Face Detection & Alignment (face-api.js)
**Priority:** HIGH  
**Complexity:** Medium  
**Estimated Time:** 2-3 days

### Technical Stack
- `face-api.js` - Face detection, landmarks, recognition
- Canvas API for image manipulation
- React hooks for state management

### Implementation Steps

#### 1.1 Install Dependencies
```bash
npm install face-api.js
```

#### 1.2 Create Face Detection Service
**File:** `src/services/faceDetectionService.ts`

```typescript
import * as faceapi from 'face-api.js';

class FaceDetectionService {
  private modelsLoaded = false;

  async loadModels() {
    if (this.modelsLoaded) return;
    
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    this.modelsLoaded = true;
  }

  async detectFace(imageElement: HTMLImageElement) {
    await this.loadModels();
    
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    return detections[0]; // Return first face
  }

  getFaceCenter(landmarks: faceapi.FaceLandmarks68) {
    const jaw = landmarks.getJawOutline();
    const left = jaw[0];
    const right = jaw[jaw.length - 1];
    
    return {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
      width: right.x - left.x,
      height: landmarks.positions[8].y - landmarks.positions[27].y
    };
  }

  calculateFaceRotation(landmarks: faceapi.FaceLandmarks68): number {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEyeCenter = this.getPointCenter(leftEye);
    const rightEyeCenter = this.getPointCenter(rightEye);
    
    const deltaY = rightEyeCenter.y - leftEyeCenter.y;
    const deltaX = rightEyeCenter.x - leftEyeCenter.x;
    
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  }

  private getPointCenter(points: faceapi.Point) {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  }
}

export default new FaceDetectionService();
```

#### 1.3 Download Face API Models
Create `public/models/` directory and download:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1

#### 1.4 Integrate into PhotoProcessor
Add face detection toggle and auto-alignment feature.

### Deliverables
- Face detection service
- Face alignment (rotation correction)
- Face centering in frame
- UI toggle for auto-alignment
- Loading state for model initialization

---

## Phase 2: Photo Quality Scoring System
**Priority:** HIGH  
**Complexity:** Medium  
**Estimated Time:** 2 days

### Technical Stack
- Canvas API for pixel analysis
- Laplacian variance for blur detection
- Histogram analysis for lighting
- React for UI display

### Implementation Steps

#### 2.1 Create Quality Scoring Service
**File:** `src/services/qualityScoringService.ts`

```typescript
interface QualityScore {
  overall: number; // 0-100
  sharpness: number;
  brightness: number;
  contrast: number;
  faceVisibility: number;
  details: string[];
}

class QualityScoringService {
  async analyze(imageElement: HTMLImageElement): Promise<QualityScore> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const sharpness = this.calculateSharpness(pixels, canvas.width, canvas.height);
    const brightness = this.calculateBrightness(pixels);
    const contrast = this.calculateContrast(pixels);
    const faceVisibility = this.calculateFaceVisibility(pixels);
    
    const overall = (sharpness * 0.3 + brightness * 0.3 + contrast * 0.2 + faceVisibility * 0.2);
    
    const details = this.generateDetails(sharpness, brightness, contrast, faceVisibility);
    
    return { overall, sharpness, brightness, contrast, faceVisibility, details };
  }

  private calculateSharpness(pixels: Uint8ClampedArray, width: number, height: number): number {
    // Laplacian variance for blur detection
    let sum = 0;
    const gray = new Float32Array(pixels.length / 4);
    
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
    }
    
    for (let i = width + 1; i < gray.length - width - 1; i++) {
      const laplacian = 
        -1 * gray[i - width - 1] + -1 * gray[i - width] + -1 * gray[i - width + 1] +
        -1 * gray[i - 1] + 8 * gray[i] + -1 * gray[i + 1] +
        -1 * gray[i + width - 1] + -1 * gray[i + width] + -1 * gray[i + width + 1];
      sum += laplacian * laplacian;
    }
    
    const variance = sum / (width * height);
    return Math.min(100, variance / 100); // Normalize to 0-100
  }

  private calculateBrightness(pixels: Uint8ClampedArray): number {
    let sum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      sum += gray;
    }
    const avg = sum / (pixels.length / 4);
    
    // Ideal brightness is 128 (50% gray)
    const ideal = 128;
    const score = 100 - Math.abs(avg - ideal) / ideal * 100;
    return Math.max(0, Math.min(100, score));
  }

  private calculateContrast(pixels: Uint8ClampedArray): number {
    let sum = 0;
    const gray = [];
    
    for (let i = 0; i < pixels.length; i += 4) {
      const g = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      gray.push(g);
      sum += g;
    }
    
    const mean = sum / gray.length;
    let varianceSum = 0;
    
    for (const g of gray) {
      varianceSum += Math.pow(g - mean, 2);
    }
    
    const stdDev = Math.sqrt(varianceSum / gray.length);
    return Math.min(100, stdDev * 2); // Normalize to 0-100
  }

  private calculateFaceVisibility(pixels: Uint8ClampedArray): number {
    // Simplified - check for skin tone pixels
    let skinPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Simple skin tone detection
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b &&
          Math.abs(r - g) > 15 && r - g < 100) {
        skinPixels++;
      }
    }
    
    const ratio = skinPixels / (pixels.length / 4);
    return Math.min(100, ratio * 500); // Normalize to 0-100
  }

  private generateDetails(sharpness: number, brightness: number, contrast: number, faceVisibility: number): string[] {
    const details = [];
    
    if (sharpness < 50) details.push('Image appears blurry');
    if (brightness < 50) details.push('Image is too dark or too bright');
    if (contrast < 40) details.push('Low contrast - image appears flat');
    if (faceVisibility < 30) details.push('Face may not be clearly visible');
    
    if (details.length === 0) details.push('Good overall quality');
    
    return details;
  }
}

export default new QualityScoringService();
```

#### 2.2 Integrate into PhotoProcessor
Add quality score display on each photo card with color-coded indicators.

### Deliverables
- Quality scoring service
- Real-time quality metrics display
- Color-coded quality indicators (green/yellow/red)
- Improvement suggestions
- Auto-rejection threshold settings

---

## Phase 3: Smart Cropping & Auto-centering
**Priority:** HIGH  
**Complexity:** Medium  
**Estimated Time:** 2 days

### Technical Stack
- Canvas API for cropping
- Face detection from Phase 1
- Rule of thirds algorithm

### Implementation Steps

#### 3.1 Create Smart Cropping Service
**File:** `src/services/smartCropService.ts`

```typescript
import faceDetectionService from './faceDetectionService';

interface CropResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

class SmartCropService {
  async calculateOptimalCrop(imageElement: HTMLImageElement, targetWidth: number, targetHeight: number): Promise<CropResult> {
    const face = await faceDetectionService.detectFace(imageElement);
    
    if (face) {
      return this.cropAroundFace(imageElement, face, targetWidth, targetHeight);
    } else {
      return this.cropCenter(imageElement, targetWidth, targetHeight);
    }
  }

  private cropAroundFace(imageElement: HTMLImageElement, face: any, targetWidth: number, targetHeight: number): CropResult {
    const faceCenter = faceDetectionService.getFaceCenter(face.landmarks);
    
    // Calculate crop dimensions with face in center
    const aspectRatio = targetWidth / targetHeight;
    const imgAspect = imageElement.width / imageElement.height;
    
    let cropWidth, cropHeight;
    
    if (aspectRatio > imgAspect) {
      cropWidth = imageElement.width;
      cropHeight = cropWidth / aspectRatio;
    } else {
      cropHeight = imageElement.height;
      cropWidth = cropHeight * aspectRatio;
    }
    
    // Position crop to center the face
    let x = faceCenter.x - cropWidth / 2;
    let y = faceCenter.y - cropHeight / 2;
    
    // Clamp to image bounds
    x = Math.max(0, Math.min(imageElement.width - cropWidth, x));
    y = Math.max(0, Math.min(imageElement.height - cropHeight, y));
    
    return { x, y, width: cropWidth, height: cropHeight };
  }

  private cropCenter(imageElement: HTMLImageElement, targetWidth: number, targetHeight: number): CropResult {
    const aspectRatio = targetWidth / targetHeight;
    const imgAspect = imageElement.width / imageElement.height;
    
    let cropWidth, cropHeight;
    
    if (aspectRatio > imgAspect) {
      cropWidth = imageElement.width;
      cropHeight = cropWidth / aspectRatio;
    } else {
      cropHeight = imageElement.height;
      cropWidth = cropHeight * aspectRatio;
    }
    
    const x = (imageElement.width - cropWidth) / 2;
    const y = (imageElement.height - cropHeight) / 2;
    
    return { x, y, width: cropWidth, height: cropHeight };
  }

  applyCrop(imageElement: HTMLImageElement, crop: CropResult): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      imageElement,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, crop.width, crop.height
    );
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }
}

export default new SmartCropService();
```

#### 3.2 Integrate into PhotoProcessor
Add "Smart Crop" button that uses face detection to optimally crop the photo.

### Deliverables
- Smart cropping service
- Face-aware cropping
- Rule of thirds positioning
- Manual crop adjustment
- Preview before/after crop

---

## Phase 4: AI Super-Resolution (TensorFlow.js)
**Priority:** MEDIUM  
**Complexity:** High  
**Estimated Time:** 4-5 days

### Technical Stack
- TensorFlow.js
- ESRGAN or similar upscaling model
- Web Workers for background processing

### Implementation Steps

#### 4.1 Install Dependencies
```bash
npm install @tensorflow/tfjs
```

#### 4.2 Create AI Upscaling Service
**File:** `src/services/aiUpscalingService.ts`

```typescript
import * as tf from '@tensorflow/tfjs';

class AIUpscalingService {
  private model: tf.LayersModel | null = null;
  private modelLoaded = false;

  async loadModel() {
    if (this.modelLoaded) return;
    
    try {
      this.model = await tf.loadLayersModel('/models/esrgan/model.json');
      this.modelLoaded = true;
    } catch (error) {
      console.error('Failed to load AI upscaling model:', error);
      throw error;
    }
  }

  async upscale(imageElement: HTMLImageElement, scale: number = 2): Promise<Blob> {
    await this.loadModel();
    
    // Convert image to tensor
    const tensor = tf.browser.fromPixels(imageElement);
    const normalized = tensor.div(255.0);
    const batched = normalized.expandDims(0);
    
    // Run model
    const output = this.model!.predict(batched) as tf.Tensor;
    const clipped = tf.clipByValue(output, 0, 1);
    const multiplied = clipped.mul(255.0);
    
    // Convert back to image
    const canvas = document.createElement('canvas');
    const height = imageElement.height * scale;
    const width = imageElement.width * scale;
    canvas.width = width;
    canvas.height = height;
    
    await tf.browser.toPixels(multiplied.squeeze([0]), canvas);
    
    // Cleanup
    tensor.dispose();
    normalized.dispose();
    batched.dispose();
    output.dispose();
    clipped.dispose();
    multiplied.dispose();
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }
}

export default new AIUpscalingService();
```

#### 4.3 Download ESRGAN Model
Download pre-trained ESRGAN model to `public/models/esrgan/`

#### 4.4 Integrate into PhotoProcessor
Replace canvas upscaling with AI upscaling option.

### Deliverables
- AI upscaling service
- TensorFlow.js integration
- Model loading and caching
- Progress indicator during upscaling
- Fallback to canvas if AI fails

---

## Phase 5: Auto Color Correction (White Balance)
**Priority:** MEDIUM  
**Complexity:** Medium  
**Estimated Time:** 2 days

### Technical Stack
- Canvas API
- Gray World algorithm
- Histogram analysis

### Implementation Steps

#### 5.1 Create Color Correction Service
**File:** `src/services/colorCorrectionService.ts`

```typescript
class ColorCorrectionService {
  autoWhiteBalance(imageElement: HTMLImageElement): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Calculate average RGB
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      rSum += pixels[i];
      gSum += pixels[i + 1];
      bSum += pixels[i + 2];
    }
    
    const count = pixels.length / 4;
    const rAvg = rSum / count;
    const gAvg = gSum / count;
    const bAvg = bSum / count;
    
    // Calculate scaling factors (gray world assumption)
    const avg = (rAvg + gAvg + bAvg) / 3;
    const rScale = avg / rAvg;
    const gScale = avg / gAvg;
    const bScale = avg / bAvg;
    
    // Apply correction
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, pixels[i] * rScale);
      pixels[i + 1] = Math.min(255, pixels[i + 1] * gScale);
      pixels[i + 2] = Math.min(255, pixels[i + 2] * bScale);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }

  skinToneCorrection(imageElement: HTMLImageElement): Blob {
    // Similar to white balance but focused on skin tones
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let rSum = 0, gSum = 0, bSum = 0, skinCount = 0;
    
    // Identify skin pixels
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      if (this.isSkinTone(r, g, b)) {
        rSum += r;
        gSum += g;
        bSum += b;
        skinCount++;
      }
    }
    
    if (skinCount > 0) {
      const rAvg = rSum / skinCount;
      const gAvg = gSum / skinCount;
      const bAvg = bSum / skinCount;
      
      // Target skin tone (natural warm tone)
      const targetR = 200;
      const targetG = 150;
      const targetB = 130;
      
      const rScale = targetR / rAvg;
      const gScale = targetG / gAvg;
      const bScale = targetB / bAvg;
      
      // Apply correction only to skin pixels
      for (let i = 0; i < pixels.length; i += 4) {
        if (this.isSkinTone(pixels[i], pixels[i + 1], pixels[i + 2])) {
          pixels[i] = Math.min(255, pixels[i] * rScale);
          pixels[i + 1] = Math.min(255, pixels[i + 1] * gScale);
          pixels[i + 2] = Math.min(255, pixels[i + 2] * bScale);
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }

  private isSkinTone(r: number, g: number, b: number): boolean {
    return r > 95 && g > 40 && b > 20 && 
           r > g && r > b &&
           Math.abs(r - g) > 15 && r - g < 100;
  }
}

export default new ColorCorrectionService();
```

#### 5.2 Integrate into PhotoProcessor
Add "Auto Color" button with options for white balance and skin tone correction.

### Deliverables
- Auto white balance correction
- Skin tone correction
- Before/after comparison
- Intensity slider for correction strength

---

## Phase 6: Professional Retouching Tools
**Priority:** MEDIUM  
**Complexity:** High  
**Estimated Time:** 5-7 days

### Technical Stack
- Canvas API
- Gaussian blur algorithms
- Edge detection
- Color manipulation

### Implementation Steps

#### 6.1 Create Retouching Service
**File:** `src/services/retouchingService.ts`

```typescript
class RetouchingService {
  skinSmoothing(imageElement: HTMLImageElement, intensity: number = 0.5): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Create blurred version
    const blurredData = this.gaussianBlur(pixels, canvas.width, canvas.height, 3);
    
    // Blend based on skin detection
    for (let i = 0; i < pixels.length; i += 4) {
      if (this.isSkinTone(pixels[i], pixels[i + 1], pixels[i + 2])) {
        const blend = intensity;
        pixels[i] = pixels[i] * (1 - blend) + blurredData[i] * blend;
        pixels[i + 1] = pixels[i + 1] * (1 - blend) + blurredData[i + 1] * blend;
        pixels[i + 2] = pixels[i + 2] * (1 - blend) + blurredData[i + 2] * blend;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }

  redEyeRemoval(imageElement: HTMLImageElement): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Red eye detection: high red, low green/blue
      if (r > 150 && g < 100 && b < 100 && r > g * 1.5 && r > b * 1.5) {
        // Replace with dark gray
        pixels[i] = r * 0.3;
        pixels[i + 1] = g * 0.6;
        pixels[i + 2] = b * 0.8;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }

  teethWhitening(imageElement: HTMLImageElement, intensity: number = 0.3): Blob {
    // Similar to skin smoothing but for teeth detection
    // Would require face landmarks to identify mouth region
    // Simplified version here
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Teeth detection: bright, slightly yellow
      if (r > 200 && g > 200 && b > 180 && r > b) {
        pixels[i] = Math.min(255, r + (255 - r) * intensity);
        pixels[i + 1] = Math.min(255, g + (255 - g) * intensity);
        pixels[i + 2] = Math.min(255, b + (255 - b) * intensity * 0.5);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
    });
  }

  private gaussianBlur(pixels: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
    // Simplified Gaussian blur implementation
    const result = new Uint8ClampedArray(pixels);
    const kernel = this.createGaussianKernel(radius);
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let r = 0, g = 0, b = 0, sum = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[ky + radius][kx + radius];
            
            r += pixels[idx] * weight;
            g += pixels[idx + 1] * weight;
            b += pixels[idx + 2] * weight;
            sum += weight;
          }
        }
        
        const idx = (y * width + x) * 4;
        result[idx] = r / sum;
        result[idx + 1] = g / sum;
        result[idx + 2] = b / sum;
      }
    }
    
    return result;
  }

  private createGaussianKernel(radius: number): number[][] {
    const size = radius * 2 + 1;
    const kernel = [];
    const sigma = radius / 3;
    
    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        kernel[y][x] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
    }
    
    return kernel;
  }

  private isSkinTone(r: number, g: number, b: number): boolean {
    return r > 95 && g > 40 && b > 20 && 
           r > g && r > b &&
           Math.abs(r - g) > 15 && r - g < 100;
  }
}

export default new RetouchingService();
```

#### 6.2 Integrate into PhotoProcessor
Add retouching panel with sliders for each effect.

### Deliverables
- Skin smoothing with intensity control
- Red-eye removal
- Teeth whitening
- Blemish removal tool
- Subtle makeup enhancement

---

## Phase 7: Batch Processing & Automation
**Priority:** LOW  
**Complexity:** Medium  
**Estimated Time:** 3-4 days

### Implementation Steps

#### 7.1 Create Batch Processing Service
**File:** `src/services/batchProcessingService.ts`

```typescript
class BatchProcessingService {
  async processBatch(
    photos: File[],
    options: {
      autoCrop?: boolean;
      autoColor?: boolean;
      autoUpscale?: boolean;
      qualityThreshold?: number;
    },
    onProgress: (current: number, total: number) => void
  ): Promise<Blob[]> {
    const results: Blob[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      let blob = await this.fileToBlob(photo);
      
      if (options.autoCrop) {
        blob = await this.applySmartCrop(blob);
      }
      
      if (options.autoColor) {
        blob = await this.applyColorCorrection(blob);
      }
      
      if (options.autoUpscale) {
        blob = await this.applyUpscaling(blob);
      }
      
      results.push(blob);
      onProgress(i + 1, photos.length);
    }
    
    return results;
  }

  private async fileToBlob(file: File): Promise<Blob> {
    return file;
  }

  private async applySmartCrop(blob: Blob): Promise<Blob> {
    // Integrate with smart crop service
    return blob;
  }

  private async applyColorCorrection(blob: Blob): Promise<Blob> {
    // Integrate with color correction service
    return blob;
  }

  private async applyUpscaling(blob: Blob): Promise<Blob> {
    // Integrate with upscaling service
    return blob;
  }
}

export default new BatchProcessingService();
```

#### 7.2 Add Batch Processing UI
Create batch processing modal with progress bar and options.

### Deliverables
- Batch processing service
- Progress tracking
- Auto-apply settings
- Quality-based sorting
- Duplicate detection

---

## Phase 8: Advanced Export Options
**Priority:** LOW  
**Complexity:** Low  
**Estimated Time:** 2 days

### Implementation Steps

#### 8.1 Create Export Service
**File:** `src/services/exportService.ts`

```typescript
interface ExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number;
  resolution: 'web' | 'print' | 'custom';
  customWidth?: number;
  customHeight?: number;
  colorSpace?: 'srgb' | 'cmyk';
}

class ExportService {
  async export(blob: Blob, options: ExportOptions): Promise<Blob> {
    const img = await this.blobToImage(blob);
    const canvas = document.createElement('canvas');
    
    // Set resolution
    if (options.resolution === 'web') {
      canvas.width = 800;
      canvas.height = 600;
    } else if (options.resolution === 'print') {
      canvas.width = 3000;
      canvas.height = 2250;
    } else {
      canvas.width = options.customWidth || 800;
      canvas.height = options.customHeight || 600;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), `image/${options.format}`, options.quality / 100);
    });
  }

  private blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }
}

export default new ExportService();
```

#### 8.2 Add Export Options UI
Create export modal with format, quality, and resolution options.

### Deliverables
- Multiple format export (PNG, JPG, WebP)
- Quality control slider
- Resolution presets
- Color space options
- Batch export functionality

---

## Phase 9: Security Features (Watermarking)
**Priority:** LOW  
**Complexity:** Medium  
**Estimated Time:** 3 days

### Implementation Steps

#### 9.1 Create Watermarking Service
**File:** `src/services/watermarkingService.ts`

```typescript
class WatermarkingService {
  addInvisibleWatermark(blob: Blob, data: string): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise<Blob>((resolve) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Encode data in LSB of blue channel
        const binary = this.stringToBinary(data);
        let bitIndex = 0;
        
        for (let i = 0; i < pixels.length && bitIndex < binary.length; i += 4) {
          const blueBit = parseInt(binary[bitIndex]);
          pixels[i + 2] = (pixels[i + 2] & 0xFE) | blueBit;
          bitIndex++;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      };
      img.src = URL.createObjectURL(blob);
    });
  }

  extractWatermark(blob: Blob): string {
    // Extract data from LSB of blue channel
    return '';
  }

  addQRCode(blob: Blob, data: string): Promise<Blob> {
    // Add QR code to corner of image
    return Promise.resolve(blob);
  }

  private stringToBinary(str: string): string {
    return str.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  }
}

export default new WatermarkingService();
```

#### 9.2 Integrate into PhotoProcessor
Add watermarking options in export dialog.

### Deliverables
- Invisible watermarking (LSB steganography)
- QR code embedding
- Digital signature support
- Watermark verification tool

---

## Phase 10: 3D/Depth Effects
**Priority:** LOW  
**Complexity:** High  
**Estimated Time:** 5-7 days

### Implementation Steps

#### 10.1 Create Depth Effects Service
**File:** `src/services/depthEffectsService.ts`

```typescript
class DepthEffectsService {
  async generateDepthMap(blob: Blob): Promise<Blob> {
    // Use MiDaS or similar depth estimation model
    // This would require TensorFlow.js integration
    return blob;
  }

  applyPortraitMode(blob: Blob, depthMap: Blob, blurAmount: number): Promise<Blob> {
    // Apply blur based on depth map
    return Promise.resolve(blob);
  }

  apply3DEffect(blob: Blob, depthMap: Blob): Promise<Blob> {
    // Create subtle 3D parallax effect
    return Promise.resolve(blob);
  }
}

export default new DepthEffectsService();
```

#### 10.2 Integrate into PhotoProcessor
Add depth effects panel with blur intensity slider.

### Deliverables
- Depth map generation
- Portrait mode (background blur)
- 3D parallax effect
- Depth-based lighting

---

## Implementation Order & Dependencies

```
Phase 1 (Face Detection) → Phase 2 (Quality Scoring) → Phase 3 (Smart Cropping)
                                                                    ↓
Phase 4 (AI Upscaling) ← Phase 5 (Color Correction) ← Phase 6 (Retouching)
                                                                    ↓
                         Phase 7 (Batch Processing) ← Phase 8 (Export)
                                                                    ↓
                         Phase 9 (Watermarking) ← Phase 10 (Depth Effects)
```

## Performance Considerations

1. **Web Workers**: Use Web Workers for CPU-intensive operations (upscaling, blur)
2. **Model Caching**: Cache loaded models in memory
3. **Lazy Loading**: Load models only when needed
4. **Progress Indicators**: Show progress for long operations
5. **Memory Management**: Dispose of tensors and large objects properly

## Testing Strategy

1. **Unit Tests**: Test each service independently
2. **Integration Tests**: Test services working together
3. **Performance Tests**: Measure processing time for large batches
4. **Cross-browser Testing**: Ensure compatibility across browsers
5. **Mobile Testing**: Test on mobile devices

## Deployment Checklist

- [ ] All models downloaded to public/models/
- [ ] Web Worker files properly configured
- [ ] Memory limits configured
- [ ] Error handling implemented
- [ ] Fallback mechanisms in place
- [ ] Progress indicators added
- [ ] Documentation updated

---

## Summary

This implementation plan provides a structured approach to adding advanced image features to GOTEK. Starting with high-priority features (face detection, quality scoring, smart cropping) ensures immediate value while building a foundation for more complex features later.

**Total Estimated Time:** 28-40 days  
**Recommended Team Size:** 1-2 developers  
**Key Technologies:** face-api.js, TensorFlow.js, Canvas API, Web Workers
