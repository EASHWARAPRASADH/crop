/**
 * Face Detection Service
 * 
 * Provides face detection, alignment, and analysis capabilities using face-api.js
 * This service is designed for ID card photo processing with features like:
 * - Face detection and bounding box extraction
 * - Face landmark detection (68 points)
 * - Face alignment (rotation correction)
 * - Face centering calculation
 * - Face quality scoring
 */

import * as faceapi from 'face-api.js';

// Type definitions for face-api.js results
interface FaceDetectionResult {
  detected: boolean;
  face?: faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>;
  boundingBox?: faceapi.Box;
  landmarks?: faceapi.FaceLandmarks68;
  confidence?: number;
  error?: string;
}

interface FaceCenter {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceAlignment {
  rotation: number; // in degrees
  tilt: number; // head tilt
}

interface FaceQuality {
  overall: number; // 0-100
  sharpness: number;
  brightness: number;
  centered: number;
  size: number;
}

class FaceDetectionService {
  private modelsLoaded = false;
  private modelLoadingPromise: Promise<void> | null = null;
  private modelBaseUrl: string = '/models';

  /**
   * Load all required face-api.js models
   * Models are loaded only once and cached
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      return;
    }

    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelLoadingPromise = this._loadModelsInternal();
    await this.modelLoadingPromise;
  }

  private async _loadModelsInternal(): Promise<void> {
    try {
      console.log('[FaceDetectionService] Loading face-api.js models...');
      
      // Load SSD MobileNet V1 for better accuracy (5.4MB)
      await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelBaseUrl);
      
      // Load Face Landmark Detection (68 points)
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelBaseUrl);
      
      // Skip face recognition and expression models for now to avoid compatibility issues
      // These can be added later if needed
      
      this.modelsLoaded = true;
      console.log('[FaceDetectionService] SSD MobileNet + Landmark models loaded successfully');
    } catch (error) {
      console.error('[FaceDetectionService] Failed to load models:', error);
      this.modelLoadingPromise = null;
      throw new Error(`Failed to load face-api.js models: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect face in an image element
   * @param imageElement - HTMLImageElement or HTMLCanvasElement to analyze
   * @returns FaceDetectionResult with detection data
   */
  async detectFace(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult> {
    try {
      await this.loadModels();

      console.log('[FaceDetectionService] Starting face detection on image:', imageElement.width, 'x', imageElement.height);

      // Preprocess image to ensure minimum size for detection
      let processedImage = imageElement;
      if (imageElement.width < 200 || imageElement.height < 200) {
        console.log('[FaceDetectionService] Image too small, resizing...');
        processedImage = this.resizeImage(imageElement, 400);
      }

      // Use SSD MobileNet with better options for accurate detection
      const detections = await faceapi
        .detectAllFaces(processedImage, new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.3, // Lower threshold for more detections
          maxResults: 1, // Only get the best face
        }))
        .withFaceLandmarks();

      console.log('[FaceDetectionService] Found', detections?.length || 0, 'face(s)');

      if (!detections || detections.length === 0) {
        return {
          detected: false,
          error: 'No face detected in image. Try using a clearer photo with a visible face.'
        };
      }

      // Return the first (primary) face
      const face = detections[0];
      console.log('[FaceDetectionService] Face detected with confidence:', face.detection.score);
      
      return {
        detected: true,
        face,
        boundingBox: face.detection.box,
        landmarks: face.landmarks,
        confidence: face.detection.score
      };
    } catch (error) {
      console.error('[FaceDetectionService] Face detection error:', error);
      return {
        detected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Resize image to minimum dimensions for better face detection
   * @param imageElement - Source image
   * @param minSize - Minimum dimension size
   * @returns Resized image as canvas
   */
  private resizeImage(imageElement: HTMLImageElement | HTMLCanvasElement, minSize: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const scale = Math.max(minSize / imageElement.width, minSize / imageElement.height);
    
    if (scale > 1) {
      canvas.width = imageElement.width * scale;
      canvas.height = imageElement.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      console.log('[FaceDetectionService] Resized to:', canvas.width, 'x', canvas.height);
      return canvas;
    }
    
    // If no scaling needed, return original as canvas
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    return canvas;
  }

  /**
   * Detect all faces in an image
   * @param imageElement - HTMLImageElement or HTMLCanvasElement to analyze
   * @returns Array of FaceDetectionResult
   */
  async detectAllFaces(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult[]> {
    try {
      await this.loadModels();

      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        return [];
      }

      return detections.map(face => ({
        detected: true,
        face,
        boundingBox: face.detection.box,
        landmarks: face.landmarks,
        confidence: face.detection.score
      }));
    } catch (error) {
      console.error('[FaceDetectionService] Multiple face detection error:', error);
      return [];
    }
  }

  /**
   * Calculate the center point and dimensions of a face
   * @param landmarks - Face landmarks from detection
   * @returns FaceCenter with x, y, width, height
   */
  getFaceCenter(landmarks: faceapi.FaceLandmarks68): FaceCenter {
    const jaw = landmarks.getJawOutline();
    const left = jaw[0];
    const right = jaw[jaw.length - 1];
    const top = landmarks.positions[27]; // Nose bridge
    const bottom = landmarks.positions[8]; // Chin

    return {
      x: (left.x + right.x) / 2,
      y: (top.y + bottom.y) / 2,
      width: right.x - left.x,
      height: bottom.y - top.y
    };
  }

  /**
   * Calculate face rotation (tilt) based on eye positions
   * @param landmarks - Face landmarks from detection
   * @returns Rotation angle in degrees (positive = clockwise)
   */
  calculateFaceRotation(landmarks: faceapi.FaceLandmarks68): number {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEyeCenter = this.getPointCenter(leftEye);
    const rightEyeCenter = this.getPointCenter(rightEye);
    
    const deltaY = rightEyeCenter.y - leftEyeCenter.y;
    const deltaX = rightEyeCenter.x - leftEyeCenter.x;
    
    // Calculate angle in degrees
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * (180 / Math.PI);
    
    return angleDeg;
  }

  /**
   * Calculate head tilt (roll) based on face landmarks
   * @param landmarks - Face landmarks from detection
   * @returns Tilt angle in degrees
   */
  calculateHeadTilt(landmarks: faceapi.FaceLandmarks68): number {
    const nose = landmarks.getNose();
    const noseTip = nose[3]; // Nose tip
    const noseBridge = nose[0]; // Nose bridge
    
    // Calculate vertical alignment
    const deltaX = noseTip.x - noseBridge.x;
    
    // Small tilt indicates good alignment
    return deltaX;
  }

  /**
   * Get face alignment data including rotation and tilt
   * @param landmarks - Face landmarks from detection
   * @returns FaceAlignment with rotation and tilt
   */
  getFaceAlignment(landmarks: faceapi.FaceLandmarks68): FaceAlignment {
    return {
      rotation: this.calculateFaceRotation(landmarks),
      tilt: this.calculateHeadTilt(landmarks)
    };
  }

  /**
   * Calculate the center point of an array of face points
   * @param points - Array of face-api.js Point objects
   * @returns Center point {x, y}
   */
  private getPointCenter(points: faceapi.Point[]): { x: number; y: number } {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  }

  /**
   * Calculate face quality score based on various metrics
   * @param detectionResult - Face detection result
   * @param imageWidth - Width of the source image
   * @param imageHeight - Height of the source image
   * @returns FaceQuality with individual scores and overall score
   */
  calculateFaceQuality(
    detectionResult: FaceDetectionResult,
    imageWidth: number,
    imageHeight: number
  ): FaceQuality {
    if (!detectionResult.detected || !detectionResult.boundingBox) {
      return {
        overall: 0,
        sharpness: 0,
        brightness: 0,
        centered: 0,
        size: 0
      };
    }

    const { boundingBox, landmarks, confidence } = detectionResult;
    
    // Size score: face should occupy 30-70% of image
    const faceArea = boundingBox.width * boundingBox.height;
    const imageArea = imageWidth * imageHeight;
    const faceRatio = faceArea / imageArea;
    const idealRatio = 0.4; // 40% of image
    const sizeScore = Math.max(0, 100 - Math.abs(faceRatio - idealRatio) / idealRatio * 100);

    // Centered score: face should be centered in image
    const faceCenterX = boundingBox.x + boundingBox.width / 2;
    const faceCenterY = boundingBox.y + boundingBox.height / 2;
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;
    const distanceX = Math.abs(faceCenterX - imageCenterX) / imageWidth;
    const distanceY = Math.abs(faceCenterY - imageCenterY) / imageHeight;
    const centeredScore = Math.max(0, 100 - (distanceX + distanceY) * 100);

    // Confidence score from detection
    const confidenceScore = (confidence || 0) * 100;

    // Sharpness score (simplified - would need pixel analysis)
    const sharpnessScore = 80; // Placeholder - would need actual sharpness calculation

    // Brightness score (simplified - would need pixel analysis)
    const brightnessScore = 80; // Placeholder - would need actual brightness calculation

    // Calculate overall score (weighted average)
    const overall = (
      sizeScore * 0.25 +
      centeredScore * 0.25 +
      confidenceScore * 0.25 +
      sharpnessScore * 0.15 +
      brightnessScore * 0.10
    );

    return {
      overall: Math.round(overall),
      sharpness: Math.round(sharpnessScore),
      brightness: Math.round(brightnessScore),
      centered: Math.round(centeredScore),
      size: Math.round(sizeScore)
    };
  }

  /**
   * Align face by rotating image to correct face rotation
   * @param imageElement - Source image
   * @param rotation - Rotation angle in degrees
   * @returns Canvas with rotated image
   */
  alignFace(imageElement: HTMLImageElement | HTMLCanvasElement, rotation: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotate
    ctx.rotate(-rotation * Math.PI / 180);
    
    // Draw image centered
    ctx.drawImage(
      imageElement,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );
    
    return canvas;
  }

  /**
   * Crop image to center and focus on face
   * @param imageElement - Source image
   * @param faceCenter - Face center coordinates
   * @param targetWidth - Target crop width
   * @param targetHeight - Target crop height
   * @param padding - Padding around face (default: 1.5 = 150% of face size)
   * @returns Canvas with cropped image
   */
  cropToFace(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    faceCenter: FaceCenter,
    targetWidth: number,
    targetHeight: number,
    padding: number = 1.5
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Calculate crop dimensions based on face size
    const cropWidth = faceCenter.width * padding;
    const cropHeight = faceCenter.height * padding;
    
    // Calculate crop position (centered on face)
    const cropX = faceCenter.x - cropWidth / 2;
    const cropY = faceCenter.y - cropHeight / 2;
    
    // Draw cropped image
    ctx.drawImage(
      imageElement,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );
    
    return canvas;
  }

  /**
   * Check if face meets ID card photo requirements
   * @param detectionResult - Face detection result
   * @param imageWidth - Image width
   * @param imageHeight - Image height
   * @returns Object with compliance status and issues
   */
  checkIDCardCompliance(
    detectionResult: FaceDetectionResult,
    imageWidth: number,
    imageHeight: number
  ): {
    compliant: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!detectionResult.detected) {
      return {
        compliant: false,
        issues: ['No face detected in image'],
        warnings: []
      };
    }

    const { boundingBox, landmarks, confidence } = detectionResult;
    const quality = this.calculateFaceQuality(detectionResult, imageWidth, imageHeight);

    // Check face size
    if (quality.size < 50) {
      issues.push('Face is too small in the image');
    } else if (quality.size < 70) {
      warnings.push('Face could be larger for better quality');
    }

    // Check face centering
    if (quality.centered < 60) {
      issues.push('Face is not properly centered');
    } else if (quality.centered < 80) {
      warnings.push('Face could be better centered');
    }

    // Check confidence
    if ((confidence || 0) < 0.7) {
      warnings.push('Face detection confidence is low');
    }

    // Check rotation
    if (landmarks) {
      const rotation = this.calculateFaceRotation(landmarks);
      if (Math.abs(rotation) > 15) {
        issues.push('Face is tilted too much');
      } else if (Math.abs(rotation) > 5) {
        warnings.push('Face is slightly tilted');
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Get face landmarks as an array of points
   * @param landmarks - Face landmarks from detection
   * @returns Array of {x, y} points
   */
  getLandmarksAsPoints(landmarks: faceapi.FaceLandmarks68): Array<{ x: number; y: number }> {
    return landmarks.positions.map(point => ({
      x: point.x,
      y: point.y
    }));
  }

  /**
   * Get specific facial features as point arrays
   * @param landmarks - Face landmarks from detection
   * @returns Object with different facial feature point arrays
   */
  getFacialFeatures(landmarks: faceapi.FaceLandmarks68): {
    jaw: Array<{ x: number; y: number }>;
    leftEye: Array<{ x: number; y: number }>;
    rightEye: Array<{ x: number; y: number }>;
    nose: Array<{ x: number; y: number }>;
    mouth: Array<{ x: number; y: number }>;
  } {
    return {
      jaw: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y })),
      leftEye: landmarks.getLeftEye().map(p => ({ x: p.x, y: p.y })),
      rightEye: landmarks.getRightEye().map(p => ({ x: p.x, y: p.y })),
      nose: landmarks.getNose().map(p => ({ x: p.x, y: p.y })),
      mouth: landmarks.getMouth().map(p => ({ x: p.x, y: p.y }))
    };
  }

  /**
   * Set custom model base URL
   * @param url - Base URL for model files
   */
  setModelBaseUrl(url: string): void {
    this.modelBaseUrl = url;
  }

  /**
   * Check if models are loaded
   * @returns true if models are loaded
   */
  isModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  /**
   * Reset the service (useful for testing or reinitialization)
   */
  reset(): void {
    this.modelsLoaded = false;
    this.modelLoadingPromise = null;
  }

  /**
   * Draw face detection overlay on canvas
   * @param canvas - Canvas to draw on
   * @param detectionResult - Face detection result
   * @param imageWidth - Original image width
   * @param imageHeight - Original image height
   */
  drawDetectionOverlay(
    canvas: HTMLCanvasElement,
    detectionResult: FaceDetectionResult,
    imageWidth: number,
    imageHeight: number
  ): void {
    if (!detectionResult.detected || !detectionResult.landmarks || !detectionResult.boundingBox) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = canvas.width / imageWidth;
    const scaleY = canvas.height / imageHeight;

    // Draw bounding box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      detectionResult.boundingBox.x * scaleX,
      detectionResult.boundingBox.y * scaleY,
      detectionResult.boundingBox.width * scaleX,
      detectionResult.boundingBox.height * scaleY
    );

    // Draw confidence score
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(
      `${Math.round((detectionResult.confidence || 0) * 100)}%`,
      detectionResult.boundingBox.x * scaleX,
      detectionResult.boundingBox.y * scaleY - 5
    );

    // Draw face landmarks
    ctx.fillStyle = '#ff0000';
    const landmarks = detectionResult.landmarks.positions;
    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw key facial features with different colors
    const features = this.getFacialFeatures(detectionResult.landmarks);

    // Eyes (blue)
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    this.drawFeaturePath(ctx, features.leftEye, scaleX, scaleY);
    this.drawFeaturePath(ctx, features.rightEye, scaleX, scaleY);

    // Nose (yellow)
    ctx.strokeStyle = '#ffcc00';
    this.drawFeaturePath(ctx, features.nose, scaleX, scaleY);

    // Mouth (green)
    ctx.strokeStyle = '#00cc66';
    this.drawFeaturePath(ctx, features.mouth, scaleX, scaleY);

    // Jaw (cyan)
    ctx.strokeStyle = '#00cccc';
    this.drawFeaturePath(ctx, features.jaw, scaleX, scaleY);
  }

  private drawFeaturePath(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    scaleX: number,
    scaleY: number
  ): void {
    if (points.length === 0) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
    }
    ctx.stroke();
  }
}

// Export singleton instance
export default new FaceDetectionService();

// Export types for use in other modules
export type {
  FaceDetectionResult,
  FaceCenter,
  FaceAlignment,
  FaceQuality
};
