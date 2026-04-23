import { Group, Line, Rect, Circle, RegularPolygon, Shape } from 'react-konva';
import { useMemo } from 'react';
import { StrapPattern } from '../data/strapPatterns';

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
}

interface PatternProps {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
  strapW: number;
  colors: string[];
}

/**
 * Renders decorative patterns on the lanyard strap inside a clipping region.
 * Each pattern type has its own procedural drawing routine using Konva shapes.
 */
export default function StrapPatternRenderer({ clipPoints, pattern, strapW, opacity = 0.9 }: {
  clipPoints: number[];
  pattern: StrapPattern | null;
  strapW: number;
  opacity?: number;
}) {
  const bounds = useMemo(() => {
    if (!clipPoints || clipPoints.length < 6) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < clipPoints.length; i += 2) {
      const x = clipPoints[i], y = clipPoints[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }, [clipPoints]);

  const clipFunc = useMemo(() => {
    if (!clipPoints || clipPoints.length < 6) return undefined;
    return (ctx: any) => {
      ctx.beginPath();
      ctx.moveTo(clipPoints[0], clipPoints[1]);
      for (let i = 2; i < clipPoints.length; i += 2) { 
        ctx.lineTo(clipPoints[i], clipPoints[i + 1]); 
      }
      ctx.closePath();
    };
  }, [clipPoints]);

  if (!pattern || !clipPoints || clipPoints.length < 6) return null;

  const colors = pattern.patternColors || ['rgba(255,255,255,0.15)'];

  return (
    <Group clipFunc={clipFunc} opacity={opacity} listening={false}>
      <PatternShapes render={pattern.render} bounds={bounds} strapW={strapW} colors={colors} />
    </Group>
  );
}

function PatternShapes({ render, bounds, strapW, colors }: {
  render: string;
  bounds: Bounds;
  strapW: number;
  colors: string[];
}) {
  const props = { ...bounds, strapW, colors };
  switch (render) {
    case 'geometric-diamonds': return <DiamondPattern {...props} />;
    case 'geometric-chevrons': return <ChevronPattern {...props} />;
    case 'geometric-hexagons': return <HexagonPattern {...props} />;
    case 'tribal-lines': return <TribalPattern {...props} />;
    case 'racing-stripes': return <RacingStripePattern {...props} />;
    case 'polka-dots': return <PolkaDotPattern {...props} />;
    case 'stars': return <StarsPattern {...props} />;
    case 'bubbles': return <BubblesPattern {...props} />;
    case 'zigzag': return <ZigzagPattern {...props} />;
    case 'hearts': return <HeartsPattern {...props} />;
    case 'confetti': return <ConfettiPattern {...props} />;
    case 'waves': return <WavesPattern {...props} />;
    case 'marble-swirl': return <MarbleSwirlPattern {...props} />;
    case 'flames': return <FlamesPattern {...props} />;
    case 'circuit': return <CircuitPattern {...props} />;
    case 'seigaiha': return <SeigaihaPattern {...props} />;
    case 'mandala': return <MandalaPattern {...props} />;
    case 'grid-lines': return <GridLinesPattern {...props} />;
    case 'diagonal-shift': return <DiagonalShiftPattern {...props} />;
    case 'triangles': return <TrianglesPattern {...props} />;
    case 'clouds': return <CloudsPattern {...props} />;
    case 'floral': return <FloralPattern {...props} />;
    case 'ink': return <InkPattern {...props} />;
    case 'carbon-fiber': return <CarbonFiberPattern {...props} />;
    case 'herringbone': return <HerringbonePattern {...props} />;
    case 'topographic': return <TopographicPattern {...props} />;
    case 'speckle': return <SpecklePattern {...props} />;
    case 'micro-grid': return <MicroGridPattern {...props} />;
    default: return null;
  }
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATTERN IMPLEMENTAIONS
// ═══════════════════════════════════════════════════════════════════════════════

function DiamondPattern({ minX, minY, maxX, maxY, strapW, colors }: PatternProps) {
  const size = Math.max(12, strapW * 0.35);
  const items = []; let idx = 0;
  for (let y = minY - size; y < maxY + size; y += size) {
    for (let x = minX - size; x < maxX + size; x += size) {
      const cx = x + size/2, cy = y + size/2, hs = size * 0.42;
      items.push(<Line key={idx++} points={[cx, cy - hs, cx + hs, cy, cx, cy + hs, cx - hs, cy]} closed stroke={colors[0]} strokeWidth={1.2} fill={colors[1] || 'transparent'} />);
    }
  }
  return <Group>{items}</Group>;
}

function ChevronPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const spacing = Math.max(14, strapW * 0.5);
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;
  if (isHoriz) {
    for (let x = minX; x < maxX + spacing; x += spacing) {
      const midY = (minY + maxY) / 2;
      items.push(<Line key={idx++} points={[x, minY - 5, x - spacing * 0.4, midY, x, maxY + 5]} stroke={colors[0]} strokeWidth={2} lineCap="round" />);
    }
  } else {
    for (let y = minY; y < maxY + spacing; y += spacing) {
      const midX = (minX + maxX) / 2;
      items.push(<Line key={idx++} points={[minX - 5, y, midX, y - spacing * 0.4, maxX + 5, y]} stroke={colors[0]} strokeWidth={2} lineCap="round" />);
    }
  }
  return <Group>{items}</Group>;
}

function HexagonPattern({ minX, minY, maxX, maxY, strapW, colors }: PatternProps) {
  const r = Math.max(8, strapW * 0.28);
  const items = []; let idx = 0;
  const dx = r * 1.75, dy = r * 1.52;
  let row = 0;
  for (let y = minY - r; y < maxY + r; y += dy) {
    const offsetX = (row % 2) * (dx / 2);
    for (let x = minX - r + offsetX; x < maxX + r; x += dx) {
      const pts: number[] = [];
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a - Math.PI / 6;
        pts.push(x + r * 0.75 * Math.cos(angle), y + r * 0.75 * Math.sin(angle));
      }
      items.push(<Line key={idx++} points={pts} closed stroke={colors[0]} strokeWidth={1} fill={colors[1] || 'transparent'} />);
    }
    row++;
  }
  return <Group>{items}</Group>;
}

function TribalPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const spacing = Math.max(18, strapW * 0.65);
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;

  if (isHoriz) {
    const midY = (minY + maxY) / 2;
    for (let x = minX; x < maxX; x += spacing) {
      items.push(<Line key={idx++} points={[x, midY, x + spacing, midY]} stroke={colors[0]} strokeWidth={2} />);
      const ds = spacing * 0.25;
      items.push(<Line key={idx++} points={[x + spacing * 0.5 - ds, midY, x + spacing * 0.5, midY + ds, x + spacing * 0.5 + ds, midY, x + spacing * 0.5, midY - ds]} closed stroke={colors[0]} strokeWidth={1.5} fill={colors[1] || 'transparent'} />);
    }
  } else {
    const midX = (minX + maxX) / 2;
    for (let y = minY; y < maxY; y += spacing) {
      items.push(<Line key={idx++} points={[midX, y, midX, y + spacing]} stroke={colors[0]} strokeWidth={2} />);
      const ds = spacing * 0.25;
      items.push(<Line key={idx++} points={[midX, y + spacing * 0.5 - ds, midX + ds, y + spacing * 0.5, midX, y + spacing * 0.5 + ds, midX - ds, y + spacing * 0.5]} closed stroke={colors[0]} strokeWidth={1.5} fill={colors[1] || 'transparent'} />);
    }
  }
  return <Group>{items}</Group>;
}

function RacingStripePattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const sw = Math.max(2, strapW * 0.08), gap = sw * 1.5;
  const isHoriz = w > h * 1.5;
  if (isHoriz) {
    const midY = (minY + maxY) / 2;
    return (
      <Group>
        <Line points={[minX - 10, midY - gap, maxX + 10, midY - gap]} stroke={colors[0]} strokeWidth={sw} />
        <Line points={[minX - 10, midY, maxX + 10, midY]} stroke={colors[1] || colors[0]} strokeWidth={sw * 0.6} />
        <Line points={[minX - 10, midY + gap, maxX + 10, midY + gap]} stroke={colors[0]} strokeWidth={sw} />
      </Group>
    );
  }
  const midX = (minX + maxX) / 2;
  return (
    <Group>
      <Line points={[midX - gap, minY - 10, midX - gap, maxY + 10]} stroke={colors[0]} strokeWidth={sw} />
      <Line points={[midX, minY - 10, midX, maxY + 10]} stroke={colors[1] || colors[0]} strokeWidth={sw * 0.6} />
      <Line points={[midX + gap, minY - 10, midX + gap, maxY + 10]} stroke={colors[0]} strokeWidth={sw} />
    </Group>
  );
}

function PolkaDotPattern({ minX, minY, maxX, maxY, strapW, colors }: PatternProps) {
  const spacing = Math.max(12, strapW * 0.45), r = Math.max(2, strapW * 0.08);
  const items = []; let idx = 0, row = 0;
  for (let y = minY; y < maxY + spacing; y += spacing) {
    const offset = (row % 2) * (spacing / 2);
    for (let x = minX + offset; x < maxX + spacing; x += spacing) { items.push(<Circle key={idx++} x={x} y={y} radius={r} fill={colors[0]} />); }
    row++;
  }
  return <Group>{items}</Group>;
}

function GridLinesPattern({ minX, minY, maxX, maxY, colors }: PatternProps) {
  const spacing = 12; // Adjusted spacing
  const items = []; let idx = 0;
  for (let x = minX; x < maxX; x += spacing) { items.push(<Line key={idx++} points={[x, minY, x, maxY]} stroke={colors[0]} strokeWidth={1} />); }
  for (let y = minY; y < maxY; y += spacing) { items.push(<Line key={idx++} points={[minX, y, maxX, y]} stroke={colors[1] || colors[0]} strokeWidth={1} />); }
  return <Group>{items}</Group>;
}

function DiagonalShiftPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const spacing = Math.max(12, strapW * 0.5);
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;
  if (isHoriz) {
    for (let x = minX - 100; x < maxX + 100; x += spacing) {
      items.push(<Line key={idx++} points={[x, minY - 20, x + strapW, maxY + 20]} stroke={colors[0]} strokeWidth={3} lineCap="round" />);
    }
  } else {
    for (let y = minY - 100; y < maxY + 100; y += spacing) {
      items.push(<Line key={idx++} points={[minX - 20, y, maxX + 20, y + strapW]} stroke={colors[0]} strokeWidth={3} lineCap="round" />);
    }
  }
  return <Group>{items}</Group>;
}

function ZigzagPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const amp = Math.max(4, strapW * 0.2), period = Math.max(10, strapW * 0.35);
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;
  const stripeCount = Math.max(2, Math.floor(strapW / (amp * 1.8)));

  if (isHoriz) {
    for (let s = 0; s < stripeCount; s++) {
      const offsetY = minY + ((maxY - minY) / (stripeCount + 1)) * (s + 1);
      const color = colors[s % colors.length], pts: number[] = [];
      for (let x = minX - period; x < maxX + period; x += period) {
        const zy = ((Math.floor((x - minX) / period)) % 2 === 0) ? offsetY - amp : offsetY + amp;
        pts.push(x, zy);
      }
      items.push(<Line key={idx++} points={pts} stroke={color} strokeWidth={2} lineCap="round" lineJoin="round" />);
    }
  } else {
    for (let s = 0; s < stripeCount; s++) {
      const offsetX = minX + ((maxX - minX) / (stripeCount + 1)) * (s + 1);
      const color = colors[s % colors.length], pts: number[] = [];
      for (let y = minY - period; y < maxY + period; y += period) {
        const zx = ((Math.floor((y - minY) / period)) % 2 === 0) ? offsetX - amp : offsetX + amp;
        pts.push(zx, y);
      }
      items.push(<Line key={idx++} points={pts} stroke={color} strokeWidth={2} lineCap="round" lineJoin="round" />);
    }
  }
  return <Group>{items}</Group>;
}

function WavesPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const waveHeight = Math.max(8, strapW * 0.35), waveSpacing = waveHeight * 2;
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;

  if (isHoriz) {
    for (let x = minX - waveSpacing; x < maxX + waveSpacing; x += waveSpacing) {
      for (let layer = 0; layer < 3; layer++) {
        const pts: number[] = [], layerOffset = layer * waveHeight * 0.3;
        for (let y = minY - 20; y < maxY + 20; y += 4) {
          const waveX = x + layerOffset + Math.sin(((y - minY) / (strapW * 0.8)) * Math.PI) * waveHeight * 0.5;
          pts.push(waveX, y);
        }
        items.push(<Line key={idx++} points={pts} stroke={colors[layer % colors.length]} strokeWidth={1.5} tension={0.4} lineCap="round" />);
      }
    }
  } else {
    for (let y = minY - waveSpacing; y < maxY + waveSpacing; y += waveSpacing) {
      for (let layer = 0; layer < 3; layer++) {
        const pts: number[] = [], layerOffset = layer * waveHeight * 0.3;
        for (let x = minX - 20; x < maxX + 20; x += 4) {
          const waveY = y + layerOffset + Math.sin(((x - minX) / (strapW * 0.8)) * Math.PI) * waveHeight * 0.5;
          pts.push(x, waveY);
        }
        items.push(<Line key={idx++} points={pts} stroke={colors[layer % colors.length]} strokeWidth={1.5} tension={0.4} lineCap="round" />);
      }
    }
  }
  return <Group>{items}</Group>;
}

function MarbleSwirlPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const items = []; let idx = 0;
  const length = Math.max(w, h);
  const count = Math.floor(length / (strapW * 1.5));
  const isHoriz = w > h * 1.5;

  for (let i = 0; i < count; i++) {
    const pts: number[] = [], progress = i / count;
    if (isHoriz) {
      const x = minX + progress * w;
      for (let t = 0; t <= 20; t++) {
        const p = t/20;
        pts.push(x + p * strapW * 1.2, (minY + maxY)/2 + Math.sin(p * Math.PI * 3 + i) * strapW * 0.35);
      }
    } else {
      const y = minY + progress * h;
      for (let t = 0; t <= 20; t++) {
        const p = t/20;
        pts.push((minX + maxX)/2 + Math.sin(p * Math.PI * 3 + i) * strapW * 0.35, y + p * strapW * 1.2);
      }
    }
    items.push(<Line key={idx++} points={pts} stroke={colors[i % colors.length]} strokeWidth={1.5} tension={0.5} lineCap="round" />);
  }
  return <Group>{items}</Group>;
}

function StarsPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(42), length = Math.max(w, h), count = Math.floor((length / strapW) * 4);
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * w, y = minY + rand() * h;
    const size = 3 + rand() * Math.max(4, strapW * 0.18);
    const rotation = rand() * 360;
    items.push(<StarShape key={i} x={x} y={y} size={size} fill={colors[Math.floor(rand() * colors.length)]} rotation={rotation} />);
  }
  return <Group>{items}</Group>;
}
function StarShape({ x, y, size, fill, rotation = 0 }: { x: number; y: number; size: number; fill: string; rotation?: number }) {
  const pts: number[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2.5) * i - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    pts.push(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
    pts.push(Math.cos(innerAngle) * size * 0.4, Math.sin(innerAngle) * size * 0.4);
  }
  return <Line x={x} y={y} points={pts} closed fill={fill} rotation={rotation} />;
}

function BubblesPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(77), length = Math.max(w, h), count = Math.floor((length / strapW) * 3);
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * w, y = minY + rand() * h;
    const r = 2 + rand() * Math.max(4, strapW * 0.2), color = colors[Math.floor(rand() * colors.length)];
    items.push(<Group key={i}><Circle x={x} y={y} radius={r} fill={color} opacity={0.45} /><Circle x={x} y={y} radius={r} stroke={color} strokeWidth={1} opacity={0.7} /><Circle x={x - r * 0.25} y={y - r * 0.25} radius={r * 0.2} fill="rgba(255,255,255,0.6)" /></Group>);
  }
  return <Group>{items}</Group>;
}

function HeartsPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(14), length = Math.max(w, h), count = Math.floor((length / strapW) * 3);
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * w, y = minY + rand() * h;
    const size = 3 + rand() * Math.max(3, strapW * 0.15), rotation = -15 + rand() * 30;
    items.push(<HeartShape key={i} x={x} y={y} size={size} fill={colors[Math.floor(rand() * colors.length)]} rotation={rotation} />);
  }
  return <Group>{items}</Group>;
}
function HeartShape({ x, y, size, fill, rotation = 0 }: { x: number; y: number; size: number; fill: string; rotation?: number }) {
  return <Shape x={x} y={y} rotation={rotation} sceneFunc={(ctx: any, shape: any) => { ctx.beginPath(); ctx.moveTo(0, size * 0.35); ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.05, -size, 0, -size * 0.4); ctx.bezierCurveTo(size * 0.05, -size, size, -size * 0.3, 0, size * 0.35); ctx.closePath(); ctx.fillStrokeShape(shape); }} fill={fill} />;
}

function ConfettiPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(33), length = Math.max(w, h), count = Math.floor((length / strapW) * 5);
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * w, y = minY + rand() * h, sw = 2 + rand() * 4, sh = 5 + rand() * 8, rotation = rand() * 360;
    items.push(<Rect key={i} x={x} y={y} width={sw} height={sh} fill={colors[Math.floor(rand() * colors.length)]} rotation={rotation} cornerRadius={1} opacity={0.6 + rand() * 0.4} />);
  }
  return <Group>{items}</Group>;
}

function TrianglesPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(111), length = Math.max(w, h), count = Math.floor((length / strapW) * 4);
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * w, y = minY + rand() * h, size = 6 + rand() * 8, rotation = rand() * 360;
    items.push(<Line key={i} x={x} y={y} points={[0, -size, size, size, -size, size]} closed fill={colors[Math.floor(rand() * colors.length)]} rotation={rotation} />);
  }
  return <Group>{items}</Group>;
}

function CloudsPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(222), length = Math.max(w, h), count = Math.floor((length / strapW) * 2);
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * w, y = minY + rand() * h, scale = 0.5 + rand() * 0.5;
    items.push(<Group key={i} x={x} y={y} scaleX={scale} scaleY={scale}><Circle x={0} y={0} radius={8} fill={colors[0]} /><Circle x={8} y={-4} radius={10} fill={colors[0]} /><Circle x={16} y={1} radius={7} fill={colors[0]} /><Rect x={0} y={2} width={16} height={6} fill={colors[0]} /></Group>);
  }
  return <Group>{items}</Group>;
}

function CarbonFiberPattern({ minX, minY, maxX, maxY, colors }: PatternProps) {
  const size = 4;
  const items = []; let idx = 0;
  for (let y = minY - size; y < maxY + size; y += size) {
    for (let x = minX - size; x < maxX + size; x += size) {
      const fill = ((Math.floor(x/size) + Math.floor(y/size)) % 2 === 0) ? colors[0] : (colors[1] || 'rgba(0,0,0,0.1)');
      items.push(<Rect key={idx++} x={x} y={y} width={size-0.5} height={size-0.5} fill={fill} opacity={0.6} />);
    }
  }
  return <Group>{items}</Group>;
}

function HerringbonePattern({ minX, minY, maxX, maxY, w, h, colors }: PatternProps) {
  const size = 10;
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;
  if (isHoriz) {
    for (let x = minX - 50; x < maxX + 50; x += size) {
      for (let y = minY - 50; y < maxY + 50; y += size * 2) {
        const isAlt = (Math.floor(x/size)) % 2 === 0;
        const pts = isAlt ? [x, y, x + size, y + size] : [x, y + size, x + size, y];
        items.push(<Line key={idx++} points={pts} stroke={colors[0]} strokeWidth={1} />);
      }
    }
  } else {
    for (let y = minY - 50; y < maxY + 50; y += size) {
      for (let x = minX - 50; x < maxX + 50; x += size * 2) {
        const isAlt = (Math.floor(y/size)) % 2 === 0;
        const pts = isAlt ? [x, y, x + size, y + size] : [x + size, y, x, y + size];
        items.push(<Line key={idx++} points={pts} stroke={colors[0]} strokeWidth={1} />);
      }
    }
  }
  return <Group>{items}</Group>;
}

function TopographicPattern({ minX, minY, maxX, maxY, strapW, colors }: PatternProps) {
  const rand = seededRandom(444);
  const items = []; let idx = 0;
  for (let i = 0; i < 8; i++) {
    const cx = minX + rand() * (maxX - minX), cy = minY + rand() * (maxY - minY), rad = strapW * 0.8;
    for (let r = 0; r < 4; r++) { items.push(<Circle key={idx++} x={cx} y={cy} radius={rad * (r+1) * 0.25} stroke={colors[r % colors.length]} strokeWidth={0.8} opacity={0.3} />); }
  }
  return <Group>{items}</Group>;
}

function SpecklePattern({ minX, minY, maxX, maxY, w, h, colors }: PatternProps) {
  const rand = seededRandom(555), length = Math.max(w, h), count = Math.floor(length * 2);
  const items = [];
  for (let i = 0; i < count; i++) { items.push(<Circle key={i} x={minX + rand() * w} y={minY + rand() * h} radius={0.5 + rand() * 1} fill={colors[i % colors.length]} opacity={0.6} />); }
  return <Group>{items}</Group>;
}

function MicroGridPattern({ minX, minY, maxX, maxY, colors }: PatternProps) {
  const spacing = 4;
  const items = []; let idx = 0;
  for (let x = minX; x < maxX; x += spacing) { items.push(<Line key={idx++} points={[x, minY, x, maxY]} stroke={colors[0]} strokeWidth={0.3} opacity={0.4} />); }
  for (let y = minY; y < maxY; y += spacing) { items.push(<Line key={idx++} points={[minX, y, maxX, y]} stroke={colors[1] || colors[0]} strokeWidth={0.3} opacity={0.4} />); }
  return <Group>{items}</Group>;
}

function SeigaihaPattern({ minX, minY, maxX, maxY, strapW, colors }: PatternProps) {
  const r = Math.max(8, strapW * 0.35);
  const items = []; let idx = 0, dx = r * 2, dy = r, row = 0;
  for (let y = minY - r; y < maxY + r; y += dy) {
    const offsetX = (row % 2) * r;
    for (let x = minX - r + offsetX; x < maxX + r; x += dx) {
      for (let ring = 3; ring >= 1; ring--) {
        const arcR = r * (ring / 3) * 0.9;
        items.push(<Shape key={idx++} sceneFunc={(ctx: any, shape: any) => { ctx.beginPath(); ctx.arc(x, y, arcR, 0, Math.PI, false); ctx.strokeShape(shape); }} stroke={colors[ring % colors.length]} strokeWidth={0.8} />);
      }
    }
    row++;
  }
  return <Group>{items}</Group>;
}

function MandalaPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const spacing = Math.max(30, strapW * 1.2), r = spacing * 0.4;
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;
  const count = Math.floor(Math.max(w, h) / spacing);

  for (let i = 0; i < count; i++) {
    const cx = isHoriz ? minX + (i+0.5)*spacing : (minX+maxX)/2;
    const cy = isHoriz ? (minY+maxY)/2 : minY + (i+0.5)*spacing;
    items.push(<Circle key={idx++} x={cx} y={cy} radius={r} stroke={colors[0]} strokeWidth={1.2} />);
    items.push(<Circle key={idx++} x={cx} y={cy} radius={r * 0.6} stroke={colors[1] || colors[0]} strokeWidth={0.8} />);
    for (let a = 0; a < 8; a++) {
      const angle = (Math.PI / 4) * a;
      items.push(<Line key={idx++} points={[cx + Math.cos(angle) * r*0.3, cy + Math.sin(angle) * r*0.3, cx + Math.cos(angle) * r, cy + Math.sin(angle)*r]} stroke={colors[0]} strokeWidth={0.8} />);
    }
  }
  return <Group>{items}</Group>;
}

function FloralPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const spacing = Math.max(25, strapW), r = spacing * 0.35;
  const items = []; let idx = 0;
  const isHoriz = w > h * 1.5;
  const count = Math.floor(Math.max(w, h) / spacing);

  for (let i = 0; i < count; i++) {
    const cx = isHoriz ? minX + (i+0.5)*spacing : (minX+maxX)/2;
    const cy = isHoriz ? (minY+maxY)/2 : minY + (i+0.5)*spacing;
    for (let a = 0; a < 6; a++) {
      const angle = (Math.PI / 3) * a;
      items.push(<Circle key={idx++} x={cx + Math.cos(angle)*r} y={cy + Math.sin(angle)*r} radius={r*0.6} fill={colors[0]} opacity={0.6} />);
    }
    items.push(<Circle key={idx++} x={cx} y={cy} radius={r*0.4} fill={colors[1] || colors[0]} />);
  }
  return <Group>{items}</Group>;
}

function InkPattern({ minX, minY, maxX, maxY, w, h, strapW, colors }: PatternProps) {
  const rand = seededRandom(999), length = Math.max(w, h), count = Math.floor(length / (strapW * 0.8));
  const items = [];
  for (let i = 0; i < count; i++) {
    const tx = rand(), ty = rand();
    const cx = minX + tx * w, cy = minY + ty * h;
    const rad = strapW * (0.2 + rand() * 0.4), color = colors[Math.floor(rand() * colors.length)];
    const pts: number[] = [];
    for (let a = 0; a < 8; a++) {
      const angle = (Math.PI/4)*a, dist = rad*(0.6 + rand()*0.6);
      pts.push(cx + Math.cos(angle)*dist, cy + Math.sin(angle)*dist);
    }
    items.push(<Line key={i} points={pts} closed fill={color} tension={0.5} opacity={0.7} />);
  }
  return <Group>{items}</Group>;
}
