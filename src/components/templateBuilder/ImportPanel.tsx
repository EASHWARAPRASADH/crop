import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Download,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  RotateCcw
} from 'lucide-react';
import { importFile, ImportResult, convertToKonvaFormat, convertToFabricFormat } from '@/utils/templateImporters';

interface ImportPanelProps {
  onImportComplete: (elements: any[], canvas: { width: number; height: number }, background?: { color?: string; image?: string }) => void;
  onImportError: (error: string) => void;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({
  onImportComplete,
  onImportError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'konva' | 'fabric'>('konva');
  const [dragCounter, setDragCounter] = useState(0);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  // Handle file import
  const handleFileImport = async (file: File) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const result = await importFile(file);
      
      clearInterval(progressInterval);
      setImportProgress(100);

      if (result.success) {
        setImportResult(result);
      } else {
        onImportError(result.errors?.[0] || 'Import failed');
      }
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import confirmation
  const handleConfirmImport = () => {
    if (importResult) {
      const elements = selectedFormat === 'konva' 
        ? convertToKonvaFormat(importResult.elements)
        : convertToFabricFormat(importResult.elements);

      onImportComplete(
        elements,
        importResult.canvas,
        importResult.background
      );
      
      // Reset state
      setImportResult(null);
      setImportProgress(0);
    }
  };

  // Handle import cancellation
  const handleCancelImport = () => {
    setImportResult(null);
    setImportProgress(0);
  };

  // Get file type icon
  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'psd':
        return <Layers className="w-8 h-8 text-purple-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <ImageIcon className="w-8 h-8 text-green-500" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  // Get file type name
  const getFileTypeName = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'docx':
        return 'Word Document';
      case 'psd':
        return 'Photoshop Document';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'webp':
        return 'Image File';
      case 'pdf':
        return 'PDF Document';
      default:
        return 'Unknown File';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Template
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="p-4">
            {/* Drag and drop area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${isImporting ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/50'}
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {isImporting ? 'Importing...' : 'Drop files here or click to browse'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Support for Word (.docx), Photoshop (.psd), PDF (.pdf) and Image files (.png, .jpg, .gif, .bmp, .webp)
              </p>
              
              {isImporting && (
                <div className="w-full max-w-xs mx-auto">
                  <Progress value={importProgress} className="mb-2" />
                  <p className="text-xs text-muted-foreground">{importProgress}% complete</p>
                </div>
              )}

              <input
                id="file-input"
                type="file"
                accept=".docx,.psd,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Supported formats */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Supported Formats</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Word (.docx)</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span className="text-xs">Photoshop (.psd)</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span className="text-xs">PDF (.pdf)</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <ImageIcon className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Images (.png, .jpg)</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="p-4">
            {importResult ? (
              <div className="space-y-4">
                {/* Import result header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <h3 className="font-semibold">
                      {importResult.success ? 'Import Successful' : 'Import Failed'}
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelImport}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {importResult.success && (
                  <>
                    {/* File info */}
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      {getFileTypeIcon('imported-file')}
                      <div className="flex-1">
                        <h4 className="font-medium">Imported File</h4>
                        <p className="text-sm text-muted-foreground">
                          {getFileTypeName('imported-file')} • {importResult.elements.length} elements
                        </p>
                      </div>
                    </div>

                    {/* Canvas info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Canvas Size</Label>
                        <div className="text-sm text-muted-foreground">
                          {importResult.canvas.width} × {importResult.canvas.height}px
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Elements</Label>
                        <div className="text-sm text-muted-foreground">
                          {importResult.elements.length} elements imported
                        </div>
                      </div>
                    </div>

                    {/* Elements list */}
                    <div className="space-y-2">
                      <Label>Imported Elements</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.elements.map((element, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="flex-1">{element.type}</span>
                            <Badge variant="outline" className="text-xs">
                              {element.width}×{element.height}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Format selection */}
                    <div className="space-y-2">
                      <Label>Target Format</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={selectedFormat === 'konva' ? 'default' : 'outline'}
                          onClick={() => setSelectedFormat('konva')}
                        >
                          Konva.js
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedFormat === 'fabric' ? 'default' : 'outline'}
                          onClick={() => setSelectedFormat('fabric')}
                        >
                          Fabric.js
                        </Button>
                      </div>
                    </div>

                    {/* Warnings */}
                    {importResult.warnings && importResult.warnings.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-yellow-600">Warnings</Label>
                        <div className="space-y-1">
                          {importResult.warnings.map((warning, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={handleConfirmImport}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Import to Canvas
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelImport}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {!importResult.success && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Import Failed</h4>
                      <div className="space-y-1">
                        {importResult.errors?.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">{error}</p>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCancelImport}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No file imported yet</p>
                <p className="text-xs">Upload a file to see preview</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
