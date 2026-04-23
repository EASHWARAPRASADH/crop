import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { uploadService } from '@/services/dataService';
import { Upload, Camera, RotateCw, Crop, Download, Check } from 'lucide-react';

interface PhotoEditorProps {
  onClose: () => void;
  onSave: (url: string) => void;
  orderId: string;
}

export const PhotoEditor = ({ onClose, onSave, orderId }: PhotoEditorProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [scale, setScale] = useState(1);
  const [bgColor, setBgColor] = useState('transparent');
  const [rotation, setRotation] = useState(0);
  
  // Cropping
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (image && canvasRef.current) {
      drawImage();
    }
  }, [image, brightness, contrast, saturation, scale, bgColor, rotation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          // Auto-resize to ID card photo preset (1x1 inch at 300 DPI = 300x300 px)
          setScale(300 / Math.max(img.width, img.height));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            
            const img = new Image();
            img.onload = () => {
              setImage(img);
              setScale(300 / Math.max(img.width, img.height));
            };
            img.src = URL.createObjectURL(blob);
          }
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg');
      };
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera');
    }
  };

  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Set canvas size to ID card photo preset (300x300 for 1x1 inch at 300 DPI)
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Save context state
    ctx.save();

    // Apply rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Calculate dimensions
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Draw image
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    // Restore context
    ctx.restore();
  };

  const handleSave = async () => {
    if (!canvasRef.current || !imageFile) {
      toast.error('No image to save');
      return;
    }

    setIsUploading(true);

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current?.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
      });

      // Create a File from the blob for upload
      const file = new File([blob], imageFile.name || 'photo.jpg', { type: 'image/jpeg' });

      // Upload via Node.js API
      const result = await uploadService.uploadPhoto(file);

      onSave(result.url);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Photo Editor</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Preview Canvas */}
          <div className="md:col-span-2">
            <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center bg-muted/30 min-h-[400px]">
              {image ? (
                <canvas
                  ref={canvasRef}
                  className="max-w-full border-2 border-border rounded shadow-lg"
                />
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No image selected</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <Button variant="outline" onClick={handleCameraCapture}>
                      <Camera className="w-4 h-4 mr-2" />
                      Use Camera
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {!image && (
              <div className="space-y-2">
                <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <Button variant="outline" onClick={handleCameraCapture} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {image && (
              <Tabs defaultValue="adjust" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="adjust">Adjust</TabsTrigger>
                  <TabsTrigger value="background">Background</TabsTrigger>
                </TabsList>

                <TabsContent value="adjust" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Zoom ({(scale * 100).toFixed(0)}%)</Label>
                    <Slider
                      value={[scale * 100]}
                      onValueChange={(v) => setScale(v[0] / 100)}
                      min={10}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Brightness ({brightness}%)</Label>
                    <Slider
                      value={[brightness]}
                      onValueChange={(v) => setBrightness(v[0])}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contrast ({contrast}%)</Label>
                    <Slider
                      value={[contrast]}
                      onValueChange={(v) => setContrast(v[0])}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Saturation ({saturation}%)</Label>
                    <Slider
                      value={[saturation]}
                      onValueChange={(v) => setSaturation(v[0])}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation ({rotation}°)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[rotation]}
                        onValueChange={(v) => setRotation(v[0])}
                        min={0}
                        max={360}
                        step={15}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="background" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Select value={bgColor} onValueChange={setBgColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transparent">Transparent</SelectItem>
                        <SelectItem value="#FFFFFF">White</SelectItem>
                        <SelectItem value="#E3F2FD">Light Blue</SelectItem>
                        <SelectItem value="#FFEBEE">Light Red</SelectItem>
                        <SelectItem value="#E8F5E9">Light Green</SelectItem>
                        <SelectItem value="#F5F5F5">Light Gray</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    <p>💡 Tip: Use background removal tools for better results. Currently showing simple background color replacement.</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!image || isUploading}>
            <Check className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

