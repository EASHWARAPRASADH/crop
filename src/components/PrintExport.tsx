import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Printer, Download, Settings, FileText, Image, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

interface PrintExportProps {
  cardImages: string[];
  studentNames: string[];
  onComplete: () => void;
}

export const PrintExport: React.FC<PrintExportProps> = ({
  cardImages,
  studentNames,
  onComplete
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'eps'>('pdf');
  const [printSettings, setPrintSettings] = useState({
    paperSize: 'A4',
    orientation: 'portrait',
    cardsPerPage: 2,
    margin: 10,
    quality: 'high',
    includeCutMarks: true,
    includeRegistrationMarks: true,
    bleed: 3
  });
  const [printerSettings, setPrinterSettings] = useState({
    printerModel: 'Epson F530',
    resolution: '300',
    colorMode: 'color',
    paperType: 'photo',
    duplex: false
  });

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: printSettings.orientation as 'portrait' | 'landscape',
        unit: 'mm',
        format: printSettings.paperSize.toLowerCase() as any
      });

      const cardsPerPage = printSettings.cardsPerPage;
      const margin = printSettings.margin;
      const cardWidth = (210 - (margin * 2)) / (printSettings.orientation === 'portrait' ? 2 : 3);
      const cardHeight = (297 - (margin * 2)) / (printSettings.orientation === 'portrait' ? 2 : 3);

      let currentPage = 0;
      let cardIndex = 0;

      for (let i = 0; i < cardImages.length; i++) {
        if (cardIndex === 0 && i > 0) {
          pdf.addPage();
          currentPage++;
        }

        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const x = (cardIndex % (printSettings.orientation === 'portrait' ? 2 : 3)) * cardWidth + margin;
            const y = Math.floor(cardIndex / (printSettings.orientation === 'portrait' ? 2 : 3)) * cardHeight + margin;
            
            pdf.addImage(cardImages[i], 'PNG', x, y, cardWidth, cardHeight);
            
            cardIndex++;
            if (cardIndex >= cardsPerPage) {
              cardIndex = 0;
            }
            
            resolve();
          };
          img.src = cardImages[i];
        });
      }

      pdf.save('ID_Cards_Print_Ready.pdf');
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPNG = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < cardImages.length; i++) {
        const response = await fetch(cardImages[i]);
        const blob = await response.blob();
        zip.file(`${studentNames[i].replace(/\s+/g, '_')}_ID_Card.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = 'ID_Cards_Print_Ready.zip';
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      
      toast.success('PNG files exported successfully');
    } catch (error) {
      console.error('Error exporting PNG files:', error);
      toast.error('Failed to export PNG files');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToEPS = async () => {
    // EPS export would require a more complex implementation
    // For now, we'll show a message that this feature is not yet implemented
    toast.info('EPS export feature is not yet implemented. Please use PDF or PNG export.');
  };

  const handleExport = async () => {
    switch (exportFormat) {
      case 'pdf':
        await exportToPDF();
        break;
      case 'png':
        await exportToPNG();
        break;
      case 'eps':
        await exportToEPS();
        break;
    }
  };

  const generatePrintInstructions = () => {
    const instructions = `
PRINT INSTRUCTIONS FOR EPSON F530:

1. Printer Settings:
   - Model: ${printerSettings.printerModel}
   - Resolution: ${printerSettings.resolution} DPI
   - Color Mode: ${printerSettings.colorMode}
   - Paper Type: ${printerSettings.paperType}
   - Duplex: ${printerSettings.duplex ? 'Enabled' : 'Disabled'}

2. Paper Settings:
   - Size: ${printSettings.paperSize}
   - Orientation: ${printSettings.orientation}
   - Cards per page: ${printSettings.cardsPerPage}
   - Margin: ${printSettings.margin}mm
   - Bleed: ${printSettings.bleed}mm

3. Quality Settings:
   - Quality: ${printSettings.quality}
   - Cut marks: ${printSettings.includeCutMarks ? 'Included' : 'Not included'}
   - Registration marks: ${printSettings.includeRegistrationMarks ? 'Included' : 'Not included'}

4. Recommended Settings:
   - Use high-quality photo paper
   - Set printer to "Best Quality" mode
   - Ensure proper paper alignment
   - Check ink levels before printing
   - Allow cards to dry completely before cutting

5. Cutting Instructions:
   - Use a precision cutter for clean edges
   - Follow the cut marks if included
   - Measure twice, cut once
   - Consider using a corner rounder for professional finish
    `;

    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Print_Instructions.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Print Export Settings</CardTitle>
          <CardDescription>
            Configure settings for printing {cardImages.length} ID cards on Epson F530
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'pdf' | 'png' | 'eps') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (Recommended for printing)</SelectItem>
                <SelectItem value="png">PNG (Individual files)</SelectItem>
                <SelectItem value="eps">EPS (Vector format)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Print Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paper Size</Label>
              <Select 
                value={printSettings.paperSize} 
                onValueChange={(value) => setPrintSettings(prev => ({ ...prev, paperSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                  <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                  <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select 
                value={printSettings.orientation} 
                onValueChange={(value) => setPrintSettings(prev => ({ ...prev, orientation: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cards per Page</Label>
              <Select 
                value={printSettings.cardsPerPage.toString()} 
                onValueChange={(value) => setPrintSettings(prev => ({ ...prev, cardsPerPage: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Card</SelectItem>
                  <SelectItem value="2">2 Cards</SelectItem>
                  <SelectItem value="4">4 Cards</SelectItem>
                  <SelectItem value="6">6 Cards</SelectItem>
                  <SelectItem value="9">9 Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Margin (mm)</Label>
              <Input
                type="number"
                value={printSettings.margin}
                onChange={(e) => setPrintSettings(prev => ({ ...prev, margin: parseInt(e.target.value) }))}
                min="5"
                max="50"
              />
            </div>
          </div>

          {/* Quality Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Print Quality</Label>
                <Select 
                  value={printSettings.quality} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="best">Best</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bleed (mm)</Label>
                <Input
                  type="number"
                  value={printSettings.bleed}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, bleed: parseInt(e.target.value) }))}
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cutMarks"
                  checked={printSettings.includeCutMarks}
                  onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, includeCutMarks: !!checked }))}
                />
                <Label htmlFor="cutMarks">Include cut marks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regMarks"
                  checked={printSettings.includeRegistrationMarks}
                  onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, includeRegistrationMarks: !!checked }))}
                />
                <Label htmlFor="regMarks">Include registration marks</Label>
              </div>
            </div>
          </div>

          {/* Printer Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Printer Settings (Epson F530)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Resolution (DPI)</Label>
                <Select 
                  value={printerSettings.resolution} 
                  onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, resolution: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="150">150 DPI</SelectItem>
                    <SelectItem value="300">300 DPI (Recommended)</SelectItem>
                    <SelectItem value="600">600 DPI</SelectItem>
                    <SelectItem value="1200">1200 DPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color Mode</Label>
                <Select 
                  value={printerSettings.colorMode} 
                  onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, colorMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="grayscale">Grayscale</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Paper Type</Label>
                <Select 
                  value={printerSettings.paperType} 
                  onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, paperType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain Paper</SelectItem>
                    <SelectItem value="photo">Photo Paper</SelectItem>
                    <SelectItem value="cardstock">Cardstock</SelectItem>
                    <SelectItem value="glossy">Glossy Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duplex Printing</Label>
                <Select 
                  value={printerSettings.duplex.toString()} 
                  onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, duplex: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Single-sided</SelectItem>
                    <SelectItem value="true">Double-sided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
            
            <Button 
              onClick={generatePrintInstructions} 
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Print Instructions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preview</CardTitle>
          <CardDescription>
            Preview of the first few cards that will be exported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cardImages.slice(0, 8).map((image, index) => (
              <div key={index} className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {cardImages.length > 8 && (
            <p className="text-sm text-muted-foreground mt-4">
              And {cardImages.length - 8} more cards...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
