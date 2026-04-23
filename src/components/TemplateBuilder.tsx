import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Download, 
  Upload, 
  Save, 
  RotateCw, 
  Move, 
  Trash2,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface TemplateBuilderProps {
  onSave: (templateData: any) => void;
  onCancel: () => void;
  initialTemplate?: any;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ 
  onSave, 
  onCancel, 
  initialTemplate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Text properties
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textAlign, setTextAlign] = useState('left');
  const [textColor, setTextColor] = useState('#000000');

  // Shape properties
  const [shapeType, setShapeType] = useState<'rect' | 'circle'>('rect');
  const [shapeColor, setShapeColor] = useState('#ff0000');
  const [shapeWidth, setShapeWidth] = useState(100);
  const [shapeHeight, setShapeHeight] = useState(100);

  // Canvas properties
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: canvasBackground,
      });

      // Load initial template if provided
      if (initialTemplate) {
        fabricCanvas.loadFromJSON(initialTemplate, () => {
          fabricCanvas.renderAll();
        });
      }

      // Handle object selection
      fabricCanvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0] || null);
      });

      fabricCanvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected?.[0] || null);
      });

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [canvasWidth, canvasHeight, canvasBackground]);

  const addText = () => {
    if (!canvas || !textContent.trim()) return;

    const text = new fabric.Text(textContent, {
      left: 50,
      top: 50,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontWeight: fontWeight as any,
      fontStyle: fontStyle as any,
      textAlign: textAlign as any,
      fill: textColor,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextContent('');
  };

  const addShape = () => {
    if (!canvas) return;

    let shape: fabric.Object;
    const left = 50;
    const top = 50;

    if (shapeType === 'rect') {
      shape = new fabric.Rect({
        left,
        top,
        width: shapeWidth,
        height: shapeHeight,
        fill: shapeColor,
      });
    } else {
      shape = new fabric.Circle({
        left,
        top,
        radius: Math.min(shapeWidth, shapeHeight) / 2,
        fill: shapeColor,
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const fabricImage = new fabric.Image(img, {
          left: 50,
          top: 50,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        canvas.add(fabricImage);
        canvas.setActiveObject(fabricImage);
        canvas.renderAll();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addDynamicField = () => {
    if (!canvas) return;

    const field = new fabric.Text('{{student_name}}', {
      left: 50,
      top: 50,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#0000ff',
      fontStyle: 'italic',
    });

    canvas.add(field);
    canvas.setActiveObject(field);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    canvas.renderAll();
    setSelectedObject(null);
  };

  const updateSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    if (selectedObject.type === 'text') {
      const textObj = selectedObject as fabric.Text;
      textObj.set({
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: fontWeight as any,
        fontStyle: fontStyle as any,
        textAlign: textAlign as any,
        fill: textColor,
      });
    }

    canvas.renderAll();
  };

  const handleSave = async () => {
    if (!canvas) return;

    setIsLoading(true);
    try {
      const templateData = canvas.toJSON();
      onSave(templateData);
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const exportTemplate = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = 'template.png';
    link.href = dataURL;
    link.click();
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templateData = JSON.parse(e.target?.result as string);
        canvas.loadFromJSON(templateData, () => {
          canvas.renderAll();
          toast.success('Template imported successfully!');
        });
      } catch (error) {
        toast.error('Invalid template file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Canvas</CardTitle>
              <CardDescription>
                Drag and drop elements to design your ID card template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <canvas ref={canvasRef} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l p-4 overflow-y-auto">
          <Tabs defaultValue="elements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text */}
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter text..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                      />
                      <Button onClick={addText} size="sm">
                        <Type className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Dynamic Field */}
                  <div className="space-y-2">
                    <Label>Dynamic Field</Label>
                    <Button onClick={addDynamicField} variant="outline" className="w-full">
                      Add {{student_name}}
                    </Button>
                  </div>

                  {/* Shape */}
                  <div className="space-y-2">
                    <Label>Shape</Label>
                    <div className="flex gap-2">
                      <Select value={shapeType} onValueChange={(value: 'rect' | 'circle') => setShapeType(value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rect">Rect</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addShape} size="sm">
                        {shapeType === 'rect' ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={addImage}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={deleteSelected} variant="destructive" className="w-full" disabled={!selectedObject}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button onClick={exportTemplate} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Template
                  </Button>
                  <div>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={importTemplate}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              {selectedObject && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Object Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedObject.type === 'text' && (
                      <>
                        <div className="space-y-2">
                          <Label>Font Size</Label>
                          <Slider
                            value={[fontSize]}
                            onValueChange={([val]) => setFontSize(val)}
                            min={8}
                            max={72}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Font Family</Label>
                          <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Text Style</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={fontWeight === 'bold' ? 'default' : 'outline'}
                              onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                            >
                              <Bold className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={fontStyle === 'italic' ? 'default' : 'outline'}
                              onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                            >
                              <Italic className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Text Align</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={textAlign === 'left' ? 'default' : 'outline'}
                              onClick={() => setTextAlign('left')}
                            >
                              <AlignLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={textAlign === 'center' ? 'default' : 'outline'}
                              onClick={() => setTextAlign('center')}
                            >
                              <AlignCenter className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={textAlign === 'right' ? 'default' : 'outline'}
                              onClick={() => setTextAlign('right')}
                            >
                              <AlignRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                          />
                        </div>
                        <Button onClick={updateSelectedObject} className="w-full">
                          Update Text
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="canvas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Canvas Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={canvasWidth}
                        onChange={(e) => setCanvasWidth(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <Input
                        type="number"
                        value={canvasHeight}
                        onChange={(e) => setCanvasHeight(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={canvasBackground}
                      onChange={(e) => setCanvasBackground(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4 flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Template</>}
        </Button>
      </div>
    </div>
  );
};
