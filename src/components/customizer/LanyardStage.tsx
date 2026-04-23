import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { useCanvasImage } from '../../hooks/useCanvasImage';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { getPatternById } from '../../data/strapPatterns';
import StrapPatternRenderer from './StrapPatternRenderer';
import IdCardPreview from './IdCardPreview';

// ─── Canvas constants ──────────────────────────────────────────────────────────
const BASE_WIDTH = 820;
const BASE_HEIGHT = 840;

// ─── Responsive container width ───────────────────────────────────────────────
function useContainerWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(BASE_WIDTH);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width || BASE_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function shadeHex(hex: string, pct: number) {
  const c = (hex || '#888').replace('#', '');
  if (c.length !== 6) return hex || '#888';
  const n = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (n & 0xff) + pct));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function isGrad(c: any) { return typeof c === 'string' && c.includes('gradient'); }
function baseColor(color: string) {
  if (isGrad(color)) { const m = color.match(/#[a-fA-F0-9]{6}/g); return m ? m[0] : '#888'; }
  return color || '#888';
}
function gradFill(color: string, p1: { x: number; y: number }, p2: { x: number; y: number }) {
  if (!isGrad(color)) return { fill: color };
  const cols = color.match(/#[a-fA-F0-9]{6}/g);
  if (cols && cols.length >= 2)
    return {
      fill: undefined,
      fillLinearGradientStartPoint: p1,
      fillLinearGradientEndPoint: p2,
      fillLinearGradientColorStops: [0, cols[0], 1, cols[1]],
    };
  return { fill: color };
}

// ─── Per-edge inset stitching segments ────────────────────────────────────────
function edgeStitchSegs(pts: number[], d: number, minLen: number) {
  const n = pts.length / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1];
    const x1 = pts[j * 2], y1 = pts[j * 2 + 1];
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (!len || len < minLen) continue;
    const nx = (-dy / len) * d;
    const ny = (dx / len) * d;
    out.push([x0 + nx, y0 + ny, x1 + nx, y1 + ny]);
  }
  return out;
}

// ─── Strap with professional fabric edges + stitching ─────────────────────────
function ProStrap({ points, color, strapW, pattern, patternOpacity }: any) {
  const bc = baseColor(color);
  const hiColor = shadeHex(bc, 50);
  const shColor = shadeHex(bc, -60);
  const fillProp = gradFill(color, { x: points[0], y: 0 }, { x: points[2], y: 0 });
  const stitchD = Math.min(2.8, strapW * 0.08);
  const segs = edgeStitchSegs(points, stitchD, strapW * 1.4);

  return (
    <Group>
      <Line points={points} closed stroke={shColor} strokeWidth={0.9} lineJoin="miter" {...fillProp} />
      <StrapPatternRenderer clipPoints={points} pattern={pattern} strapW={strapW} opacity={patternOpacity} />
      <Line points={points} closed stroke="transparent" strokeWidth={0} listening={false}
        fillLinearGradientStartPoint={{ x: points[0], y: 0 }}
        fillLinearGradientEndPoint={{ x: points[0], y: strapW }}
        fillLinearGradientColorStops={[0, 'rgba(255,255,255,0.20)', 0.4, 'rgba(255,255,255,0.05)', 0.6, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.12)']}
      />
      <Line points={points} closed stroke={hiColor} strokeWidth={2} opacity={0.18} fill="transparent" listening={false} />
      {segs.map((seg, i) => (
        <Line key={i} points={seg} stroke="rgba(255,255,255,0.55)" strokeWidth={0.9} dash={[4, 3]} lineCap="round" listening={false} />
      ))}
    </Group>
  );
}

// ─── Realistic folded corner ──────────────────────────────────────────────────
function CornerFold({ side, ox, oy, strapW, color }: any) {
  const bc = baseColor(color);
  const foldCol = shadeHex(bc, -70);
  if (side === 'left') {
    const ax = ox, bx = ox + strapW, cx = ox, dx = ox + strapW;
    const ay = oy, by = oy, cy = oy + strapW, dy = oy + strapW;
    return (
      <Group>
        <Line points={[ax, ay, bx, by, cx, cy]} closed fill="#ffffff" stroke="transparent" />
        <Line points={[bx, by, dx, dy, cx, cy]} closed fill={foldCol} stroke="transparent" />
        <Line points={[bx, by, cx, cy]} stroke="rgba(0,0,0,0.40)" strokeWidth={1.4} lineCap="round" />
        <Line points={[bx + 0.6, by + 0.6, cx + 0.6, cy - 0.6]} stroke="rgba(255,255,255,0.25)" strokeWidth={0.7} lineCap="round" />
      </Group>
    );
  }
  const ax = ox, bx = ox - strapW, cx = ox, dx = ox - strapW;
  const ay = oy, by = oy, cy = oy + strapW, dy = oy + strapW;
  return (
    <Group>
      <Line points={[ax, ay, bx, by, cx, cy]} closed fill="#ffffff" stroke="transparent" />
      <Line points={[bx, by, cx, cy, dx, dy]} closed fill={foldCol} stroke="transparent" />
      <Line points={[bx, by, cx, cy]} stroke="rgba(0,0,0,0.40)" strokeWidth={1.4} lineCap="round" />
      <Line points={[bx - 0.6, by + 0.6, cx - 0.6, cy - 0.6]} stroke="rgba(255,255,255,0.25)" strokeWidth={0.7} lineCap="round" />
    </Group>
  );
}

// ─── Static Logo placed near the clip ──────────────────────────────────────────
function StaticLogo({ cx, cy, angle, logo, strapW, logoScale, logoOffset, logoRotation, onRemove, onDrag, showControls, design }: any) {
  if (!logo) return null;
  const imgRatio = logo.width / logo.height;
  const scale = logoScale || 1;
  const targetH = strapW * 0.8 * scale;
  const targetW = targetH * imgRatio;

  return (
    <Group 
      x={cx} y={cy} rotation={angle}
      draggable={showControls}
      onDragEnd={(e) => {
        if (design.snapToGrid) {
          const node = e.target;
          const gridSize = design.gridSize || 20;
          const newX = Math.round(node.x() / gridSize) * gridSize;
          const newY = Math.round(node.y() / gridSize) * gridSize;
          node.position({ x: newX, y: newY });
          onDrag(newX - cx, newY - cy, 'center');
        } else {
          onDrag(e.target.x() - cx, e.target.y() - cy, 'center');
        }
      }}
      onTransformEnd={(e: any) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const rotation = node.rotation();
        onDrag(node.x() - cx, node.y() - cy, 'center', scaleX, rotation);
        node.scaleX(1);
        node.scaleY(1);
      }}
      onMouseEnter={(e: any) => { if (showControls) e.target.getStage().container().style.cursor = 'grab'; }}
      onMouseLeave={(e: any) => { e.target.getStage().container().style.cursor = 'default'; }}
    >
      <Image 
        image={logo} 
        x={(logoOffset || 0)} y={0}
        width={targetW} height={targetH}
        offsetX={targetW / 2} offsetY={targetH / 2}
        rotation={logoRotation || 0}
      />
      {showControls && (
        <Group x={logoOffset + targetW/2 + 10} y={-targetH/2}>
          <Circle radius={7} fill="#ef4444" onClick={onRemove} cursor="pointer" />
          <Text text="✕" x={-3.5} y={-4} fontSize={8} fill="#fff" fontStyle="bold" listening={false} />
        </Group>
      )}
    </Group>
  );
}

// ─── Hardware Components (Swivel, Plastic, Crocodile, Ski Reel, Side Release) ───
function SwivelHook({ x, y, strapW }: any) {
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fillLinearGradientStartPoint={{x:-strapW/2,y:0}} fillLinearGradientEndPoint={{x:strapW/2,y:0}} fillLinearGradientColorStops={[0,'#b0b5be',0.5,'#e8eaed',1,'#9ca3af']} stroke="#6b7280" strokeWidth={0.5} />
      <Line points={[-(strapW/2+3),0, strapW/2+3,0, strapW/2+9,9, strapW/2+6,20, -(strapW/2+6),20, -(strapW/2+9),9]} closed fillLinearGradientStartPoint={{x:-20,y:0}} fillLinearGradientEndPoint={{x:20,y:20}} fillLinearGradientColorStops={[0,'#d1d5db',0.45,'#f3f4f6',1,'#9ca3af']} stroke="#6b7280" strokeWidth={1.2} tension={0.15} />
      <Rect x={-5} y={20} width={10} height={16} fillLinearGradientStartPoint={{x:-5,y:0}} fillLinearGradientEndPoint={{x:5,y:0}} fillLinearGradientColorStops={[0,'#9ca3af',0.5,'#e5e7eb',1,'#9ca3af']} stroke="#6b7280" strokeWidth={1} cornerRadius={3} />
      <Group y={36}>
        <Line points={[-11,0, 11,0, 16,13, 16,40, 0,53, -16,40, -16,13]} closed fillLinearGradientStartPoint={{x:-16,y:0}} fillLinearGradientEndPoint={{x:16,y:53}} fillLinearGradientColorStops={[0,'#d1d5db',0.4,'#f3f4f6',1,'#9ca3af']} stroke="#6b7280" strokeWidth={1.2} tension={0.35} />
        <Line points={[-9,13,-9,36,0,46]} stroke="#555" strokeWidth={2.5} lineCap="round" />
        <Circle x={11} y={27} radius={2.8} fillLinearGradientStartPoint={{x:-3,y:-3}} fillLinearGradientEndPoint={{x:3,y:3}} fillLinearGradientColorStops={[0,'#9ca3af',1,'#374151']} stroke="#374151" strokeWidth={0.5} />
      </Group>
    </Group>
  );
}
function PlasticHook({ x, y, strapW }: any) {
  const hw = strapW / 2 + 3;
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fill="#222" stroke="#111" strokeWidth={0.5} />
      <Line points={[-hw,0, hw,0, hw+6,9, hw+3,22, -hw-3,22, -hw-6,9]} closed fill="#2d2d2d" stroke="#111" strokeWidth={1.5} tension={0.2} />
      <Rect x={-6} y={18} width={12} height={18} fill="#2d2d2d" stroke="#111" strokeWidth={1.5} cornerRadius={3} />
      <Group y={36}><Line points={[-14,0, 14,0, 20,20, 20,45, 0,60, -20,45, -20,15, -12,15, -12,40, 0,50, 10,40, 10,20, 0,0]} closed fill="#2d2d2d" stroke="#111" strokeWidth={1.5} tension={0.4} /></Group>
    </Group>
  );
}
function CrocodileClip({ x, y, strapW }: any) {
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fillLinearGradientStartPoint={{x:-strapW/2,y:0}} fillLinearGradientEndPoint={{x:strapW/2,y:0}} fillLinearGradientColorStops={[0,'#9ea3af',0.5,'#f3f4f6',1,'#9ea3af']} stroke="#6b7280" strokeWidth={0.5} />
      <Circle x={0} y={10} radius={6} stroke="#4b5563" strokeWidth={2.5} />
      <Circle x={0} y={10} radius={3.5} fill="#fff" stroke="#9ca3af" strokeWidth={0.5} />
      <Group y={16}>
        <Rect x={-12} y={0} width={24} height={42} fillLinearGradientStartPoint={{x:-12,y:0}} fillLinearGradientEndPoint={{x:12,y:42}} fillLinearGradientColorStops={[0,'#d1d5db',0.4,'#fdfdfd',1,'#9ca3af']} stroke="#4b5563" strokeWidth={1.2} cornerRadius={2} />
        {[8, 14, 20, 26, 32].map((gap, i) => (<Line key={i} points={[-8, gap, 8, gap]} stroke="#9ca3af" strokeWidth={0.8} opacity={0.6} />))}
        <Circle x={0} y={34} radius={1.8} fill="#4b5563" />
      </Group>
    </Group>
  );
}
function SkiReel({ x, y, strapW }: any) {
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fill="#222" stroke="#000" strokeWidth={0.5} />
      <Group y={34}>
        <Circle radius={24} fillLinearGradientStartPoint={{x:-24,y:-24}} fillLinearGradientEndPoint={{x:24,y:24}} fillLinearGradientColorStops={[0,'#374151',0.5,'#111827',1,'#000']} stroke="#000" strokeWidth={1.5} shadowBlur={6} shadowColor="rgba(0,0,0,0.4)" shadowOffset={{x:2,y:3}} />
        <Circle radius={21} stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} listening={false} />
        <Circle radius={16} fill="#000" opacity={0.3} />
        <Rect x={-3} y={-18} width={6} height={16} fill="#6b7280" cornerRadius={1} opacity={0.7} />
        <Group y={24}><Line points={[0, 0, 0, 20]} stroke="#333" strokeWidth={1.5} /><Group y={20}><Rect x={-8} y={0} width={16} height={22} fill="rgba(255,255,255,0.85)" stroke="#ccc" strokeWidth={0.5} cornerRadius={3} /><Circle x={0} y={11} radius={4} fillLinearGradientStartPoint={{x:-4,y:-4}} fillLinearGradientEndPoint={{x:4,y:4}} fillLinearGradientColorStops={[0,'#f3f4f6',1,'#9ca3af']} stroke="#4b5563" strokeWidth={0.8} /><Rect x={-5} y={22} width={10} height={12} fill="#9ca3af" cornerRadius={1} /></Group></Group>
      </Group>
    </Group>
  );
}
function SideReleaseBuckle({ x, y, strapW, strapColor }: any) {
  const hw = Math.max(24, strapW * 0.95);
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-5} width={strapW} height={10} fill={strapColor} stroke="#00000022" strokeWidth={0.6} />
      <Line points={[-hw,0, hw,0, hw+6,9, hw+6,40, hw,48, -hw,48, -hw-6,40, -hw-6,9]} closed fillLinearGradientStartPoint={{x:-hw,y:0}} fillLinearGradientEndPoint={{x:hw,y:48}} fillLinearGradientColorStops={[0,'#555',0.4,'#888',1,'#333']} stroke="#222" strokeWidth={1} lineCap="round" lineJoin="round" />
      <Rect x={-strapW/2+3} y={9} width={strapW-6} height={30} fill="#222" stroke="#111" strokeWidth={0.6} cornerRadius={2} />
      <Group y={58}><Circle radius={20} fillLinearGradientStartPoint={{x:-20,y:-20}} fillLinearGradientEndPoint={{x:20,y:20}} fillLinearGradientColorStops={[0,'#e5e7eb',0.5,'#fff',1,'#d1d5db']} stroke="#888" strokeWidth={4} /></Group>
    </Group>
  );
}
function MetalCrimp({ x, y, strapW }: any) {
  const w = strapW + 10, h = 30;
  return (
    <Group x={x} y={y}>
      <Rect x={-w/2} y={0} width={w} height={h} fillLinearGradientStartPoint={{x:-w/2, y:0}} fillLinearGradientEndPoint={{x:w/2, y:0}} fillLinearGradientColorStops={[0,'#9ca3af', 0.15, '#e5e7eb', 0.5, '#ffffff', 0.85, '#e5e7eb', 1, '#9ca3af']} stroke="#4b5563" strokeWidth={0.8} cornerRadius={1.5} />
      <Line points={[-w/2+2, 6, w/2-2, 6]} stroke="rgba(0,0,0,0.12)" strokeWidth={0.6} />
      <Line points={[-w/2+2, 24, w/2-2, 24]} stroke="rgba(0,0,0,0.12)" strokeWidth={0.6} />
    </Group>
  );
}

// ─── Production proof panel ──────────────────────────────────────────────────
function FlatStrap({ x, y, w, h, color, pattern, patternOpacity, children }: any) {
  const bc = baseColor(color);
  const sh = shadeHex(bc, -55);
  return (
    <Group x={x} y={y}>
      <Rect width={w} height={h} stroke={sh} strokeWidth={0.8} {...gradFill(color, { x: 0, y: 0 }, { x: w, y: 0 })} />
      <StrapPatternRenderer clipPoints={[0,0,w,0,w,h,0,h]} pattern={pattern} strapW={w} opacity={patternOpacity} />
      {children}
    </Group>
  );
}

function DimLine({ x1, y1, x2, y2, label }: any) {
  const isVert = x1 === x2;
  return (
    <Group opacity={0.55}>
      <Line points={[x1, y1, x2, y2]} stroke="#888" strokeWidth={0.8} dash={[4, 4]} />
      {isVert ? (<><Line points={[x1-5, y1, x1+5, y1]} stroke="#888" strokeWidth={0.8} /><Line points={[x1-5, y2, x1+5, y2]} stroke="#888" strokeWidth={0.8} /><Text text={label} x={x1-38} y={(y1+y2)/2 - 6} fontSize={10} fill="#666" align="right" width={30} /></>) : (<><Line points={[x1, y1-5, x1, y1+5]} stroke="#888" strokeWidth={0.8} /><Line points={[x2, y1-5, x2, y1+5]} stroke="#888" strokeWidth={0.8} /><Text text={label} x={(x1+x2)/2 - 15} y={y1-16} fontSize={10} fill="#666" align="center" width={30} /></>)}
    </Group>
  );
}

// ─── INDEPENDENT Content with Independent Drills ──────────────────────────
function UnifiedStrapContent({ x1, y1, x2, y2, design, logoImg, strapW, forceNoLogo, forceNoText, onUpdateText, onUpdateLogo, onRemoveText, onRemoveLogo, showControls, zone }: any) {
  const { lanyardDesignStyle, customText, customTextSecondary, predefinedWord, fontColor, fontFamily, fontSize, textSpacing, logoScale, logoRotation, textOffset, logoOffset, copyMode, customTextLeft, customTextCenter, customTextRight } = design;
  
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const mainText = lanyardDesignStyle === 'predefined' ? predefinedWord : (forceNoText ? '' : (copyMode === 'synchronized' ? customTextCenter : (zone === 'left' ? customTextLeft : (zone === 'right' ? customTextRight : customTextCenter))));
  const subText = lanyardDesignStyle === 'stacked-text' ? customTextSecondary : null;

  if (!mainText && !logoImg) return null;

  const fs = Math.min(fontSize, Math.max(6, strapW * 0.7));
  const hasLogo = logoImg && (lanyardDesignStyle === 'repeated' || (lanyardDesignStyle === 'central-logo' && forceNoLogo === false)) && !forceNoLogo;
  const hasSubText = subText && lanyardDesignStyle === 'stacked-text';

  const tOffset = copyMode === 'synchronized' ? (textOffset || 0) : (zone === 'left' ? (design.textOffsetLeft || 0) : (zone === 'right' ? (design.textOffsetRight || 0) : (design.textOffsetCenter || 0)));
  const lOffset = copyMode === 'synchronized' ? (logoOffset || 0) : (zone === 'left' ? (design.logoOffsetLeft || 0) : (zone === 'right' ? (design.logoOffsetRight || 0) : (design.logoOffsetCenter || 0)));

  const textW = mainText ? mainText.length * fs * 0.55 : 0;
  const lgW = hasLogo ? (strapW * 0.8 * (logoImg.width / logoImg.height) * logoScale) : 0;
  
  const gap = Math.max(30, (textSpacing || 60) * 2 + textW + lgW);
  const count = Math.max(0, Math.floor(dist / gap));
  if (count === 0 && !hasLogo) return null;

  const items = [];
  for (let i = 0; i < count; i++) {
    const baseT = (gap * i) / dist;
    const textT = baseT + (tOffset) / dist;
    const logoT = baseT + (lOffset) / dist + (textW + 15) / dist;

    if (zone === 'center') {
       if (textT >= 0 && textT <= 1) {
         if (mainText) items.push({ type: 'text', t: textT, i });
       }
       if (logoT >= 0 && logoT <= 1) {
         if (hasLogo) items.push({ type: 'logo', t: logoT, i });
       }
    } else {
      if (mainText) items.push({ type: 'text', t: textT, i });
      if (hasLogo) items.push({ type: 'logo', t: logoT, i });
    }
  }

  return (
    <Group>
      {items.map((item, idx) => {
        const px = x1 + dx * item.t, py = y1 + dy * item.t;
        if (item.t < -0.1 || item.t > 1.1) return null;

        if (item.type === 'text') {
          const totalHeight = hasSubText ? fs + fs * 0.55 : fs;
              return (
                <Group
                  key={`${item.type}-${item.i}`}
                  x={px}
                  y={py}
                  rotation={angle}
                  draggable={showControls}
                  onDragEnd={(e: any) => {
                    if (design.snapToGrid) {
                      const node = e.target;
                      const newX = Math.round(node.x() / (design.gridSize || 20)) * (design.gridSize || 20);
                      const newY = Math.round(node.y() / (design.gridSize || 20)) * (design.gridSize || 20);
                      node.position({ x: newX, y: newY });
                      onUpdateText(newX - px, newY - py, zone);
                    } else {
                      onUpdateText(e.target.x() - px, e.target.y() - py, zone);
                    }
                  }}
                  onTransformEnd={(e: any) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const rotation = node.rotation();
                    onUpdateText(node.x() - px, node.y() - py, zone, scaleX, rotation);
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                  onMouseEnter={(e: any) => {
                    if (showControls) e.target.getStage().container().style.cursor = 'grab';
                  }}
                  onMouseLeave={(e: any) => {
                    e.target.getStage().container().style.cursor = 'default';
                  }}
                >
                  <Text
                    text={mainText}
                    fontSize={fs}
                    fontFamily={fontFamily}
                    fontStyle="bold"
                    fill={fontColor}
                    align="center"
                    width={textW}
                    offsetX={textW / 2}
                    offsetY={totalHeight / 2}
                  />
                  {hasSubText && (
                    <Text
                      text={subText}
                      fontSize={fs * 0.55}
                      fontFamily={fontFamily}
                      fill={fontColor}
                      opacity={0.8}
                      align="center"
                      width={textW}
                      x={0}
                      y={fs * 0.8}
                      offsetX={textW / 2}
                      offsetY={totalHeight / 2}
                    />
                  )}
                  {showControls &&
                    item.i === 0 && (
                      <Group x={textW / 2 + 8} y={-fs / 2}>
                        <Circle radius={6} fill="#ef4444" onClick={() => onRemoveText(zone)} cursor="pointer" />
                        <Text
                          text="✕"
                          x={-3}
                          y={-3.5}
                          fontSize={7}
                          fill="#fff"
                          fontStyle="bold"
                          listening={false}
                        />
                      </Group>
                    )}
                </Group>
              );
            }

        return (
          <Group 
            key={`${item.type}-${item.i}`} x={px} y={py} rotation={angle}
            draggable={showControls} onDragMove={(e: any) => onUpdateLogo(e.target.x() - px, e.target.y() - py, zone)}
            onMouseEnter={(e: any) => { if (showControls) e.target.getStage().container().style.cursor = 'grab'; }}
            onMouseLeave={(e: any) => { e.target.getStage().container().style.cursor = 'default'; }}
          >
            <Image image={logoImg} width={lgW} height={strapW*0.8*logoScale} offsetY={(strapW*0.8*logoScale)/2} offsetX={lgW/2} rotation={logoRotation || 0} />
            {showControls && item.i === 0 && (
              <Group x={lgW/2 + 8} y={-(strapW*0.8*logoScale)/2}>
                 <Circle radius={6} fill="#ef4444" onClick={() => onRemoveLogo(zone)} cursor="pointer" />
                 <Text text="✕" x={-3} y={-3.5} fontSize={7} fill="#fff" fontStyle="bold" listening={false} />
              </Group>
            )}
          </Group>
        );
      })}
    </Group>
  );
}

export default function LanyardStage({ zoom = 1, stageRef, currentStep, showIdCard = false }: { zoom?: number; stageRef: any; currentStep: number; showIdCard?: boolean }) {
  const showControls = currentStep === 2;
  const design = useConfiguratorStore((s) => (s as any).design);
  const setField = useConfiguratorStore((s) => (s as any).setField);
  const [containerRef, containerWidth] = useContainerWidth();
  const logoImg = useCanvasImage(design.logoUrl);
  const strapColor = design.lanyardColor || '#cc1111';
  const scale = Math.max(0.35, (Math.min(containerWidth - 32, BASE_WIDTH) / BASE_WIDTH) * zoom);
  const activePattern = getPatternById(design.strapPattern);
  const patternOpacity = design.strapPatternOpacity ?? 0.85;

  const strapW = useMemo(() => {
    const mmStr = design.width || '20mm';
    const mm = parseInt(mmStr.replace('mm', ''), 10);
    return Math.max(14, (mm / 20) * 36);
  }, [design.width]);
  
  const CX = 305, TOP_Y = 100, HALF_W = 190, TIP_Y = 615, LX = CX - HALF_W, RX = CX + HALF_W;
  const CRIMP_H = 32, CRIMP_Y = TIP_Y - 55;
  
  const idCardSize = design.idCard.size;
  const isHorizontal = idCardSize === '100x70';
  const cardW = isHorizontal ? 283 : (idCardSize === '70x100' ? 198 : 153);
  const cardH = isHorizontal ? 198 : (idCardSize === '70x100' ? 283 : 244);
  const cardScale = 0.7;
  const barPts = [LX + strapW, TOP_Y, RX - strapW, TOP_Y, RX - strapW, TOP_Y + strapW, LX + strapW, TOP_Y + strapW];
  const leftStrap = [LX, TOP_Y + strapW, LX + strapW, TOP_Y + strapW, CX+strapW/2, CRIMP_Y, CX-strapW/2, CRIMP_Y];
  const rightStrap = [RX, TOP_Y + strapW, CX+strapW/2, CRIMP_Y, CX-strapW/2, CRIMP_Y, RX-strapW, TOP_Y + strapW];
  const connectorPts = [CX-strapW/2, CRIMP_Y+CRIMP_H-2, CX+strapW/2, CRIMP_Y+CRIMP_H-2, CX+strapW/2, TIP_Y, CX-strapW/2, TIP_Y];

  const leftCL = { x1: LX + strapW * 0.5, y1: TOP_Y + strapW * 1.5, x2: CX - strapW * 0.3, y2: CRIMP_Y - 20 };
  const rightCL = { x1: RX - strapW * 0.5, y1: TOP_Y + strapW * 1.5, x2: CX + strapW * 0.3, y2: CRIMP_Y - 20 };

  const onUpdateText = (dx: number, dy: number, zone: string, scale?: number, rotation?: number) => {
    if (design.copyMode === 'synchronized') {
      setField('textOffset', (design.textOffset || 0) + dx);
    } else {
      const fieldPath = zone === 'left' ? 'textOffsetLeft' : (zone === 'right' ? 'textOffsetRight' : 'textOffsetCenter');
      setField(fieldPath, (design[fieldPath] || 0) + dx);
    }
    setField('fontSize', design.fontSize * (scale || 1));
    setField('textAngle', (design.textAngle || 0) + (rotation || 0));
  };
  const onUpdateLogo = (dx: number, dy: number, zone: string, scale?: number, rotation?: number) => {
    if (design.copyMode === 'synchronized') {
      setField('logoOffset', (design.logoOffset || 0) + dx);
    } else {
      const fieldPath = zone === 'left' ? 'logoOffsetLeft' : (zone === 'right' ? 'logoOffsetRight' : 'logoOffsetCenter');
      setField(fieldPath, (design[fieldPath] || 0) + dx);
    }
    setField('logoScale', design.logoScale * (scale || 1));
    setField('logoRotation', (design.logoRotation || 0) + (rotation || 0));
  };
  const onRemoveText = (zone: string) => {
    if (design.copyMode === 'synchronized') {
      setField('customTextLeft', '');
      setField('customTextCenter', '');
      setField('customTextRight', '');
    } else {
      const fieldPath = zone === 'left' ? 'customTextLeft' : (zone === 'right' ? 'customTextRight' : 'customTextCenter');
      setField(fieldPath, '');
    }
  };
  const onRemoveLogo = () => {
    setField('logoUrl', '');
  };

  const [selectedShape, setSelectedShape] = useState<any>(null);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes(selectedShape ? [selectedShape] : []);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedShape]);

  const onSelect = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedShape(null);
      return;
    }
    if (e.target.attrs.draggable) {
      setSelectedShape(e.target);
    } else {
      setSelectedShape(null);
    }
  };

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden bg-white">
      <Stage ref={stageRef} width={BASE_WIDTH * scale} height={BASE_HEIGHT * scale} scaleX={scale} scaleY={scale} onClick={onSelect}>
        <Layer ref={layerRef}>
          {design.showGrid && (
            <Group>
              {
                Array.from(Array(Math.floor(BASE_WIDTH / design.gridSize)).keys()).map((i) => (
                  <Line
                    key={`v-${i}`}
                    points={[i * design.gridSize, 0, i * design.gridSize, BASE_HEIGHT]}
                    stroke="#e0e0e0"
                    strokeWidth={0.5}
                  />
                ))
              }
              {
                Array.from(Array(Math.floor(BASE_HEIGHT / design.gridSize)).keys()).map((i) => (
                  <Line
                    key={`h-${i}`}
                    points={[0, i * design.gridSize, BASE_WIDTH, i * design.gridSize]}
                    stroke="#e0e0e0"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Group>
          )}
          <Rect x={0} y={0} width={BASE_WIDTH} height={BASE_HEIGHT} fill="#ffffff" />
          <DimLine x1={LX - 25} y1={TOP_Y} x2={LX - 25} y2={TOP_Y + strapW} label={design.width || '20mm'} />
          <Group>
            <ProStrap points={rightStrap} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            <UnifiedStrapContent {...rightCL} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="right" />

            <ProStrap points={barPts} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            {design.lanyardDesignStyle === 'central-logo' ? (
              <StaticLogo cx={CX} cy={TOP_Y + strapW/2} angle={0} logo={logoImg} strapW={strapW} logoScale={design.logoScale} logoOffset={design.copyMode === 'synchronized' ? design.logoOffset : design.logoOffsetCenter} logoRotation={design.logoRotation} onRemove={onRemoveLogo} onDrag={onUpdateLogo} showControls={showControls} design={design} />
            ) : (
              <UnifiedStrapContent x1={LX+strapW+10} y1={TOP_Y+strapW/2} x2={RX-strapW-10} y2={TOP_Y+strapW/2} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="center" />
            )}

            <ProStrap points={leftStrap} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            <UnifiedStrapContent {...leftCL} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="left" />

            <CornerFold side="left" ox={LX} oy={TOP_Y} strapW={strapW} color={strapColor} />
            <CornerFold side="right" ox={RX} oy={TOP_Y} strapW={strapW} color={strapColor} />
            <ProStrap points={connectorPts} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            <MetalCrimp x={CX} y={CRIMP_Y} strapW={strapW} />

            {(() => {
              const props = { x: CX, y: TIP_Y, strapW };
              switch (design.clipType) {
                case 'Plastic Hook': return <PlasticHook {...props} />;
                case 'Crocodile Clip': return <CrocodileClip {...props} />;
                case 'Ski Reel': return <SkiReel {...props} />;
                default: return <SwivelHook {...props} />;
              }
            })()}
            {design.accessories?.includes('Quick Release Buckle') && <SideReleaseBuckle x={CX} y={TIP_Y - 90} strapW={strapW} strapColor={strapColor} />}
            
            {showIdCard && (
              <Group 
                x={CX} 
                y={TIP_Y + 20} 
                scaleX={cardScale} 
                scaleY={cardScale} 
                offsetX={cardW / 2}
              >
                <Rect 
                  x={cardW / 2 - 15} 
                  y={5} 
                  width={30} 
                  height={10} 
                  cornerRadius={5} 
                  fill="#f3f4f6" 
                  stroke="#eef2f6" 
                  strokeWidth={1} 
                />
                <IdCardPreview isReviewStep={true} forceSide="front" />
              </Group>
            )}
          </Group>

          <Group x={656} y={62}>
            <Text text="PRODUCTION FLAT LAYOUT" y={-22} fontSize={7.5} fontStyle="bold" fill="#bbb" fontFamily="Arial" letterSpacing={1.2} />
            <FlatStrap x={0} y={0} w={strapW} h={620} color={strapColor} pattern={activePattern} patternOpacity={patternOpacity}>
               <UnifiedStrapContent x1={strapW/2} y1={40} x2={strapW/2} y2={580} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={false} zone="left" />
            </FlatStrap>
            <FlatStrap x={strapW+16} y={0} w={strapW} h={620} color={strapColor} pattern={activePattern} patternOpacity={patternOpacity}>
               <UnifiedStrapContent x1={strapW/2} y1={580} x2={strapW/2} y2={40} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={false} zone="right" />
            </FlatStrap>
          </Group>

          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
