import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  FileImage,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  FileArchive
} from 'lucide-react';
import { exportTemplate, ExportOptions, TemplateData, bulkExportToZip } from '@/utils/templateExporter';
import { useOrder } from '@/hooks/useOrder';
import { recordService } from '@/services/dataService';
import { toast } from 'sonner';

interface ExportPanelProps {
  templateData: TemplateData | null;
  mappedFields: Record<string, string>;
  onExportStart: () => void;
  onExportComplete: () => void;
  onExportError: (error: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  templateData,
  mappedFields,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const { currentOrder } = useOrder();
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'eps' | 'png'>('json');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dpi: 300,
    includeMetadata: true,
    includeVersionHistory: false,
    compress: false,
    quality: 1.0,
    includeBleed: false,
    bleedSize: 3,
    includeCropMarks: false,
    colorSpace: 'RGB',
  });

  // Update export options when format changes
  React.useEffect(() => {
    setExportOptions(prev => ({
      ...prev,
      format: exportFormat,
    }));
  }, [exportFormat]);

  // Fetch records for current order/project
  React.useEffect(() => {
    const fetchRecords = async () => {
      if (!currentOrder?.projectId) return;
      
      setIsLoadingRecords(true);
      try {
        const data = await recordService.getAll({ projectId: currentOrder.projectId });
        setRecords(data.records || data || []);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setIsLoadingRecords(false);
      }
    };
    
    fetchRecords();
  }, [currentOrder]);

  const handleBulkExport = async () => {
    if (!templateData) return;
    if (records.length === 0) {
      toast.error('No records found for bulk generation');
      return;
    }

    setIsBulkExporting(true);
    setExportProgress(0);
    onExportStart();

    try {
      await bulkExportToZip(
        templateData,
        mappedFields,
        records,
        (progress) => setExportProgress(progress)
      );
      
      toast.success(`Successfully generated ${records.length} ID cards`);
      onExportComplete();
    } catch (error) {
      console.error('Bulk export error:', error);
      onExportError('Bulk generation failed');
    } finally {
      setIsBulkExporting(false);
      setExportProgress(0);
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!templateData) {
      onExportError('No template data to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    onExportStart();

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      await exportTemplate(templateData, exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onExportComplete();
      }, 500);
    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      onExportError(error instanceof Error ? error.message : 'Export failed');
    }
  };

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'eps':
        return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'png':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get format description
  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'json':
        return 'Editable template data for further editing';
      case 'pdf':
        return 'High-quality print-ready PDF document';
      case 'eps':
        return 'Vector format for professional printing';
      case 'png':
        return 'Raster image with transparent background';
      default:
        return '';
    }
  };

  // Get file size estimate
  const getFileSizeEstimate = (format: string) => {
    if (!templateData) return 'Unknown';
    
    const elementCount = templateData.sides 
      ? templateData.sides.front.length + templateData.sides.back.length
      : templateData.elements.length;
    const canvasSize = templateData.canvas.width * templateData.canvas.height;
    
    switch (format) {
      case 'json':
        return `${Math.round(elementCount * 0.5 + 1)} KB`;
      case 'pdf':
        return `${Math.round(canvasSize * (templateData.sides ? 0.002 : 0.001) + 50)} KB`;
      case 'eps':
        return `${Math.round(canvasSize * 0.002 + 100)} KB`;
      case 'png':
        return `${Math.round(canvasSize * 0.01 + 200)} KB`;
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Template
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Single</TabsTrigger>
            <TabsTrigger value="bulk">Bulk (Batch)</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="p-4">
            {/* Format selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['json', 'pdf', 'eps', 'png'] as const).map((format) => (
                  <div
                    key={format}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-colors
                      ${exportFormat === format ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                    `}
                    onClick={() => setExportFormat(format)}
                  >
                    <div className="flex items-center gap-3">
                      {getFormatIcon(format)}
                      <div className="flex-1">
                        <h4 className="font-medium capitalize">{format.toUpperCase()}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getFormatDescription(format)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Est. size: {getFileSizeEstimate(format)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Template info */}
              {templateData && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Template Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2 font-medium">{templateData.metadata.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Elements:</span>
                      <span className="ml-2 font-medium">
                        {templateData.sides 
                          ? `${templateData.sides.front.length + templateData.sides.back.length} (2 sides)` 
                          : templateData.elements.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Canvas:</span>
                      <span className="ml-2 font-medium">
                        {templateData.canvas.width} × {templateData.canvas.height}px
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Version:</span>
                      <span className="ml-2 font-medium">{templateData.metadata.version}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Export button */}
              <Button
                onClick={handleExport}
                disabled={!templateData || isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>

              {isExporting && (
                <div className="w-full">
                  <Progress value={exportProgress} className="mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Preparing export...
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="p-4">
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900">Bulk ID Card Generation</h4>
                  <p className="text-sm text-blue-700">
                    Generate unique ID cards for all {records.length} records in this project.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Mapping Overview</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded border">
                    <span className="text-muted-foreground block">Mapped Elements</span>
                    <span className="font-bold text-lg">{Object.keys(mappedFields).length}</span>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <span className="text-muted-foreground block">Total Records</span>
                    <span className="font-bold text-lg">{records.length}</span>
                  </div>
                </div>
                
                {Object.keys(mappedFields).length === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      Warning: No elements are mapped to data fields. All cards will be identical.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleBulkExport}
                disabled={isBulkExporting || !templateData || isLoadingRecords}
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
              >
                {isBulkExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Generating... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-3" />
                    Download Bulk ZIP
                  </>
                )}
              </Button>

              {isBulkExporting && (
                <div className="space-y-2">
                  <Progress value={exportProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground animate-pulse">
                    Processing records and generating high-resolution templates...
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Cards will be exported as 300 DPI PNG images bundled into a single ZIP file named after your project.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="p-4">
            <div className="space-y-6">
              {/* General options */}
              <div className="space-y-4">
                <h4 className="font-medium">General Options</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                      }
                    />
                    <Label htmlFor="includeMetadata" className="text-sm">
                      Include metadata (name, version, timestamps)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeVersionHistory"
                      checked={exportOptions.includeVersionHistory}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeVersionHistory: !!checked }))
                      }
                    />
                    <Label htmlFor="includeVersionHistory" className="text-sm">
                      Include version history
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compress"
                      checked={exportOptions.compress}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, compress: !!checked }))
                      }
                    />
                    <Label htmlFor="compress" className="text-sm">
                      Compress output (smaller file size)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Image/Print options */}
              {(exportFormat === 'pdf' || exportFormat === 'eps' || exportFormat === 'png') && (
                <div className="space-y-4">
                  <h4 className="font-medium">Image/Print Options</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dpi">DPI (Resolution)</Label>
                      <Select
                        value={exportOptions.dpi?.toString()}
                        onValueChange={(value) => 
                          setExportOptions(prev => ({ ...prev, dpi: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="72">72 DPI (Screen)</SelectItem>
                          <SelectItem value="150">150 DPI (Draft Print)</SelectItem>
                          <SelectItem value="300">300 DPI (Print Quality)</SelectItem>
                          <SelectItem value="600">600 DPI (High Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quality">Quality</Label>
                      <Select
                        value={exportOptions.quality?.toString()}
                        onValueChange={(value) => 
                          setExportOptions(prev => ({ ...prev, quality: parseFloat(value) }))
                        }
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorSpace">Color Space</Label>
                    <Select
                      value={exportOptions.colorSpace}
                      onValueChange={(value: 'RGB' | 'CMYK') => 
                        setExportOptions(prev => ({ ...prev, colorSpace: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RGB">RGB (Screen/Web)</SelectItem>
                        <SelectItem value="CMYK">CMYK (Print)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Print-specific options */}
              {(exportFormat === 'pdf' || exportFormat === 'eps') && (
                <div className="space-y-4">
                  <h4 className="font-medium">Print Options</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeBleed"
                        checked={exportOptions.includeBleed}
                        onCheckedChange={(checked) => 
                          setExportOptions(prev => ({ ...prev, includeBleed: !!checked }))
                        }
                      />
                      <Label htmlFor="includeBleed" className="text-sm">
                        Include bleed area
                      </Label>
                    </div>
                    
                    {exportOptions.includeBleed && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="bleedSize">Bleed Size (mm)</Label>
                        <Input
                          id="bleedSize"
                          type="number"
                          value={exportOptions.bleedSize}
                          onChange={(e) => 
                            setExportOptions(prev => ({ ...prev, bleedSize: parseInt(e.target.value) || 3 }))
                          }
                          min="1"
                          max="10"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCropMarks"
                      checked={exportOptions.includeCropMarks}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeCropMarks: !!checked }))
                      }
                    />
                    <Label htmlFor="includeCropMarks" className="text-sm">
                      Include crop marks
                    </Label>
                  </div>
                </div>
              )}

              {/* Export button */}
              <Button
                onClick={handleExport}
                disabled={!templateData || isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export with Options
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
