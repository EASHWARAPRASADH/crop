import { createPortal } from 'react-dom';
import {
  Expand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  X,
  CreditCard,
  LayoutTemplate,
  Move,
  MousePointer2,
  Database,
  Eye,
} from 'lucide-react';

import { useEffect, useState, useRef } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import IdCardPreview from './IdCardPreview';
import { Group, Layer, Stage } from 'react-konva';

interface PreviewPanelProps {
  stageRef: React.RefObject<any>;
  idCardStageRef: React.RefObject<any>;
  zoom: number;
  setZoom: (zoom: number) => void;
  currentStep: number;
}

export default function PreviewPanel({ stageRef, idCardStageRef, zoom, setZoom, currentStep }: PreviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  
  const design = useConfiguratorStore((s: any) => s.design);
  const { size } = design.idCard;

  const isHorizontal = size === '100x70';
  const cardW = isHorizontal ? 283 : (size === '70x100' ? 198 : 153);
  const cardH = isHorizontal ? 198 : (size === '70x100' ? 283 : 244);
  const baseCardW = cardW;
  const baseCardH = cardH;

  // Expanded View zoom and pan
  const [fullZoom, setFullZoom] = useState(1);
  const [fullPan, setFullPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const handleFullWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleBy = 1.05;
    const newZoom = e.deltaY > 0 ? fullZoom / scaleBy : fullZoom * scaleBy;
    setFullZoom(Math.min(Math.max(0.2, newZoom), 5));
  };

  const handleFullPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      px: fullPan.x,
      py: fullPan.y,
    };
  };

  const handleFullPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setFullPan({
      x: dragStartInfo.current.px + (e.clientX - dragStartInfo.current.x),
      y: dragStartInfo.current.py + (e.clientY - dragStartInfo.current.y),
    });
  };

  const handleFullPointerUp = () => {
    setIsDragging(false);
  };

  const undo = useConfiguratorStore((state: any) => state.undo);
  const redo = useConfiguratorStore((state: any) => state.redo);
  const canUndo = useConfiguratorStore((state: any) => state.past.length > 0);
  const canRedo = useConfiguratorStore((state: any) => state.future.length > 0);

  const isMappingStep = currentStep === 1;
  const isConfirmationStep = currentStep === 2;
  const isFinalReviewStep = currentStep === 4;
  const isIdCardStep = currentStep >= 0 && currentStep <= 4;
  const idCardState = useConfiguratorStore((state: any) => state.design.idCard);

  // Editing functionality
  const [editingText, setEditingText] = useState<any>(null);
  const [activeImageUpload, setActiveImageUpload] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mappingPopover, setMappingPopover] = useState<{ id: string; side: string; x: number; y: number } | null>(null);
  const COLUMNS = ['ID', 'Full Name', 'Email', 'Department', 'Job Title', 'Photo URL'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImageUpload) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const { id, sideName } = activeImageUpload;
      const side = sideName || (useConfiguratorStore.getState() as any).design.idCard.activeSide;
      const elements = (useConfiguratorStore.getState() as any).design.idCard[side].elements;
      const newElements = elements.map((el: any) => el.id === id ? { ...el, src: dataUrl } : el);
      (useConfiguratorStore.getState() as any).setField(`idCard.${side}.elements`, newElements);
      setActiveImageUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' || 
        (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        alert('SECURITY ALERT: This design environment is secured. Screenshots and downloads are disabled.');
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
        const { selected, activeSide } = (useConfiguratorStore.getState() as any).design.idCard;
        if (selected) {
          const elements = (useConfiguratorStore.getState() as any).design.idCard[activeSide].elements;
          (useConfiguratorStore.getState() as any).setField(`idCard.${activeSide}.elements`, elements.filter((el: any) => el.id !== selected));
          (useConfiguratorStore.getState() as any).setField('idCard.selected', null);
        }
      }
    };
    
    const handleFocus = () => setIsBlurred(false);
    const handleBlur = () => setIsBlurred(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const cardCount = idCardState.showBothSides ? 2 : 1;
  const gap = 40;
  
  const totalW = isHorizontal ? baseCardW : ((baseCardW * cardCount) + (gap * (cardCount - 1)));
  const totalH = (isHorizontal && idCardState.showBothSides) ? ((baseCardH * 2) + gap) : baseCardH;
  const cardScale = Math.min(Math.min(750 / totalW, 600 / totalH), 2.2); 
  
  const cx = (800 / zoom - totalW * cardScale) / 2;
  const cy = (700 / zoom - totalH * cardScale) / 2;

  useEffect(() => {
    if (!isMappingStep) setMappingPopover(null);
  }, [isMappingStep, currentStep]);

  return (
    <div className={`flex h-full flex-col ${isBlurred ? 'blur-md' : ''} transition-all duration-300 no-print`}>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
      
      <div 
        className={`h-[700px] w-full rounded-[32px] bg-[#ffffff] relative overflow-hidden shrink-0 border border-[#eef2f6] shadow-sm select-none ${isMappingStep ? 'ring-2 ring-transparent transition-all' : ''}`}
        onDragOver={(e) => {
          if (!isMappingStep) return;
          e.preventDefault();
          e.currentTarget.classList.add('ring-blue-400', 'bg-blue-50/10');
        }}
        onDragLeave={(e) => {
          if (!isMappingStep) return;
          e.currentTarget.classList.remove('ring-blue-400', 'bg-blue-50/10');
        }}
        onDrop={(e) => {
          if (!isMappingStep) return;
          e.preventDefault();
          e.currentTarget.classList.remove('ring-blue-400', 'bg-blue-50/10');
          const colName = e.dataTransfer.getData('text/plain');
          if (!colName || !idCardStageRef.current) return;
          
          idCardStageRef.current.setPointersPositions(e);
          const pos = idCardStageRef.current.getPointerPosition();
          if (pos) {
            const shape = idCardStageRef.current.getIntersection(pos);
            if (shape && shape.id()) {
               const hitId = shape.id();
               const allEls = [...design.idCard.front.elements, ...design.idCard.back.elements];
               if (allEls.find((el:any) => el.id === hitId)) {
                   // Valid drop!
                   const newMapping = { ...design.idCard.bulkWorkflow.mapping, [hitId]: colName };
                   
                   // Auto-map the rest if this is the first item mapped manually
                   if (Object.keys(design.idCard.bulkWorkflow.mapping).length === 0) {
                      const columns = design.idCard.bulkWorkflow.datasetColumns;
                      allEls.forEach(el => {
                         if (el.id !== hitId) {
                            if(el.type === 'text') {
                               const match = columns.find((c: string) => c.toLowerCase().includes(el.content.toLowerCase().split(' ')[0]) || el.content.toLowerCase().includes(c.toLowerCase()));
                               if(match) newMapping[el.id] = match;
                            } else if(el.type === 'image') {
                               const match = columns.find((c: string) => c.toLowerCase().includes('photo') || c.toLowerCase().includes('image') || c.toLowerCase().includes('pic'));
                               if(match) newMapping[el.id] = match;
                            }
                         }
                      });
                   }
                   
                   (useConfiguratorStore.getState() as any).setField('idCard.bulkWorkflow.mapping', newMapping);
               }
            }
          }
        }}
      >
        <div className={`absolute inset-0 flex items-center justify-center z-0 transition-all duration-500 ${isBlurred ? 'blur-sm grayscale opacity-50' : ''}`}>
          <div className="relative z-10" style={{ width: 800, height: 700 }}>
            <div className="absolute inset-0 z-40 bg-transparent pointer-events-none" onContextMenu={(e) => e.preventDefault()} />
            <Stage width={800} height={700} scaleX={zoom} scaleY={zoom} ref={idCardStageRef}>
              <Layer>
                <Group x={cx} y={cy} scaleX={cardScale} scaleY={cardScale}>
                  <IdCardPreview 
                    isReviewStep={currentStep > 0}
                    isMappingStep={isMappingStep}
                    record={isMappingStep || isConfirmationStep || isFinalReviewStep ? (idCardState.bulkWorkflow.datasetRecords?.[idCardState.bulkWorkflow.sampleRecordIndex || 0] || null) : null}
                    mapping={isMappingStep || isConfirmationStep || isFinalReviewStep ? idCardState.bulkWorkflow.mapping : undefined}
                    onMappingClick={(id, side, e) => {
                      const stage = e.target.getStage();
                      const pointer = stage.getPointerPosition();
                      setMappingPopover({ id, side, x: pointer.x, y: pointer.y });
                    }}
                    onSelectElement={(id: string, sideName: string) => {
                      if (isMappingStep) return; 
                      (useConfiguratorStore.getState() as any).setField('idCard.selected', id);
                      if (sideName) (useConfiguratorStore.getState() as any).setField('idCard.activeSide', sideName);
                    }}  
                    onUpdateElement={(id: string, pos: any, sideName: string) => {
                      const side = sideName || idCardState.activeSide;
                      const elements = idCardState[side].elements;
                      (useConfiguratorStore.getState() as any).setField(`idCard.${side}.elements`, elements.map((el: any) => el.id === id ? { ...el, ...pos } : el));
                    }} 
                    onDblClickElement={(id: string, sideName: string, e: any) => {
                      if (currentStep > 0) return;
                      const side = sideName || idCardState.activeSide;
                      const el = idCardState[side].elements.find((el: any) => el.id === id);
                      if (!el) return;
                      if (el.type === 'text') {
                        const node = e.target;
                        const textPosition = node.absolutePosition();
                        const scaleY = node.getAbsoluteScale().y;
                        setEditingText({
                          id, side, value: el.content, fontStyle: el.fontStyle, color: el.fill, align: el.align || 'left',
                          fontSize: (el.fontSize || 12) * scaleY, x: textPosition.x, y: textPosition.y,
                          width: node.width() * node.getAbsoluteScale().x + 10, height: node.height() * scaleY + 10,
                        });
                      } else if (el.type === 'image') {
                        setActiveImageUpload({ id, sideName: side });
                        if (fileInputRef.current) fileInputRef.current.click();
                      }
                    }}
                  />
                </Group>
              </Layer>
            </Stage>
            {editingText && (
              <textarea
                value={editingText.value}
                onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                onBlur={() => {
                  const elements = idCardState[editingText.side].elements;
                  (useConfiguratorStore.getState() as any).setField(`idCard.${editingText.side}.elements`, elements.map((el: any) => el.id === editingText.id ? { ...el, content: editingText.value } : el));
                  setEditingText(null);
                }}
                autoFocus
                style={{
                  position: 'absolute', top: editingText.y, left: editingText.x, width: editingText.width, height: editingText.height,
                  fontSize: editingText.fontSize, fontFamily: 'sans-serif', fontWeight: editingText.fontStyle?.includes('bold') ? 'bold' : 'normal',
                  color: editingText.color, background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #5d5fef', zIndex: 100,
                }}
              />
            )}

            {mappingPopover && (
              <div 
                className="absolute bg-white rounded-2xl shadow-2xl border border-blue-100 p-3 z-[200] w-56 animate-in fade-in zoom-in duration-200"
                style={{ top: mappingPopover.y + 10, left: mappingPopover.x + 10 }}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <Database size={10} /> Map Element
                  </span>
                  <button onClick={() => setMappingPopover(null)} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
                </div>
                <div className="space-y-1">
                  {COLUMNS.map(col => (
                    <button 
                      key={col}
                      onClick={() => {
                        const newMapping = { ...design.idCard.bulkWorkflow.mapping, [mappingPopover.id]: col };
                        (useConfiguratorStore.getState() as any).setField('idCard.bulkWorkflow.mapping', newMapping);
                        setMappingPopover(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold transition-all ${design.idCard.bulkWorkflow.mapping[mappingPopover.id] === col ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                      {col}
                    </button>
                  ))}
                  <button 
                      onClick={() => {
                        const newMapping = { ...design.idCard.bulkWorkflow.mapping };
                        delete newMapping[mappingPopover.id];
                        (useConfiguratorStore.getState() as any).setField('idCard.bulkWorkflow.mapping', newMapping);
                        setMappingPopover(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-1"
                  >
                    Remove Mapping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 z-50 pointer-events-none">
          {!isExpanded && (
            <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
              <div className="flex items-center bg-white/90 backdrop-blur-sm border border-[#eef2f6] rounded-[14px] p-1 shadow-md">
                <button type="button" onClick={undo} disabled={!canUndo} className="p-1.5 rounded-[10px] text-[#1a1a1a] hover:bg-[#5d5fef] hover:text-white disabled:opacity-30 transition-all"><Undo2 size={14} /></button>
                <button type="button" onClick={redo} disabled={!canRedo} className="p-1.5 rounded-[10px] text-[#1a1a1a] hover:bg-[#5d5fef] hover:text-white disabled:opacity-30 transition-all"><Redo2 size={14} /></button>
                <div className="w-[1px] h-4 bg-[#eef2f6] mx-1" />
                <div className="flex items-center gap-2 px-2">
                  <ZoomIn size={14} className="text-[#5d5fef]" />
                  <input type="range" min="0.5" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-16 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#5d5fef]" />
                  <ZoomOut size={14} className="text-[#919191]" />
                </div>
              </div>
              <button type="button" onClick={() => setIsExpanded(true)} className="p-2 bg-[#5d5fef] text-white rounded-[12px] shadow-md hover:bg-[#4a4cd9] transition-all flex items-center justify-center"><Expand size={16} /></button>
            </div>
          )}
          
          {!isExpanded && (
            <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-[#eef2f6] rounded-full shadow-md text-[11px] font-bold text-[#1a1a1a] uppercase">
              <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              ID Card Proof
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: MousePointer2, label: 'Technical Accuracy', sub: 'Production Ready' },
          { icon: Move, label: 'Real-time Sync', sub: 'Instant updates' },
          { icon: CreditCard, label: 'Secured Design', sub: 'Protected Proof', onClick: () => alert('This design is secured.') },
        ].map((item: any, i) => (
          <div key={i} onClick={item.onClick} className="flex items-center gap-4 p-4 rounded-[24px] bg-[#f8faff] border border-[#eef2f6] hover:bg-white transition-all cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-[#5d5fef] shadow-sm"><item.icon size={18} /></div>
            <div><p className="text-[14px] font-bold text-[#1a1a1a]">{item.label}</p><p className="text-[12px] text-[#919191]">{item.sub}</p></div>
          </div>
        ))}
      </div>

      {isExpanded && createPortal(
        <div className={`fixed inset-0 z-[999999] flex items-center justify-center bg-[#0f172a] select-none p-4 ${isBlurred ? 'blur-2xl' : ''}`}>
          <div className="w-full h-full bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative border border-white/20">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-[100] shrink-0">
              <div className="flex flex-col"><h3 className="text-[20px] font-extrabold text-[#1a1a1a]">Production Proof Review</h3><p className="text-[13px] text-slate-500 font-medium">Technical verification · Scroll to Zoom, Drag to Pan</p></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                  <button onClick={() => setFullZoom(Math.max(0.2, fullZoom - 0.2))} className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl"><ZoomOut size={18} /></button>
                  <span className="text-[13px] font-bold text-slate-700 w-16 text-center">{Math.round(fullZoom * 100)}%</span>
                  <button onClick={() => setFullZoom(Math.min(5, fullZoom + 0.2))} className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl"><ZoomIn size={18} /></button>
                  <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
                  <button onClick={() => { setFullZoom(1); setFullPan({x:0, y:0}); }} className="px-4 py-2 text-[12px] font-bold text-slate-600 rounded-xl hover:bg-white transition-all">Reset</button>
                </div>
                <button onClick={() => setIsExpanded(false)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
              </div>
            </div>

            <div className="flex-1 relative bg-[#fafafa] overflow-hidden cursor-grab active:cursor-grabbing" onWheel={handleFullWheel} onPointerDown={handleFullPointerDown} onPointerMove={handleFullPointerMove} onPointerUp={handleFullPointerUp} onPointerLeave={handleFullPointerUp}>
              <div className="absolute inset-0 z-50 bg-transparent pointer-events-none" onContextMenu={(e) => e.preventDefault()} />
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out" style={{ transform: `translate(${fullPan.x}px, ${fullPan.y}px) scale(${fullZoom})` }}>
                <div className="flex items-center justify-center p-20 select-none">
                  <div className="bg-white rounded-[40px] border border-slate-100 p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                    <Stage width={800} height={800} scaleX={1} scaleY={1}>
                      <Layer>
                        <Group x={(800 - (totalW * cardScale)) / 2} y={(800 - (totalH * cardScale)) / 2} scaleX={cardScale} scaleY={cardScale}>
                          <IdCardPreview isReviewStep={true} onSelectElement={() => {}} onUpdateElement={() => {}} />
                        </Group>
                      </Layer>
                    </Stage>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
