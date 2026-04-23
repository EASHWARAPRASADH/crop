import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Image, Group, Transformer } from 'react-konva';
import Konva from 'konva';
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
  EyeOff
} from 'lucide-react';

export interface KonvaElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'group';
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
  // Group properties
  children?: KonvaElement[];
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  elements: KonvaElement[];
  selectedElementId?: string;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (elementId: string, updates: Partial<KonvaElement>) => void;
  onElementDelete: (elementId: string) => void;
  onElementAdd: (element: Omit<KonvaElement, 'id'>) => void;
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

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
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
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [selectedElement, setSelectedElement] = useState<KonvaElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState<{ id: string; text: string; x: number; y: number; width: number; height: number; fontSize: number; fontFamily: string; textAlign: string } | null>(null);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        setSelectedElement(element);
        const stage = stageRef.current;
        if (stage) {
          const selectedNode = stage.findOne(`#${selectedElementId}`);
          if (selectedNode) {
            transformerRef.current.nodes([selectedNode]);
            transformerRef.current.getLayer()?.batchDraw();
          }
        }
      }
    } else {
      transformerRef.current?.nodes([]);
      setSelectedElement(null);
    }
  }, [selectedElementId, elements]);

  // Handle element selection
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const elementId = e.target.id();
    if (elementId) {
      onElementSelect(elementId);
    } else {
      onElementSelect(null);
    }
  }, [onElementSelect]);

  // Handle element drag start
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(true);
    const pos = e.target.position();
    setDragStart(pos);
  }, []);

  // Handle element drag end
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    const elementId = e.target.id();
    const pos = e.target.position();
    
    if (snapToGrid) {
      pos.x = Math.round(pos.x / gridSize) * gridSize;
      pos.y = Math.round(pos.y / gridSize) * gridSize;
      e.target.position(pos);
    }

    if (elementId) {
      onElementUpdate(elementId, { x: pos.x, y: pos.y });
    }
  }, [snapToGrid, gridSize, onElementUpdate]);

  // Handle element transform
  const handleTransform = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const elementId = e.target.id();
    const node = e.target;
    
    if (elementId) {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      
      // Reset scale and apply to width/height
      node.scaleX(1);
      node.scaleY(1);
      
      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);
      
      onElementUpdate(elementId, {
        width: newWidth,
        height: newHeight,
        rotation: rotation,
      });
    }
  }, [onElementUpdate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementId) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            onElementDelete(selectedElementId);
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
                onElementLock(selectedElementId, !element.locked);
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

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    for (let i = 0; i <= width; i += gridSize) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i}
          y={0}
          width={1}
          height={height}
          fill="#e0e0e0"
          opacity={0.5}
        />
      );
    }
    for (let i = 0; i <= height; i += gridSize) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i}
          width={width}
          height={1}
          fill="#e0e0e0"
          opacity={0.5}
        />
      );
    }
    return lines;
  };

  // Render background
  const renderBackground = () => {
    if (background?.image) {
      return (
        <Image
          image={new window.Image()}
          x={0}
          y={0}
          width={width}
          height={height}
          fill={background.color}
        />
      );
    }
    if (background?.color) {
      return (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={background.color}
        />
      );
    }
    return null;
  };

  // Render element based on type
  const renderElement = (element: KonvaElement) => {
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      opacity: element.opacity,
      visible: element.visible,
      draggable: !element.locked,
      onClick: handleElementClick,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onTransform: handleTransform,
    };

    switch (element.type) {
      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || ''}
            fontSize={element.fontSize || 16}
            fontFamily={element.fontFamily || 'Arial'}
            fontStyle={element.fontStyle || 'normal'}
            fontWeight={element.fontWeight || 'normal'}
            align={element.textAlign || 'left'}
            fill={element.fill || '#000000'}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth || 0}
            verticalAlign="middle"
            onDblClick={(e) => {
              if (element.locked) return;
              e.cancelBubble = true;
              
              const stage = stageRef.current;
              if (!stage) return;
              
              const textNode = e.target;
              // get absolute position taking into account scale
              const absPos = textNode.absolutePosition();
              const scale = stage.scaleX() || 1;
              const globalZoom = 1; // Handled by outer div scale

              setEditingText({
                id: element.id,
                text: element.text || '',
                x: absPos.x,
                y: absPos.y,
                width: textNode.width() * textNode.scaleX(),
                height: textNode.height() * textNode.scaleY(),
                fontSize: (element.fontSize || 16) * textNode.scaleX(),
                fontFamily: element.fontFamily || 'Arial',
                textAlign: element.textAlign || 'left',
              });
              
              // Hide the text node while editing
              textNode.hide();
              transformerRef.current?.nodes([]);
            }}
          />
        );

      case 'rect':
        return (
          <Rect
            {...commonProps}
            fill={element.fillColor || '#000000'}
            stroke={element.strokeColor}
            strokeWidth={element.strokeWidth || 0}
            cornerRadius={element.cornerRadius || 0}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={Math.min(element.width, element.height) / 2}
            fill={element.fillColor || '#000000'}
            stroke={element.strokeColor}
            strokeWidth={element.strokeWidth || 0}
          />
        );

      case 'image':
        return (
          <Image
            {...commonProps}
            image={element.src ? new window.Image() : undefined}
            cropX={element.cropX || 0}
            cropY={element.cropY || 0}
            cropWidth={element.cropWidth || element.width}
            cropHeight={element.cropHeight || element.height}
          />
        );

      case 'group':
        return (
          <Group {...commonProps}>
            {element.children?.map(child => renderElement(child))}
          </Group>
        );

      default:
        return null;
    }
  };

  // Handle drop from tools panel
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/gotek-element');
    const propertiesStr = e.dataTransfer.getData('application/gotek-properties');
    if (!type) return;

    stageRef.current?.setPointersPositions(e.nativeEvent);
    let pos = stageRef.current?.getPointerPosition();
    if (!pos) pos = { x: 50, y: 50 };
    
    if (snapToGrid && gridSize) {
      pos.x = Math.round(pos.x / gridSize) * gridSize;
      pos.y = Math.round(pos.y / gridSize) * gridSize;
    }

    const properties = propertiesStr ? JSON.parse(propertiesStr) : {};

    onElementAdd({
      type: type as any,
      x: pos.x,
      y: pos.y,
      width: type === 'rect' || type === 'circle' ? 100 : 200,
      height: type === 'text' ? 30 : 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: elements.length,
      text: type === 'text' ? 'New Text' : undefined,
      ...properties
    });
  }, [elements.length, onElementAdd, snapToGrid, gridSize]);

  return (
    <div className="relative">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Canvas Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg overflow-hidden relative"
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          >
            {editingText && (
              <textarea
                value={editingText.text}
                onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    const textNode = stageRef.current?.findOne(`#${editingText.id}`);
                    textNode?.show();
                    setEditingText(null);
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onBlur={() => {
                  onElementUpdate(editingText.id, { text: editingText.text });
                  const textNode = stageRef.current?.findOne(`#${editingText.id}`);
                  textNode?.show();
                  setEditingText(null);
                  onElementSelect(editingText.id);
                }}
                autoFocus
                style={{
                  position: 'absolute',
                  top: `${editingText.y}px`,
                  left: `${editingText.x}px`,
                  width: `${editingText.width}px`,
                  height: `${editingText.height}px`,
                  fontSize: `${editingText.fontSize}px`,
                  fontFamily: editingText.fontFamily,
                  textAlign: editingText.textAlign as any,
                  border: 'none',
                  padding: '0px',
                  margin: '0px',
                  overflow: 'hidden',
                  background: 'none',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1,
                  color: '#000',
                  transformOrigin: 'left top',
                  zIndex: 1000,
                  whiteSpace: 'pre-wrap'
                }}
              />
            )}
            <Stage
              ref={stageRef}
              width={width}
              height={height}
              onClick={handleElementClick}
            >
              <Layer>
                {renderBackground()}
                {renderGrid()}
                {elements
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map(element => renderElement(element))}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
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
                x: 50,
                y: 50,
                width: 200,
                height: 30,
                rotation: 0,
                opacity: 1,
                visible: true,
                locked: false,
                zIndex: elements.length,
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
                x: 50,
                y: 50,
                width: 100,
                height: 100,
                rotation: 0,
                opacity: 1,
                visible: true,
                locked: false,
                zIndex: elements.length,
                fillColor: '#000000',
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
                x: 50,
                y: 50,
                width: 100,
                height: 100,
                rotation: 0,
                opacity: 1,
                visible: true,
                locked: false,
                zIndex: elements.length,
                fillColor: '#000000',
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
                      onElementLock(selectedElementId, !element.locked);
                    }
                  }}
                >
                  {selectedElement?.locked ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  {selectedElement?.locked ? 'Unlock' : 'Lock'}
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
