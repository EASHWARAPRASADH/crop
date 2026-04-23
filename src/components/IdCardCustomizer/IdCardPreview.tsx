import { Group, Rect, Text, Image as KonvaImage, Transformer, Circle, RegularPolygon } from 'react-konva';
import { useConfiguratorStore } from '@/store/useConfiguratorStore';
import { useCanvasImage } from '@/hooks/useCanvasImage';
import { useRef, useEffect } from 'react';

const cardSizes: Record<string, { width: number; height: number }> = {
  '54x86': { width: 153, height: 244 },
  '86x54': { width: 244, height: 153 },
  '100x70': { width: 283, height: 198 },
  '70x100': { width: 198, height: 283 },
};

const getKonvaFill = (fill: string, width: number, height: number) => {
  if (!fill) return { fill: '#ffffff' };
  if (typeof fill === 'string' && fill.includes('linear-gradient')) {
    const colors = fill.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
    if (colors && colors.length >= 2) {
      return {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: width, y: height },
        fillLinearGradientColorStops: [0, colors[0], 1, colors[colors.length - 1]],
      };
    }
  }
  return { fill };
};

function CanvasElement({ element, onDragEnd, onTransformEnd, onClick, onDblClick, isSelected, isReviewStep }: any) {
  const image = useCanvasImage(element.src);
  const lastClickTimeRef = useRef(0);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, element]);

  const handleTap = (e: any) => {
    e.cancelBubble = true;
    const time = new Date().getTime();
    if (time - lastClickTimeRef.current < 400) {
      if (onDblClick) onDblClick(element.id, e);
    } else {
      if (onClick) onClick(element.id, e);
    }
    lastClickTimeRef.current = time;
  };

  const commonProps = {
    ref: shapeRef,
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    scaleX: element.scaleX || 1,
    scaleY: element.scaleY || 1,
    draggable: !isReviewStep,
    onDragEnd: (e: any) => onDragEnd(element.id, { x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: any) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      node.scaleX(1);
      node.scaleY(1);

      if (element.type === 'text') {
        onTransformEnd(element.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          fontSize: (element.fontSize || 12) * Math.max(scaleX, scaleY),
        });
      } else {
        onTransformEnd(element.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        });
      }
    },
    onClick: handleTap,
    onTap: handleTap,
  };

  let NodeComponent = null;
  switch (element.type) {
    case 'text':
      NodeComponent = <Text {...commonProps} text={element.content} fontSize={element.fontSize} fill={element.fill} width={element.width} align={element.align} fontStyle={element.fontStyle} lineHeight={element.lineHeight || 1.2} letterSpacing={element.letterSpacing || 0} />;
      break;
    case 'image':
      NodeComponent = <KonvaImage {...commonProps} image={image} width={element.width} height={element.height} cornerRadius={element.cornerRadius || 0} />;
      break;
    case 'rect':
      NodeComponent = <Rect {...commonProps} width={element.width} height={element.height} fill={element.fill} cornerRadius={element.cornerRadius || 0} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'circle':
      NodeComponent = <Circle {...commonProps} x={element.x + (element.width || 0)/2} y={element.y + (element.width || 0)/2} radius={(element.width || 0) / 2} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'triangle':
      NodeComponent = <RegularPolygon {...commonProps} x={element.x + (element.width || 0)/2} y={element.y + (element.width || 0)/2} sides={3} radius={(element.width || 0) / 1.5} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'rhombus':
      NodeComponent = <RegularPolygon {...commonProps} x={element.x + (element.width || 0)/2} y={element.y + (element.width || 0)/2} sides={4} radius={(element.width || 0) / 1.4} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
  }

  return (
    <Group>
      {NodeComponent}
      {isSelected && !isReviewStep && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </Group>
  );
}

export const IdCardPreview = ({ onSelectElement, onUpdateElement, onDblClickElement, isReviewStep, forceSide }: any) => {
  const design = useConfiguratorStore((state) => state.design);
  const { size, activeSide, showBothSides } = design.idCard;
  
  const { width, height } = cardSizes[size] || cardSizes['54x86'];
  const isHorizontal = width > height;

  const renderSide = (sideName: 'front' | 'back', offsetX: number, offsetY = 0) => {
    const sideData = design.idCard[sideName];
    const isActive = sideName === activeSide;
    
    if (forceSide && sideName !== forceSide) return null;

    return (
      <Group 
        x={offsetX} 
        y={offsetY} 
        opacity={showBothSides && !isActive && !forceSide ? 0.7 : 1}
      >
        <Rect 
          width={width} 
          height={height} 
          {...getKonvaFill(sideData.backgroundColor, width, height)} 
          cornerRadius={15} 
          stroke={isActive ? "#5d5fef" : "#ccc"} 
          strokeWidth={isActive ? 2 : 1} 
          shadowColor="rgba(0,0,0,0.1)" 
          shadowBlur={10} 
          shadowOffsetY={4} 
          onMouseDown={(e) => {
            if (isReviewStep) return;
            e.cancelBubble = true;
            if (onSelectElement) {
              onSelectElement(null, sideName);
            }
          }}
          onTap={(e) => {
            if (isReviewStep) return;
            e.cancelBubble = true;
            if (onSelectElement) {
              onSelectElement(null, sideName);
            }
          }}
        />
        <Group clipFunc={(ctx: any) => {
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(width - 15, 0);
          ctx.quadraticCurveTo(width, 0, width, 15);
          ctx.lineTo(width, height - 15);
          ctx.quadraticCurveTo(width, height, width - 15, height);
          ctx.lineTo(15, height);
          ctx.quadraticCurveTo(0, height, 0, height - 15);
          ctx.lineTo(0, 15);
          ctx.quadraticCurveTo(0, 0, 15, 0);
          ctx.closePath();
        }}>
          {sideData.elements.map((el) => (
              <CanvasElement 
                key={el.id} 
                element={el} 
                onDragEnd={(id: string, pos: any) => onUpdateElement(id, pos, sideName)} 
                onTransformEnd={(id: string, pos: any) => onUpdateElement(id, pos, sideName)}
                onClick={(id: string) => onSelectElement(id, sideName)} 
                onDblClick={(id: string, e: any) => onDblClickElement && onDblClickElement(id, sideName, e)}
                isSelected={design.idCard.selected === el.id}
                isReviewStep={isReviewStep}
              />
          ))}
        </Group>
        {showBothSides && (
          <Text text={sideName.toUpperCase()} x={0} y={height + 15} width={width} align="center" fontSize={12} fill="#919191" fontStyle="bold" />
        )}
      </Group>
    );
  };

  return (
    <Group 
      onMouseDown={(e: any) => {
        if (isReviewStep) return;
        if (e.target === e.target.getStage()) {
          if (onSelectElement) {
            onSelectElement(null);
          }
        }
      }}
    >
      {renderSide(forceSide || (showBothSides ? 'front' : activeSide), 0, 0)}
      {showBothSides && !forceSide && renderSide('back', isHorizontal ? 0 : width + 40, isHorizontal ? height + 40 : 0)}
    </Group>
  );
};
