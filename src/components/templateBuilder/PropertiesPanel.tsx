import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Type, 
  Palette, 
  Move, 
  RotateCw, 
  Square, 
  Circle as CircleIcon,
  Image as ImageIcon,
  Layers,
  Eye,
  Lock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Copy,
  Trash2
} from 'lucide-react';
import { DynamicField, PREDEFINED_FIELDS } from '@/utils/dynamicFields';

export interface ElementProperties {
  // Common properties
  id: string;
  name: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'group' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  
  // Shape properties
  fillColor?: string;
  strokeColor?: string;
  cornerRadius?: number;
  
  // Image properties
  src?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  
  // Effects
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
  blendMode?: string;
}

interface PropertiesPanelProps {
  selectedElement: ElementProperties | null;
  onElementUpdate: (updates: Partial<ElementProperties>) => void;
  onElementDelete: () => void;
  onElementDuplicate: () => void;
  onElementLock: (locked: boolean) => void;
  onElementVisibility: (visible: boolean) => void;
  onElementReorder: (newZIndex: number) => void;
  canvasBackground?: { color?: string; image?: string };
  onCanvasBackgroundChange?: (bg: { color?: string; image?: string }) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onElementLock,
  onElementVisibility,
  onElementReorder,
  canvasBackground,
  onCanvasBackgroundChange,
}) => {
  const [localProperties, setLocalProperties] = useState<Partial<ElementProperties>>({});
  const [showDynamicFields, setShowDynamicFields] = useState(false);

  // Update local properties when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setLocalProperties(selectedElement);
    } else {
      setLocalProperties({});
    }
  }, [selectedElement]);

  // Handle property change
  const handlePropertyChange = (property: keyof ElementProperties, value: any) => {
    const newProperties = { ...localProperties, [property]: value };
    setLocalProperties(newProperties);
    onElementUpdate(newProperties);
  };

  // Handle numeric input with validation
  const handleNumericChange = (property: keyof ElementProperties, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handlePropertyChange(property, numValue);
    }
  };

  // Handle color change
  const handleColorChange = (property: keyof ElementProperties, value: string) => {
    handlePropertyChange(property, value);
  };

  // Handle dynamic field insertion
  const handleDynamicFieldInsert = (field: DynamicField) => {
    if (selectedElement?.type === 'text') {
      const currentText = localProperties.text || '';
      const newText = currentText + field.placeholder;
      handlePropertyChange('text', newText);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCanvasBackgroundChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onCanvasBackgroundChange({ ...canvasBackground, image: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!selectedElement) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Canvas Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={canvasBackground?.color || '#ffffff'}
                  onChange={(e) => onCanvasBackgroundChange?.({ ...canvasBackground, color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={canvasBackground?.color || '#ffffff'}
                  onChange={(e) => onCanvasBackgroundChange?.({ ...canvasBackground, color: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2 pb-4">
              <Label>Background Image</Label>
              {canvasBackground?.image ? (
                <div className="relative group rounded-md border overflow-hidden aspect-video bg-gray-50 flex items-center justify-center">
                  <img src={canvasBackground.image} alt="Background" className="max-h-full object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => onCanvasBackgroundChange?.({ ...canvasBackground, image: undefined })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <Label className="cursor-pointer bg-white border shadow-sm px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    Upload Image
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundUpload}
                    />
                  </Label>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground text-center">
                Select an element on the canvas to edit its specific properties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-4 space-y-4">
            {/* Element info */}
            <div className="space-y-2">
              <Label>Element Name</Label>
              <Input
                value={localProperties.name || ''}
                onChange={(e) => handlePropertyChange('name', e.target.value)}
                placeholder="Element name"
              />
            </div>

            {/* Position and size */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>X Position</Label>
                <Input
                  type="number"
                  value={localProperties.x || 0}
                  onChange={(e) => handleNumericChange('x', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Y Position</Label>
                <Input
                  type="number"
                  value={localProperties.y || 0}
                  onChange={(e) => handleNumericChange('y', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  type="number"
                  value={localProperties.width || 0}
                  onChange={(e) => handleNumericChange('width', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  type="number"
                  value={localProperties.height || 0}
                  onChange={(e) => handleNumericChange('height', e.target.value)}
                />
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label>Rotation: {localProperties.rotation || 0}°</Label>
              <Slider
                value={[localProperties.rotation || 0]}
                onValueChange={([value]) => handlePropertyChange('rotation', value)}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label>Opacity: {Math.round((localProperties.opacity || 1) * 100)}%</Label>
              <Slider
                value={[(localProperties.opacity || 1) * 100]}
                onValueChange={([value]) => handlePropertyChange('opacity', value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Z-Index */}
            <div className="space-y-2">
              <Label>Layer Order</Label>
              <Input
                type="number"
                value={localProperties.zIndex || 0}
                onChange={(e) => handleNumericChange('zIndex', e.target.value)}
              />
            </div>

            {/* Visibility and lock */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={localProperties.visible ? "default" : "outline"}
                onClick={() => onElementVisibility(!localProperties.visible)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                {localProperties.visible ? 'Visible' : 'Hidden'}
              </Button>
              <Button
                size="sm"
                variant={localProperties.locked ? "default" : "outline"}
                onClick={() => onElementLock(!localProperties.locked)}
                className="flex-1"
              >
                <Lock className="w-4 h-4 mr-1" />
                {localProperties.locked ? 'Locked' : 'Unlocked'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="p-4 space-y-4">
            {/* Text properties */}
            {selectedElement.type === 'text' && (
              <>
                <div className="space-y-2">
                  <Label>Text Content</Label>
                  <div className="flex gap-2">
                    <Input
                      value={localProperties.text || ''}
                      onChange={(e) => handlePropertyChange('text', e.target.value)}
                      placeholder="Enter text"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDynamicFields(!showDynamicFields)}
                    >
                      <Type className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {showDynamicFields && (
                  <div className="space-y-2">
                    <Label>Dynamic Fields</Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {PREDEFINED_FIELDS.map(field => (
                        <Button
                          key={field.id}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start text-xs"
                          onClick={() => handleDynamicFieldInsert(field)}
                        >
                          {field.placeholder}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={localProperties.fontSize || 16}
                      onChange={(e) => handleNumericChange('fontSize', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={localProperties.fontFamily || 'Arial'}
                      onValueChange={(value) => handlePropertyChange('fontFamily', value)}
                    >
                      <SelectTrigger>
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={localProperties.fontWeight === 'bold' ? "default" : "outline"}
                    onClick={() => handlePropertyChange('fontWeight', 
                      localProperties.fontWeight === 'bold' ? 'normal' : 'bold'
                    )}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={localProperties.fontStyle === 'italic' ? "default" : "outline"}
                    onClick={() => handlePropertyChange('fontStyle', 
                      localProperties.fontStyle === 'italic' ? 'normal' : 'italic'
                    )}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <Select
                      value={localProperties.textAlign || 'left'}
                      onValueChange={(value) => handlePropertyChange('textAlign', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Fill color */}
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localProperties.fill || localProperties.fillColor || '#000000'}
                  onChange={(e) => handleColorChange('fill', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={localProperties.fill || localProperties.fillColor || '#000000'}
                  onChange={(e) => handleColorChange('fill', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Stroke color */}
            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localProperties.stroke || localProperties.strokeColor || '#000000'}
                  onChange={(e) => handleColorChange('stroke', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={localProperties.stroke || localProperties.strokeColor || '#000000'}
                  onChange={(e) => handleColorChange('stroke', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Stroke width */}
            <div className="space-y-2">
              <Label>Stroke Width: {localProperties.strokeWidth || 0}px</Label>
              <Slider
                value={[localProperties.strokeWidth || 0]}
                onValueChange={([value]) => handlePropertyChange('strokeWidth', value)}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {/* Corner radius for rectangles */}
            {selectedElement.type === 'rect' && (
              <div className="space-y-2">
                <Label>Corner Radius: {localProperties.cornerRadius || 0}px</Label>
                <Slider
                  value={[localProperties.cornerRadius || 0]}
                  onValueChange={([value]) => handlePropertyChange('cornerRadius', value)}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="effects" className="p-4 space-y-4">
            {/* Shadow */}
            <div className="space-y-2">
              <Label>Shadow</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    value={localProperties.shadow?.color || '#000000'}
                    onChange={(e) => handlePropertyChange('shadow', {
                      ...localProperties.shadow,
                      color: e.target.value
                    })}
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Blur</Label>
                  <Input
                    type="number"
                    value={localProperties.shadow?.blur || 0}
                    onChange={(e) => handlePropertyChange('shadow', {
                      ...localProperties.shadow,
                      blur: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Offset X</Label>
                  <Input
                    type="number"
                    value={localProperties.shadow?.offsetX || 0}
                    onChange={(e) => handlePropertyChange('shadow', {
                      ...localProperties.shadow,
                      offsetX: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Offset Y</Label>
                  <Input
                    type="number"
                    value={localProperties.shadow?.offsetY || 0}
                    onChange={(e) => handlePropertyChange('shadow', {
                      ...localProperties.shadow,
                      offsetY: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <Label>Filters</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Brightness: {localProperties.filters?.brightness || 0}%</Label>
                  <Slider
                    value={[localProperties.filters?.brightness || 0]}
                    onValueChange={([value]) => handlePropertyChange('filters', {
                      ...localProperties.filters,
                      brightness: value
                    })}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Contrast: {localProperties.filters?.contrast || 0}%</Label>
                  <Slider
                    value={[localProperties.filters?.contrast || 0]}
                    onValueChange={([value]) => handlePropertyChange('filters', {
                      ...localProperties.filters,
                      contrast: value
                    })}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Saturation: {localProperties.filters?.saturation || 0}%</Label>
                  <Slider
                    value={[localProperties.filters?.saturation || 0]}
                    onValueChange={([value]) => handlePropertyChange('filters', {
                      ...localProperties.filters,
                      saturation: value
                    })}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Blur: {localProperties.filters?.blur || 0}px</Label>
                  <Slider
                    value={[localProperties.filters?.blur || 0]}
                    onValueChange={([value]) => handlePropertyChange('filters', {
                      ...localProperties.filters,
                      blur: value
                    })}
                    min={0}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Blend mode */}
            <div className="space-y-2">
              <Label>Blend Mode</Label>
              <Select
                value={localProperties.blendMode || 'normal'}
                onValueChange={(value) => handlePropertyChange('blendMode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="multiply">Multiply</SelectItem>
                  <SelectItem value="screen">Screen</SelectItem>
                  <SelectItem value="overlay">Overlay</SelectItem>
                  <SelectItem value="soft-light">Soft Light</SelectItem>
                  <SelectItem value="hard-light">Hard Light</SelectItem>
                  <SelectItem value="color-dodge">Color Dodge</SelectItem>
                  <SelectItem value="color-burn">Color Burn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onElementDuplicate}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-1" />
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onElementDelete}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
