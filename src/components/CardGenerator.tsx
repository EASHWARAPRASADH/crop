import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Download, Eye, FileText, Image, QrCode, Loader2, Settings, Palette } from 'lucide-react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { replaceFieldsInText, formatFieldValue, PREDEFINED_FIELDS } from '@/utils/dynamicFields';

interface Student {
  id: string;
  student_name: string;
  father_name?: string;
  class: string;
  section?: string;
  roll_number?: string;
  student_id?: string;
  date_of_birth?: string;
  address?: string;
  gender?: string;
  phone_number?: string;
  blood_group?: string;
  photo_url?: string;
}

interface Template {
  id: string;
  name: string;
  design_data: any;
  orientation: 'portrait' | 'landscape';
  canvas_type?: 'konva' | 'fabric';
  version?: number;
}

interface CardGeneratorProps {
  students: Student[];
  template: Template;
  onComplete: () => void;
}

export const CardGenerator: React.FC<CardGeneratorProps> = ({
  students,
  template,
  onComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStudent, setCurrentStudent] = useState<string>('');
  const [generatedCards, setGeneratedCards] = useState<string[]>([]);
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState({
    dpi: 300,
    quality: 1.0,
    format: 'png' as 'png' | 'pdf' | 'zip',
    includeBleed: false,
    bleedSize: 3,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 100,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch {
      return '';
    }
  };

  const renderBackgroundImage = async (ctx: CanvasRenderingContext2D, imageUrl: string, width: number, height: number) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = imageUrl;
    });
  };

  const generateCard = async (student: Student): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size based on template orientation and DPI
    const isPortrait = template.orientation === 'portrait';
    const baseWidth = isPortrait ? 300 : 400;
    const baseHeight = isPortrait ? 400 : 300;
    
    // Scale for DPI
    const dpiScale = exportSettings.dpi / 72; // 72 is default DPI
    canvas.width = baseWidth * dpiScale;
    canvas.height = baseHeight * dpiScale;
    
    // Scale context for DPI
    ctx.scale(dpiScale, dpiScale);

    // Clear canvas
    ctx.clearRect(0, 0, baseWidth, baseHeight);

    // Set background
    if (template.design_data.background) {
      if (template.design_data.background.color) {
        ctx.fillStyle = template.design_data.background.color;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
      }
      if (template.design_data.background.image) {
        await renderBackgroundImage(ctx, template.design_data.background.image, baseWidth, baseHeight);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);
    }

    // Load template elements
    if (template.design_data.elements) {
      // Sort elements by zIndex for proper layering
      const sortedElements = [...template.design_data.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      for (const element of sortedElements) {
        if (element.visible !== false) {
          await renderElement(ctx, element, student, baseWidth, baseHeight);
        }
      }
    }

    return canvas.toDataURL('image/png', exportSettings.quality);
  };

  const renderElement = async (
    ctx: CanvasRenderingContext2D,
    element: any,
    student: Student,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Support both Konva and Fabric coordinate systems
    const x = element.x || element.left || 0;
    const y = element.y || element.top || 0;
    const width = element.width || 100;
    const height = element.height || 100;
    const rotation = element.rotation || element.angle || 0;
    const opacity = element.opacity || 1;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    switch (element.type) {
      case 'text':
        await renderText(ctx, element, student);
        break;
      case 'rect':
      case 'rectangle':
        renderRectangle(ctx, element);
        break;
      case 'circle':
        renderCircle(ctx, element);
        break;
      case 'image':
        await renderImage(ctx, element, student);
        break;
      case 'shape':
        renderShape(ctx, element);
        break;
      case 'dynamic-field':
        await renderDynamicField(ctx, element, student);
        break;
      case 'qr-code':
        await renderQRCode(ctx, element, student);
        break;
      case 'background':
        await renderBackgroundElement(ctx, element, canvasWidth, canvasHeight);
        break;
    }

    ctx.restore();
  };

  const renderText = async (ctx: CanvasRenderingContext2D, element: any, student: Student) => {
    const { 
      text, 
      fontSize = 16, 
      fontFamily = 'Arial', 
      fontWeight = 'normal',
      fontStyle = 'normal',
      fill = '#000000', 
      stroke,
      strokeWidth = 0,
      textAlign = 'left' 
    } = element;
    
    // Build font string
    let fontString = '';
    if (fontStyle !== 'normal') fontString += fontStyle + ' ';
    if (fontWeight !== 'normal') fontString += fontWeight + ' ';
    fontString += `${fontSize}px ${fontFamily}`;
    
    ctx.font = fontString;
    ctx.fillStyle = fill;
    ctx.textAlign = textAlign as CanvasTextAlign;
    
    // Apply stroke if specified
    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, 0, 0);
    }
    
    ctx.fillText(text, 0, 0);
  };

  const renderImage = async (ctx: CanvasRenderingContext2D, element: any, student: Student) => {
    const { src, width, height, cropX = 0, cropY = 0, cropWidth, cropHeight } = element;
    
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cropWidth && cropHeight) {
          // Draw cropped image
          ctx.drawImage(
            img, 
            cropX, cropY, cropWidth, cropHeight,
            0, 0, width, height
          );
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  };

  const renderRectangle = (ctx: CanvasRenderingContext2D, element: any) => {
    const { width, height, fill = '#000000', stroke, strokeWidth = 0, cornerRadius = 0 } = element;
    
    ctx.fillStyle = fill;
    
    if (cornerRadius > 0) {
      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, cornerRadius);
      ctx.fill();
      
      if (stroke && strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    } else {
      // Draw regular rectangle
      ctx.fillRect(0, 0, width, height);
      
      if (stroke && strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(0, 0, width, height);
      }
    }
  };

  const renderCircle = (ctx: CanvasRenderingContext2D, element: any) => {
    const { width, height, fill = '#000000', stroke, strokeWidth = 0 } = element;
    const radius = Math.min(width, height) / 2;
    
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
    
    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  const renderBackgroundElement = async (ctx: CanvasRenderingContext2D, element: any, canvasWidth: number, canvasHeight: number) => {
    const { src, color } = element;
    
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    if (src) {
      await renderBackgroundImage(ctx, src, canvasWidth, canvasHeight);
    }
  };

  const renderShape = (ctx: CanvasRenderingContext2D, element: any) => {
    const { shape, width, height, fill = '#000000' } = element;
    
    ctx.fillStyle = fill;
    
    if (shape === 'rect') {
      ctx.fillRect(0, 0, width, height);
    } else if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const renderDynamicField = async (ctx: CanvasRenderingContext2D, element: any, student: Student) => {
    const { 
      field, 
      fontSize = 16, 
      fontFamily = 'Arial', 
      fontWeight = 'normal',
      fontStyle = 'normal',
      fill = '#000000', 
      stroke,
      strokeWidth = 0,
      textAlign = 'left' 
    } = element;
    
    // Use the dynamic fields system to replace placeholders
    const studentData = {
      student_name: student.student_name,
      father_name: student.father_name || '',
      class: student.class,
      section: student.section || '',
      roll_number: student.roll_number || '',
      student_id: student.student_id || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      gender: student.gender || '',
      phone_number: student.phone_number || '',
      blood_group: student.blood_group || '',
    };
    
    const text = replaceFieldsInText(field, studentData);
    
    // Build font string
    let fontString = '';
    if (fontStyle !== 'normal') fontString += fontStyle + ' ';
    if (fontWeight !== 'normal') fontString += fontWeight + ' ';
    fontString += `${fontSize}px ${fontFamily}`;
    
    ctx.font = fontString;
    ctx.fillStyle = fill;
    ctx.textAlign = textAlign as CanvasTextAlign;
    
    // Apply stroke if specified
    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, 0, 0);
    }
    
    ctx.fillText(text, 0, 0);
  };

  const renderQRCode = async (ctx: CanvasRenderingContext2D, element: any, student: Student) => {
    const { data, width = 100, height = 100 } = element;
    
    // Use the dynamic fields system to replace placeholders in QR data
    const studentData = {
      student_name: student.student_name,
      father_name: student.father_name || '',
      class: student.class,
      section: student.section || '',
      roll_number: student.roll_number || '',
      student_id: student.student_id || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      gender: student.gender || '',
      phone_number: student.phone_number || '',
      blood_group: student.blood_group || '',
    };
    
    const qrData = replaceFieldsInText(data, studentData);
    
    try {
      const qrCodeDataURL = await generateQRCode(qrData);
      if (qrCodeDataURL) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = qrCodeDataURL;
      }
    } catch {
      // Silent fail for QR code rendering
    }
  };

  const generateAllCards = async () => {
    if (!students.length) {
      toast.error('No students to generate cards for');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedCards([]);

    try {
      const cardDataURLs: string[] = [];

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setCurrentStudent(student.student_name);
        setProgress((i / students.length) * 100);

        try {
          const cardDataURL = await generateCard(student);
          cardDataURLs.push(cardDataURL);
        } catch {
          // Skip failed card generation
        }
      }

      setGeneratedCards(cardDataURLs);
      setProgress(100);
      toast.success(`Generated ${cardDataURLs.length} ID cards successfully!`);
    } catch {
      toast.error('Failed to generate cards');
    } finally {
      setIsGenerating(false);
      setCurrentStudent('');
    }
  };

  const previewCard = async (studentIndex: number) => {
    if (studentIndex < 0 || studentIndex >= students.length) return;

    try {
      const cardDataURL = await generateCard(students[studentIndex]);
      setPreviewCard(cardDataURL);
    } catch {
      toast.error('Failed to generate preview');
    }
  };

  const downloadCard = (cardDataURL: string, studentName: string) => {
    const link = document.createElement('a');
    link.download = `${studentName.replace(/\s+/g, '_')}_ID_Card.png`;
    link.href = cardDataURL;
    link.click();
  };

  const downloadAllCards = async () => {
    if (generatedCards.length === 0) {
      toast.error('No cards generated yet');
      return;
    }

    try {
      const zip = new JSZip();
      
      for (let i = 0; i < generatedCards.length; i++) {
        const student = students[i];
        const cardDataURL = generatedCards[i];
        
        // Convert data URL to blob
        const response = await fetch(cardDataURL);
        const blob = await response.blob();
        
        zip.file(`${student.student_name.replace(/\s+/g, '_')}_ID_Card.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = 'ID_Cards.zip';
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      
      toast.success('Downloaded all cards as ZIP file');
    } catch {
      toast.error('Failed to download cards');
    }
  };

  const downloadPDF = async () => {
    if (generatedCards.length === 0) {
      toast.error('No cards generated yet');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: template.orientation === 'portrait' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const cardsPerPage = template.orientation === 'portrait' ? 2 : 3;
      let currentPage = 0;
      let cardIndex = 0;

      for (let i = 0; i < generatedCards.length; i++) {
        if (cardIndex === 0) {
          if (i > 0) {
            pdf.addPage();
            currentPage++;
          }
        }

        const cardDataURL = generatedCards[i];
        const img = new Image();
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const imgWidth = 80;
            const imgHeight = (img.height * imgWidth) / img.width;
            
            const x = (cardIndex % 2) * 100 + 10;
            const y = Math.floor(cardIndex / 2) * 100 + 10;
            
            pdf.addImage(cardDataURL, 'PNG', x, y, imgWidth, imgHeight);
            
            cardIndex++;
            if (cardIndex >= cardsPerPage) {
              cardIndex = 0;
            }
            
            resolve();
          };
          img.src = cardDataURL;
        });
      }

      pdf.save('ID_Cards.pdf');
      toast.success('Downloaded PDF successfully');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate ID Cards</CardTitle>
          <CardDescription>
            Generate ID cards for {students.length} students using the selected template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Export Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h3 className="font-medium">Export Settings</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">DPI</label>
                  <Select
                    value={exportSettings.dpi.toString()}
                    onValueChange={(value) => setExportSettings(prev => ({ ...prev, dpi: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="72">72 (Screen)</SelectItem>
                      <SelectItem value="150">150 (Draft Print)</SelectItem>
                      <SelectItem value="300">300 (Print Quality)</SelectItem>
                      <SelectItem value="600">600 (High Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality</label>
                  <Select
                    value={exportSettings.quality.toString()}
                    onValueChange={(value) => setExportSettings(prev => ({ ...prev, quality: parseFloat(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">50% (Low)</SelectItem>
                      <SelectItem value="0.75">75% (Medium)</SelectItem>
                      <SelectItem value="1.0">100% (High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select
                    value={exportSettings.format}
                    onValueChange={(value: 'png' | 'pdf' | 'zip') => setExportSettings(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG Images</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="zip">ZIP Archive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Canvas Type</label>
                  <div className="text-sm text-muted-foreground">
                    {template.canvas_type || 'konva'}
                  </div>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating cards...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {currentStudent && (
                  <p className="text-sm text-muted-foreground">
                    Processing: {currentStudent}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={generateAllCards} 
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate All Cards'}
              </Button>
            </div>

            {generatedCards.length > 0 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {exportSettings.format === 'zip' && (
                    <Button onClick={downloadAllCards} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download ZIP
                    </Button>
                  )}
                  {exportSettings.format === 'pdf' && (
                    <Button onClick={downloadPDF} variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                  {exportSettings.format === 'png' && (
                    <Button onClick={downloadAllCards} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download PNGs
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {students.map((student, index) => (
                    <Card key={student.id} className="overflow-hidden">
                      <CardContent className="p-2">
                        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-2">
                          {generatedCards[index] ? (
                            <img 
                              src={generatedCards[index]} 
                              alt={`${student.student_name} ID Card`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              Not Generated
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">{student.class}</p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => previewCard(index)}
                              className="flex-1"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadCard(generatedCards[index], student.student_name)}
                              disabled={!generatedCards[index]}
                              className="flex-1"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={previewCard} 
                alt="Card Preview" 
                className="w-full h-auto"
              />
            </CardContent>
            <div className="p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewCard(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
