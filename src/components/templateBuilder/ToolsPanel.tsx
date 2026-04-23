import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wrench, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Image as ImageIcon, 
  Move, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  Ruler,
  Palette,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered
} from 'lucide-react';

interface ToolsPanelProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  canvasZoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onGridToggle: (show: boolean) => void;
  snapToGrid: boolean;
  onSnapToGridToggle: (snap: boolean) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onAddElement: (type: string, properties?: any) => void;
  onAlignElements: (alignment: string) => void;
  onDistributeElements: (distribution: string) => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  selectedTool,
  onToolSelect,
  canvasZoom,
  onZoomChange,
  showGrid,
  onGridToggle,
  snapToGrid,
  onSnapToGridToggle,
  gridSize,
  onGridSizeChange,
  onAddElement,
  onAlignElements,
  onDistributeElements,
  onGroupElements,
  onUngroupElements,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
}) => {
  const [textProperties, setTextProperties] = useState({
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 0,
    textDecoration: 'none',
  });

  const [shapeProperties, setShapeProperties] = useState({
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 0,
    cornerRadius: 0,
  });

  const tools = [
    { id: 'select', name: 'Select', icon: Move, description: 'Select and move elements' },
    { id: 'text', name: 'Text', icon: Type, description: 'Add text elements' },
    { id: 'rect', name: 'Rectangle', icon: Square, description: 'Add rectangle shapes' },
    { id: 'circle', name: 'Circle', icon: CircleIcon, description: 'Add circle shapes' },
    { id: 'image', name: 'Image', icon: ImageIcon, description: 'Add image elements' },
  ];

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
  };

  const handleAddElement = (type: string) => {
    const properties = type === 'text' ? textProperties : shapeProperties;
    onAddElement(type, properties);
  };

  const handleDragStartItem = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/gotek-element', type);
    const properties = type === 'text' ? textProperties : shapeProperties;
    e.dataTransfer.setData('application/gotek-properties', JSON.stringify(properties));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTextPropertyChange = (property: string, value: any) => {
    setTextProperties(prev => ({ ...prev, [property]: value }));
  };

  const handleShapePropertyChange = (property: string, value: any) => {
    setShapeProperties(prev => ({ ...prev, [property]: value }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="p-4">
            <div className="space-y-4">
              {/* Tool selection */}
              <div className="space-y-2">
                <Label>Drawing Tools</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToolSelect(tool.id)}
                      className="justify-start"
                    >
                      <tool.icon className="w-4 h-4 mr-2" />
                      {tool.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Canvas controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Canvas Zoom: {Math.round(canvasZoom * 100)}%</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onZoomChange(Math.max(0.1, canvasZoom - 0.1))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onZoomChange(1)}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onZoomChange(Math.min(5, canvasZoom + 0.1))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                  <Slider
                    value={[canvasZoom]}
                    onValueChange={([value]) => onZoomChange(value)}
                    min={0.1}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Grid Settings</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showGrid"
                        checked={showGrid}
                        onChange={(e) => onGridToggle(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="showGrid" className="text-sm">
                        Show Grid
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="snapToGrid"
                        checked={snapToGrid}
                        onChange={(e) => onSnapToGridToggle(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="snapToGrid" className="text-sm">
                        Snap to Grid
                      </Label>
                    </div>
                    {showGrid && (
                      <div className="space-y-2">
                        <Label className="text-sm">Grid Size: {gridSize}px</Label>
                        <Slider
                          value={[gridSize]}
                          onValueChange={([value]) => onGridSizeChange(value)}
                          min={5}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick add buttons */}
              <div className="space-y-2">
                <Label>Quick Add (Click or Drag)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddElement('text')}
                    draggable
                    onDragStart={(e) => handleDragStartItem(e, 'text')}
                    className="cursor-move"
                  >
                    <Type className="w-4 h-4 mr-1 pointer-events-none" />
                    Text
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddElement('rect')}
                    draggable
                    onDragStart={(e) => handleDragStartItem(e, 'rect')}
                    className="cursor-move"
                  >
                    <Square className="w-4 h-4 mr-1 pointer-events-none" />
                    Rectangle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddElement('circle')}
                    draggable
                    onDragStart={(e) => handleDragStartItem(e, 'circle')}
                    className="cursor-move"
                  >
                    <CircleIcon className="w-4 h-4 mr-1 pointer-events-none" />
                    Circle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddElement('image')}
                    draggable
                    onDragStart={(e) => handleDragStartItem(e, 'image')}
                    className="cursor-move"
                  >
                    <ImageIcon className="w-4 h-4 mr-1 pointer-events-none" />
                    Image
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="p-4">
            <div className="space-y-4">
              {/* Text properties */}
              <div className="space-y-3">
                <Label>Text Properties</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Font Size</Label>
                    <Input
                      type="number"
                      value={textProperties.fontSize}
                      onChange={(e) => handleTextPropertyChange('fontSize', parseInt(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Font Family</Label>
                    <Select
                      value={textProperties.fontFamily}
                      onValueChange={(value) => handleTextPropertyChange('fontFamily', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={textProperties.fontWeight === 'bold' ? 'default' : 'outline'}
                    onClick={() => handleTextPropertyChange('fontWeight', 
                      textProperties.fontWeight === 'bold' ? 'normal' : 'bold'
                    )}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={textProperties.fontStyle === 'italic' ? 'default' : 'outline'}
                    onClick={() => handleTextPropertyChange('fontStyle', 
                      textProperties.fontStyle === 'italic' ? 'normal' : 'italic'
                    )}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTextPropertyChange('textDecoration', 
                      textProperties.textDecoration === 'underline' ? 'none' : 'underline'
                    )}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Text Align</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={textProperties.textAlign === 'left' ? 'default' : 'outline'}
                      onClick={() => handleTextPropertyChange('textAlign', 'left')}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={textProperties.textAlign === 'center' ? 'default' : 'outline'}
                      onClick={() => handleTextPropertyChange('textAlign', 'center')}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={textProperties.textAlign === 'right' ? 'default' : 'outline'}
                      onClick={() => handleTextPropertyChange('textAlign', 'right')}
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fill Color</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={textProperties.fill}
                        onChange={(e) => handleTextPropertyChange('fill', e.target.value)}
                        className="w-8 h-8 p-1"
                      />
                      <Input
                        value={textProperties.fill}
                        onChange={(e) => handleTextPropertyChange('fill', e.target.value)}
                        className="flex-1 h-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stroke Color</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={textProperties.stroke}
                        onChange={(e) => handleTextPropertyChange('stroke', e.target.value)}
                        className="w-8 h-8 p-1"
                      />
                      <Input
                        value={textProperties.stroke}
                        onChange={(e) => handleTextPropertyChange('stroke', e.target.value)}
                        className="flex-1 h-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Stroke Width: {textProperties.strokeWidth}px</Label>
                  <Slider
                    value={[textProperties.strokeWidth]}
                    onValueChange={([value]) => handleTextPropertyChange('strokeWidth', value)}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Shape properties */}
              <div className="space-y-3">
                <Label>Shape Properties</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fill Color</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={shapeProperties.fill}
                        onChange={(e) => handleShapePropertyChange('fill', e.target.value)}
                        className="w-8 h-8 p-1"
                      />
                      <Input
                        value={shapeProperties.fill}
                        onChange={(e) => handleShapePropertyChange('fill', e.target.value)}
                        className="flex-1 h-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stroke Color</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={shapeProperties.stroke}
                        onChange={(e) => handleShapePropertyChange('stroke', e.target.value)}
                        className="w-8 h-8 p-1"
                      />
                      <Input
                        value={shapeProperties.stroke}
                        onChange={(e) => handleShapePropertyChange('stroke', e.target.value)}
                        className="flex-1 h-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Stroke Width: {shapeProperties.strokeWidth}px</Label>
                  <Slider
                    value={[shapeProperties.strokeWidth]}
                    onValueChange={([value]) => handleShapePropertyChange('strokeWidth', value)}
                    min={0}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Corner Radius: {shapeProperties.cornerRadius}px</Label>
                  <Slider
                    value={[shapeProperties.cornerRadius]}
                    onValueChange={([value]) => handleShapePropertyChange('cornerRadius', value)}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="p-4">
            <div className="space-y-4">
              {/* Alignment tools */}
              <div className="space-y-3">
                <Label>Alignment</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAlignElements('left')}
                  >
                    <AlignLeft className="w-4 h-4 mr-1" />
                    Left
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAlignElements('center')}
                  >
                    <AlignCenter className="w-4 h-4 mr-1" />
                    Center
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAlignElements('right')}
                  >
                    <AlignRight className="w-4 h-4 mr-1" />
                    Right
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAlignElements('justify')}
                  >
                    <AlignJustify className="w-4 h-4 mr-1" />
                    Justify
                  </Button>
                </div>
              </div>

              {/* Distribution tools */}
              <div className="space-y-3">
                <Label>Distribution</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDistributeElements('horizontal')}
                  >
                    Distribute H
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDistributeElements('vertical')}
                  >
                    Distribute V
                  </Button>
                </div>
              </div>

              {/* Grouping tools */}
              <div className="space-y-3">
                <Label>Grouping</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onGroupElements}
                  >
                    <Layers className="w-4 h-4 mr-1" />
                    Group
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onUngroupElements}
                  >
                    <Layers className="w-4 h-4 mr-1" />
                    Ungroup
                  </Button>
                </div>
              </div>

              {/* Layer order tools */}
              <div className="space-y-3">
                <Label>Layer Order</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBringToFront}
                  >
                    Bring to Front
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSendToBack}
                  >
                    Send to Back
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBringForward}
                  >
                    Bring Forward
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSendBackward}
                  >
                    Send Backward
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
