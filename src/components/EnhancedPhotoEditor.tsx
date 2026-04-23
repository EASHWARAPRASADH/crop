import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Crop, RotateCw, ZoomIn, ZoomOut, Palette, Check, X, Wand2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { uploadService } from "@/services/dataService";
import { useAuth } from "@/hooks/useAuth";
import { useOrder } from "@/hooks/useOrder";

interface EnhancedPhotoEditorProps {
  onSave: (url: string) => void;
  onCancel: () => void;
  initialImage?: string;
}

export const EnhancedPhotoEditor: React.FC<EnhancedPhotoEditorProps> = ({ onSave, onCancel, initialImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentOrder } = useOrder();

  const CANVAS_WIDTH = 300;
  const CANVAS_HEIGHT = 300;
  const DPI = 300;

  useEffect(() => {
    if (imageSrc) {
      loadImageToCanvas(imageSrc);
    }
  }, [imageSrc, zoom, brightness, contrast, saturation, rotation, backgroundColor, imageOffset]);

  const loadImageToCanvas = (src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.src = src;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background color
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Center and scale image
    const imgWidth = img.width * zoom;
    const imgHeight = img.height * zoom;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX + imageOffset.x, centerY + imageOffset.y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

    ctx.restore();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setImageSrc(src);
        setOriginalImageSrc(src);
        resetImageState();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const captureCanvas = document.createElement("canvas");
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext("2d");

        const takePhoto = () => {
          ctx?.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
          const src = captureCanvas.toDataURL("image/png");
          setImageSrc(src);
          setOriginalImageSrc(src);
          stream.getTracks().forEach(track => track.stop());
          resetImageState();
        };

        setTimeout(takePhoto, 1000);
      };
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Failed to access camera. Please ensure permissions are granted.");
    }
  };

  const resetImageState = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setImageOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageSrc) {
      setIsDragging(true);
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastPosition.x;
      const dy = e.clientY - lastPosition.y;
      setImageOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const removeBackground = async () => {
    if (!imageSrc || !originalImageSrc) {
      toast.error("No image to process");
      return;
    }

    setIsRemovingBackground(true);
    try {
      // Convert image to blob
      const response = await fetch(originalImageSrc);
      const blob = await response.blob();

      // Create FormData for the API call
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      // Call Rembg API (you would replace this with your actual API endpoint)
      const rembgResponse = await fetch('/api/rembg', {
        method: 'POST',
        body: formData,
      });

      if (!rembgResponse.ok) {
        throw new Error('Background removal failed');
      }

      const processedBlob = await rembgResponse.blob();
      const processedUrl = URL.createObjectURL(processedBlob);
      
      setImageSrc(processedUrl);
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background. Using original image.");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const restoreOriginal = () => {
    if (originalImageSrc) {
      setImageSrc(originalImageSrc);
      resetImageState();
      toast.info("Restored original image");
    }
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !user || !currentOrder) {
      toast.error("No image to save or user not logged in/no active order.");
      return;
    }

    setIsLoading(true);
    try {
      // Convert canvas to Blob
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1));

      if (!blob) {
        toast.error("Failed to create image blob.");
        setIsLoading(false);
        return;
      }

      // Upload via Node.js API
      const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
      const result = await uploadService.uploadPhoto(file);

      onSave(result.url);
      toast.success("Photo saved and uploaded!");
    } catch (error: any) {
      console.error("Error uploading photo:", error.message);
      toast.error(`Failed to upload photo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={handleCameraCapture} variant="outline">
          <Camera className="w-4 h-4 mr-2" /> Capture from Camera
        </Button>
        <Input type="file" accept="image/*" onChange={handleFileChange} className="w-auto" />
      </div>

      {imageSrc && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center space-y-4">
            <div className="relative border-2 border-dashed rounded-lg overflow-hidden w-[300px] h-[300px] flex items-center justify-center bg-muted/30">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="max-w-full max-h-full cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setRotation(prev => (prev + 90) % 360)}>
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={resetImageState}>Reset</Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={removeBackground} 
                disabled={isRemovingBackground}
                variant="outline"
                className="bg-purple-50 hover:bg-purple-100"
              >
                {isRemovingBackground ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                {isRemovingBackground ? "Removing..." : "Remove Background"}
              </Button>
              
              {originalImageSrc && originalImageSrc !== imageSrc && (
                <Button onClick={restoreOriginal} variant="outline">
                  Restore Original
                </Button>
              )}
              
              <Button onClick={downloadImage} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                {["#ffffff", "#0000ff", "#ff0000", "#008000", "#800080", "transparent"].map(color => (
                  <Button
                    key={color}
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 rounded-full ${backgroundColor === color ? "ring-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color === "transparent" ? "#f0f0f0" : color }}
                    onClick={() => setBackgroundColor(color)}
                  >
                    {color === "transparent" && <X className="w-4 h-4" />}
                  </Button>
                ))}
                <Input
                  type="color"
                  value={backgroundColor === "transparent" ? "#ffffff" : backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 p-0 border-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Brightness ({brightness}%)</Label>
              <Slider
                value={[brightness]}
                onValueChange={([val]) => setBrightness(val)}
                max={200}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Contrast ({contrast}%)</Label>
              <Slider
                value={[contrast]}
                onValueChange={([val]) => setContrast(val)}
                max={200}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Saturation ({saturation}%)</Label>
              <Slider
                value={[saturation]}
                onValueChange={([val]) => setSaturation(val)}
                max={200}
                step={1}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
        <Button onClick={handleSave} disabled={!imageSrc || isLoading}>
          {isLoading ? "Saving..." : <><Check className="w-4 h-4 mr-2" /> Save Photo</>}
        </Button>
      </div>
    </div>
  );
};
