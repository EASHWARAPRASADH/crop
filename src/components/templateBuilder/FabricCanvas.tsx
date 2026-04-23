import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Move, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Image as ImageIcon, 
  RotateCw, 
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

export interface FabricElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'group' | 'path';
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  visible: boolean;
  selectable: boolean;
  evented: boolean;
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
  rx?: number;
  ry?: number;
  // Image properties
  src?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  // Path properties
  path?: string;
  // Group properties
  objects?: FabricElement[];
}

interface FabricCanvasProps {
  width: number;
  height: number;
  elements: FabricElement[];
  selectedElementId?: string;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (elementId: string, updates: Partial<FabricElement>) => void;
  onElementDelete: (elementId: string) => void;
  onElementAdd: (element: Omit<FabricElement, 'id'>) => void;
  onElementDuplicate: (elementId: string) => void;
  onElementLock: (elementId: string, locked: boolean) => void;
  onElementVisibility: (elementId: string, visible: boolean) => void;
  onElementReorder: (elementId: string, newZIndex: number) => void;
  background?: {
    color?: string;
    image?: string;
  };
  gridSize?: number;
  showGrid?: boolean;
  snapToGrid?: boolean;
}

export const FabricCanvas: React.FC<FabricCanvasProps> = ({
  width,
  height,
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementAdd,
  onElementDuplicate,
  onElementLock,
  onElementVisibility,
  onElementReorder,
  background,
  gridSize = 10,
  showGrid = false,
  snapToGrid = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedElement, setSelectedElement] = useState<FabricElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Fabric canvas
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: background?.color || '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;
      setIsInitialized(true);

      // Set up event listeners
      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => onElementSelect(null));
      canvas.on('object:modified', handleObjectModified);
      canvas.on('object:moving', handleObjectMoving);
      canvas.on('object:scaling', handleObjectScaling);
      canvas.on('object:rotating', handleObjectRotating);

      return () => {
        try {
          canvas.dispose();
        } catch (err) {
          console.warn('Fabric dispose error', err);
        }
        fabricCanvasRef.current = null;
      };
    }
  }, [isInitialized, width, height, background?.color]);

  // Update canvas when elements change
  useEffect(() => {
    if (!canvasRef.current || !fabricCanvasRef.current || !isInitialized) return;
    
    try {
      const canvas = fabricCanvasRef.current;
      canvas.clear();

      // Add background image if exists
      if (background?.image) {
        fabric.Image.fromURL(background.image).then((img: any) => {
          img.set({
            left: 0,
            top: 0,
            scaleX: width / img.width,
            scaleY: height / img.height,
            selectable: false,
            evented: false,
          });
          canvas.add(img);
          if (typeof (canvas as any).sendToBack === 'function') {
            (canvas as any).sendToBack(img);
          } else if (typeof (canvas as any).sendObjectToBack === 'function') {
            (canvas as any).sendObjectToBack(img);
          }
        }).catch(err => console.error("Error loading fabric background", err));
      }

      // Add elements
      elements.forEach(element => {
        addElementToCanvas(element);
      });

      canvas.renderAll();
    } catch (err) {
      console.warn('Fabric render error', err);
    }
  }, [elements, background, isInitialized, width, height]);

  // Update selection when selectedElementId changes
  useEffect(() => {
    if (fabricCanvasRef.current && selectedElementId) {
      const canvas = fabricCanvasRef.current;
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        setSelectedElement(element);
        const fabricObject = canvas.getObjects().find(obj => (obj as any).id === selectedElementId);
        if (fabricObject) {
          canvas.setActiveObject(fabricObject);
          canvas.renderAll();
        }
      }
    } else {
      setSelectedElement(null);
    }
  }, [selectedElementId, elements]);

  // Handle selection events
  const handleSelection = useCallback((e: any) => {
    const activeObject = e.selected?.[0];
    if (activeObject && activeObject.id) {
      onElementSelect(activeObject.id);
    } else {
      onElementSelect(null);
    }
  }, [onElementSelect]);

  // Handle object modification
  const handleObjectModified = useCallback((e: any) => {
    const obj = e.target;
    if (obj && obj.id) {
      onElementUpdate(obj.id, {
        left: obj.left || 0,
        top: obj.top || 0,
        width: obj.width || 0,
        height: obj.height || 0,
        angle: obj.angle || 0,
        opacity: obj.opacity || 1,
      });
    }
  }, [onElementUpdate]);

  // Handle object moving
  const handleObjectMoving = useCallback((e: any) => {
    if (snapToGrid && e.target) {
      const obj = e.target;
      obj.set({
        left: Math.round(obj.left! / gridSize) * gridSize,
        top: Math.round(obj.top! / gridSize) * gridSize,
      });
    }
  }, [snapToGrid, gridSize]);

  // Handle object scaling
  const handleObjectScaling = useCallback((e: any) => {
    const obj = e.target;
    if (obj && obj.id) {
      // Update width and height based on scale
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      
      onElementUpdate(obj.id, {
        width: (obj.width || 0) * scaleX,
        height: (obj.height || 0) * scaleY,
      });
    }
  }, [onElementUpdate]);

  // Handle object rotating
  const handleObjectRotating = useCallback((e: any) => {
    const obj = e.target;
    if (obj && obj.id) {
      onElementUpdate(obj.id, {
        angle: obj.angle || 0,
      });
    }
  }, [onElementUpdate]);

  // Add element to canvas
  const addElementToCanvas = (element: FabricElement) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    let fabricObject: fabric.Object | null = null;

    switch (element.type) {
      case 'text':
        fabricObject = new fabric.Text(element.text || '', {
          id: element.id,
          left: element.left,
          top: element.top,
          fontSize: element.fontSize || 16,
          fontFamily: element.fontFamily || 'Arial',
          fontWeight: element.fontWeight || 'normal',
          fontStyle: element.fontStyle || 'normal',
          textAlign: element.textAlign || 'left',
          fill: element.fill || '#000000',
          stroke: element.stroke,
          strokeWidth: element.strokeWidth || 0,
          opacity: element.opacity || 1,
          selectable: element.selectable !== false,
          evented: element.evented !== false,
        });
        break;

      case 'rect':
        fabricObject = new fabric.Rect({
          id: element.id,
          left: element.left,
          top: element.top,
          width: element.width,
          height: element.height,
          fill: element.fill || '#000000',
          stroke: element.stroke,
          strokeWidth: element.strokeWidth || 0,
          rx: element.rx || 0,
          ry: element.ry || 0,
          opacity: element.opacity || 1,
          selectable: element.selectable !== false,
          evented: element.evented !== false,
        });
        break;

      case 'circle':
        fabricObject = new fabric.Circle({
          id: element.id,
          left: element.left,
          top: element.top,
          radius: Math.min(element.width, element.height) / 2,
          fill: element.fill || '#000000',
          stroke: element.stroke,
          strokeWidth: element.strokeWidth || 0,
          opacity: element.opacity || 1,
          selectable: element.selectable !== false,
          evented: element.evented !== false,
        });
        break;

      case 'image':
        if (element.src) {
          fabric.Image.fromURL(element.src).then((img: any) => {
            img.set({
              id: element.id,
              left: element.left,
              top: element.top,
              scaleX: element.width / img.width,
              scaleY: element.height / img.height,
              opacity: element.opacity || 1,
              selectable: element.selectable !== false,
              evented: element.evented !== false,
            });
            canvas.add(img);
            canvas.renderAll();
          }).catch(err => console.error("Error loading imported fabric image", err));
          return;
        }
        break;

      case 'path':
        if (element.path) {
          fabricObject = new fabric.Path(element.path, {
            id: element.id,
            left: element.left,
            top: element.top,
            fill: element.fill || '#000000',
            stroke: element.stroke,
            strokeWidth: element.strokeWidth || 0,
            opacity: element.opacity || 1,
            selectable: element.selectable !== false,
            evented: element.evented !== false,
          });
        }
        break;
    }

    if (fabricObject) {
      canvas.add(fabricObject);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementId && fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas.getActiveObject();

        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (activeObject) {
              canvas.remove(activeObject);
              onElementDelete(selectedElementId);
            }
            break;
          case 'd':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              onElementDuplicate(selectedElementId);
            }
            break;
          case 'l':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const element = elements.find(el => el.id === selectedElementId);
              if (element) {
                onElementLock(selectedElementId, !element.selectable);
              }
            }
            break;
          case 'h':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const element = elements.find(el => el.id === selectedElementId);
              if (element) {
                onElementVisibility(selectedElementId, !element.visible);
              }
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, onElementDelete, onElementDuplicate, onElementLock, onElementVisibility]);

  return (
    <div className="relative">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Advanced Canvas Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onElementAdd({
                type: 'text',
                left: 50,
                top: 50,
                width: 200,
                height: 30,
                angle: 0,
                opacity: 1,
                visible: true,
                selectable: true,
                evented: true,
                text: 'New Text',
                fontSize: 16,
                fontFamily: 'Arial',
                fill: '#000000',
              })}
            >
              <Type className="w-4 h-4 mr-1" />
              Add Text
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onElementAdd({
                type: 'rect',
                left: 50,
                top: 50,
                width: 100,
                height: 100,
                angle: 0,
                opacity: 1,
                visible: true,
                selectable: true,
                evented: true,
                fill: '#000000',
              })}
            >
              <Square className="w-4 h-4 mr-1" />
              Add Rectangle
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onElementAdd({
                type: 'circle',
                left: 50,
                top: 50,
                width: 100,
                height: 100,
                angle: 0,
                opacity: 1,
                visible: true,
                selectable: true,
                evented: true,
                fill: '#000000',
              })}
            >
              <CircleIcon className="w-4 h-4 mr-1" />
              Add Circle
            </Button>

            {selectedElementId && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onElementDuplicate(selectedElementId)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const element = elements.find(el => el.id === selectedElementId);
                    if (element) {
                      onElementLock(selectedElementId, !element.selectable);
                    }
                  }}
                >
                  {selectedElement?.selectable ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  {selectedElement?.selectable ? 'Unlock' : 'Lock'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const element = elements.find(el => el.id === selectedElementId);
                    if (element) {
                      onElementVisibility(selectedElementId, !element.visible);
                    }
                  }}
                >
                  {selectedElement?.visible ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {selectedElement?.visible ? 'Hide' : 'Show'}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onElementDelete(selectedElementId)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
