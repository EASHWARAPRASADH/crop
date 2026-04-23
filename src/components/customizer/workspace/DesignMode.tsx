import React, { useState, useCallback, useEffect } from 'react';
import { useConfiguratorStore } from '../../../store/useConfiguratorStore';
import IdCardPreview from '../IdCardPreview';
import { Layers, Database, Type, Image as ImageIcon, QrCode, Barcode, ChevronRight, Maximize2, Move, Grid3x3, Columns, ImagePlus, ZoomIn, ZoomOut, RotateCcw, Minus, Pencil, Activity, PenTool } from 'lucide-react';
import { Stage, Layer, Group, Line } from 'react-konva';
import { getBatchImageKeys, hydrateBatchImageStore } from './SetupMode';
import { AVAILABLE_SHAPES, SHAPE_CATEGORIES, ShapeCategory } from '../../../data/shapes';
import FontBar from './FontBar';
import { Search as SearchIcon } from 'lucide-react';

export default function DesignMode({ stageRef, idCardStageRef, zoom, setZoom }: any) {
  const design = useConfiguratorStore(state => state.design);
  const setField = useConfiguratorStore(state => state.setField);
  const { mapping, datasetColumns } = design.idCard.bulkWorkflow;
  const activeSide = design.idCard.activeSide;
  const elements = design.idCard[activeSide].elements;

  const [activeTab, setActiveTab] = useState<'headers' | 'layers' | 'frames'>('headers');
  const [shapeSearch, setShapeSearch] = useState('');
  const [shapeCategory, setShapeCategory] = useState<ShapeCategory | 'All'>('All');

  // Hydrate batchImageStore from Zustand on mount (ensures photos survive mode transitions & HMR)
  useEffect(() => {
    const storeImgs = design.idCard.bulkWorkflow.datasetImages || {};
    const storeKeys = Object.keys(storeImgs);
    const batchKeys = getBatchImageKeys();
    if (storeKeys.length > 0 && batchKeys.length === 0) {
      hydrateBatchImageStore(storeImgs);
    }
  }, []);

  const [editingText, setEditingText] = useState<any>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const drawingTool = design.idCard.drawingTool || 'none';
  const isDrawingMode = drawingTool !== 'none';
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<number[]>([]);
  const [multiPointSegments, setMultiPointSegments] = useState<number[]>([]);

  const { width, height } = React.useMemo(() => {
    switch (design.idCard.size) {
      case '100x70': return { width: 283, height: 198 };
      case '70x100': return { width: 198, height: 283 };
      case '54x86': return { width: 153, height: 244 };
      default: return { width: 244, height: 153 }; // 86x54
    }
  }, [design.idCard.size]);

  const padding = 80;
  const stageWidth = 800;
  const stageHeight = 700;
  
  const baseScale = Math.min(
    (stageWidth - padding) / width,
    (stageHeight - padding) / height
  );
  const scale = baseScale * zoom;
  const cx = (stageWidth - width * scale) / 2;
  const cy = (stageHeight - height * scale) / 2;

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    setZoom(Math.min(Math.max(newZoom, 0.1), 5));
  }, [zoom, setZoom]);

  const resetView = useCallback(() => {
    setStagePos({ x: 0, y: 0 });
    setZoom(1);
  }, [setZoom]);

  const addFrame = (shapeType: string) => {
    const newId = `frame-${Date.now()}`;
    const newElement: any = {
      id: newId,
      type: 'frame',
      shapeType,
      x: Math.round(width / 2 - 40),
      y: Math.round(height / 2 - 40),
      width: 80,
      height: 80,
    };
    setField(`idCard.${activeSide}.elements`, [...elements, newElement]);
    setField('idCard.selected', newId);
  };

  const spawnElement = (columnName: string, type: 'text' | 'qr' | 'barcode' | 'image' | 'frame' = 'text') => {
    const newId = `field-${Date.now()}`;
    const textWidth = Math.round(width * 0.85);
    
    // Check if this column is the photo-matching column
    const isPhotoCol = columnName === design.idCard.bulkWorkflow.imageMatchColumn;
    
    const newElement: any = {
      id: newId,
      type: type,
      x: type === 'text' ? Math.round((width - textWidth) / 2) : Math.round(width / 2 - (type === 'image' ? 40 : 25)),
      y: type === 'image' ? Math.round(height * 0.15) : height / 2 - 10,
      content: columnName,
    };

    if (type === 'text') {
      newElement.width = textWidth;
      newElement.fontSize = design.idCard.defaultFontSize || 12;
      newElement.fontFamily = design.idCard.defaultFontFamily || 'Montserrat';
      newElement.fill = design.idCard.defaultColor || '#1e293b';
      newElement.align = 'center';
      
      const styleArr = [];
      if (design.idCard.defaultBold) styleArr.push('bold');
      if (design.idCard.defaultItalic) styleArr.push('italic');
      newElement.fontStyle = styleArr.join(' ') || 'normal';
    } else if (type === 'image') {
      // Larger default for photo elements so they're visible
      newElement.width = isPhotoCol ? 80 : 60;
      newElement.height = isPhotoCol ? 90 : 60;
      newElement.cornerRadius = isPhotoCol ? 6 : 0;
    } else if (type === 'qr') {
      newElement.width = 60;
      newElement.height = 60;
    } else if (type === 'barcode') {
      newElement.width = 100;
      newElement.height = 40;
    } else {
      newElement.width = 50;
      newElement.height = 50;
    }

    setField(`idCard.${activeSide}.elements`, [...elements, newElement]);
    setField(`idCard.bulkWorkflow.mapping`, { ...mapping, [newId]: columnName });
    setField('idCard.selected', newId);
  };

  const handleStaticImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newId = `img-static-${Date.now()}`;
      const newElement: any = {
        id: newId,
        type: 'image',
        x: width / 2 - 25,
        y: height / 2 - 25,
        width: 50,
        height: 50,
        src: event.target?.result as string,
      };
      setField(`idCard.${activeSide}.elements`, [...elements, newElement]);
      setField('idCard.selected', newId);
    };
    reader.readAsDataURL(file);
  };

  const addStaticText = () => {
    const newId = `text-static-${Date.now()}`;
    const textWidth = Math.round(width * 0.85);
    const newElement: any = {
      id: newId,
      type: 'text',
      x: Math.round((width - textWidth) / 2),
      y: height / 2 - 10,
      width: textWidth,
      content: 'Double click to edit',
      fontSize: design.idCard.defaultFontSize || 12,
      fontFamily: design.idCard.defaultFontFamily || 'Montserrat',
      fill: design.idCard.defaultColor || '#1e293b',
      align: 'center',
      fontStyle: (() => {
        const styleArr = [];
        if (design.idCard.defaultBold) styleArr.push('bold');
        if (design.idCard.defaultItalic) styleArr.push('italic');
        return styleArr.join(' ') || 'normal';
      })(),
    };
    setField(`idCard.${activeSide}.elements`, [...elements, newElement]);
    setField('idCard.selected', newId);
  };

  const finalizeLine = (points: number[]) => {
    // Deduplicate very close adjacent points to avoid redundant nodes
    const cleanedPoints: number[] = [];
    for (let i = 0; i < points.length; i += 2) {
      if (cleanedPoints.length >= 2) {
        const lastX = cleanedPoints[cleanedPoints.length - 2];
        const lastY = cleanedPoints[cleanedPoints.length - 1];
        if (Math.abs(points[i] - lastX) < 1 && Math.abs(points[i + 1] - lastY) < 1) {
          continue;
        }
      }
      cleanedPoints.push(points[i], points[i + 1]);
    }

    // Must have at least two distinct points
    if (cleanedPoints.length < 4) {
      setDrawingPoints([]);
      setMultiPointSegments([]);
      return;
    }

    // Normalize points: make x,y the top-left and shift all points
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < cleanedPoints.length; i += 2) {
      minX = Math.min(minX, cleanedPoints[i]);
      minY = Math.min(minY, cleanedPoints[i+1]);
      maxX = Math.max(maxX, cleanedPoints[i]);
      maxY = Math.max(maxY, cleanedPoints[i+1]);
    }

    const newId = `line-${Date.now()}`;
    const line: any = {
      id: newId,
      type: 'line',
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 0),
      height: Math.max(maxY - minY, 0),
      points: cleanedPoints.map((p: number, i: number) => i % 2 === 0 ? p - minX : p - minY),
      stroke: '#5d5fef',
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round',
      closed: drawingTool === 'custom_frame' || drawingTool === 'freeform_frame',
      tension: (drawingTool === 'freeform' || drawingTool === 'freeform_frame') ? 0.5 : 0,
    };
    
    setField(`idCard.${activeSide}.elements`, [...elements, line]);
    setField('idCard.selected', newId);
    setDrawingPoints([]);
    setMultiPointSegments([]);
  };

  const handleMouseDown = (e: any) => {
    if (!isDrawingMode) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const group = stage.findOne('#card-group');
    if (!group) return;
    const transform = group.getAbsoluteTransform().copy().invert();
    const relativePos = transform.point(pos);

    if (drawingTool === 'multipoint' || drawingTool === 'custom_frame') {
      setIsDrawing(true);
      setDrawingPoints(prev => [...prev, relativePos.x, relativePos.y]);
    } else if (drawingTool === 'freeform' || drawingTool === 'freeform_frame') {
      setIsDrawing(true);
      setDrawingPoints([relativePos.x, relativePos.y]);
    } else {
      setIsDrawing(true);
      setDrawingPoints([relativePos.x, relativePos.y, relativePos.x, relativePos.y]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawingMode || !isDrawing) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const group = stage.findOne('#card-group');
    if (!group) return;
    const transform = group.getAbsoluteTransform().copy().invert();
    const relativePos = transform.point(pos);

    if (drawingTool === 'straight') {
      // Automatic axis snapping for "straight" line
      let x = relativePos.x;
      let y = relativePos.y;
      const dx = Math.abs(x - drawingPoints[0]);
      const dy = Math.abs(y - drawingPoints[1]);
      if (dx > dy) y = drawingPoints[1];
      else x = drawingPoints[0];
      setDrawingPoints([drawingPoints[0], drawingPoints[1], x, y]);
    } else if (drawingTool === '2point') {
      // Free angle for "2point" line
      setDrawingPoints([drawingPoints[0], drawingPoints[1], relativePos.x, relativePos.y]);
    } else if (drawingTool === 'freeform' || drawingTool === 'freeform_frame') {
      setDrawingPoints(prev => [...prev, relativePos.x, relativePos.y]);
    } else if (drawingTool === 'multipoint' || drawingTool === 'custom_frame') {
      // preview segment for multipoint and custom_frame
      const pts = [...drawingPoints];
      if (pts.length >= 2) {
        setMultiPointSegments([pts[pts.length - 2], pts[pts.length - 1], relativePos.x, relativePos.y]);
      }
    }
  };

  const handleMouseUp = (e: any) => {
    if (!isDrawing) return;
    
    if (drawingTool === 'straight' || drawingTool === '2point' || drawingTool === 'freeform' || drawingTool === 'freeform_frame') {
      setIsDrawing(false);
      finalizeLine(drawingPoints);
      setField('idCard.drawingTool', 'none');
    }
  };

  // Keyboard support for finishing multi-point line
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((drawingTool === 'multipoint' || drawingTool === 'custom_frame') && isDrawing && e.key === 'Enter') {
        setIsDrawing(false);
        finalizeLine(drawingPoints);
        setMultiPointSegments([]);
        setField('idCard.drawingTool', 'none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingTool, isDrawing, drawingPoints]);

  const handleDblClick = () => {
    if ((drawingTool === 'multipoint' || drawingTool === 'custom_frame') && isDrawing) {
      setIsDrawing(false);
      finalizeLine(drawingPoints);
      setMultiPointSegments([]);
      setField('idCard.drawingTool', 'none');
    }
  };

  // Deep Fix: Cleanup drawing state when exiting mode
  useEffect(() => {
    if (drawingTool === 'none') {
      setIsDrawing(false);
      setDrawingPoints([]);
      setMultiPointSegments([]);
    }
  }, [drawingTool]);

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col z-10 shrink-0">
        <div className="flex px-4 py-3 border-b border-slate-100 gap-1">
          <button onClick={() => setActiveTab('headers')} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-all ${activeTab === 'headers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Headers</button>
          <button onClick={() => setActiveTab('frames')} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-all ${activeTab === 'frames' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Frames</button>
          <button onClick={() => setActiveTab('layers')} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-all ${activeTab === 'layers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Layers</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'headers' && (
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase text-slate-400 mb-2">Dataset Columns</div>
              {datasetColumns.map((col: string) => {
                const isMapped = Object.values(mapping).includes(col);
                return (
                  <div key={col} className={`p-3 rounded-xl border-2 transition-all group ${isMapped ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md cursor-pointer'}`}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-slate-700 truncate">{col}</span>
                       {isMapped && <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-100">Added</span>}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2">
                      <button onClick={() => spawnElement(col, 'text')} className="flex-1 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold flex flex-col items-center"><Type size={12}/> Text</button>
                      <button onClick={() => spawnElement(col, 'image')} className="flex-1 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold flex flex-col items-center"><ImageIcon size={12}/> Image</button>
                      <button onClick={() => spawnElement(col, 'qr')} className="flex-1 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold flex flex-col items-center"><QrCode size={12}/> QR</button>
                      <button onClick={() => spawnElement(col, 'barcode')} className="flex-1 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold flex flex-col items-center"><Barcode size={12}/> Bar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {activeTab === 'frames' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="space-y-4 shrink-0 px-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-black uppercase text-slate-400">Drawing Tools</div>
                  {isDrawingMode && (
                    <button 
                      onClick={() => setField('idCard.drawingTool', 'none')}
                      className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold hover:bg-red-100 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    { id: 'straight', label: 'Line', icon: Minus },
                    { id: '2point', label: 'Vector', icon: Maximize2 },
                    { id: 'multipoint', label: 'Multi', icon: Activity },
                    { id: 'freeform', label: 'Free', icon: Pencil },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setField('idCard.drawingTool', drawingTool === tool.id ? 'none' : tool.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${drawingTool === tool.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'}`}
                      title={tool.label}
                    >
                      <tool.icon size={16} />
                      <span className="text-[8px] font-bold mt-1 uppercase">{tool.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase text-slate-400">Custom Frame</div>
                  <button
                    onClick={() => setField('idCard.drawingTool', drawingTool === 'freeform_frame' ? 'none' : 'freeform_frame')}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all ${drawingTool === 'freeform_frame' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 shadow-sm'}`}
                  >
                    <PenTool size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">Draw Custom Mask</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search 500+ shapes..." 
                      value={shapeSearch}
                      onChange={(e) => setShapeSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                    <button 
                      onClick={() => setShapeCategory('All')}
                      className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${shapeCategory === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      All
                    </button>
                    {SHAPE_CATEGORIES.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setShapeCategory(cat)}
                        className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${shapeCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-4 gap-2 auto-rows-fr pb-10">
                  {AVAILABLE_SHAPES
                    .filter(s => {
                      const matchesSearch = s.name.toLowerCase().includes(shapeSearch.toLowerCase());
                      const matchesCategory = shapeCategory === 'All' || s.category === shapeCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((frame) => (
                      <button
                        key={frame.id}
                        onClick={() => {
                            setField('idCard.drawingTool', 'none');
                            addFrame(frame.id);
                        }}
                        className="flex flex-col items-center justify-center p-2 bg-white border border-slate-100 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group aspect-square active:scale-95"
                        title={frame.name}
                      >
                        <div className="w-full aspect-square flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                          <svg viewBox="0 0 100 100" className="w-full h-full p-1 fill-current overflow-visible">
                            <path d={frame.path} />
                          </svg>
                        </div>
                        <span className="text-[7px] font-black text-slate-400 group-hover:text-indigo-700 truncate w-full text-center mt-1 uppercase tracking-tighter">{frame.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-2">
               <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                 <button onClick={() => setField('idCard.activeSide', 'front')} className={`text-[11px] font-bold ${activeSide === 'front' ? 'text-indigo-600' : 'text-slate-400'}`}>FRTSIDE</button>
                 <button onClick={() => setField('idCard.activeSide', 'back')} className={`text-[11px] font-bold ${activeSide === 'back' ? 'text-indigo-600' : 'text-slate-400'}`}>BAKSIDE</button>
               </div>
               {[...elements].reverse().map((el, i) => {
                 const isSelected = design.idCard.selected === el.id;
                 let typeIcon = <ImageIcon size={14} className="text-slate-400"/>;
                 let typeLabel = mapping[el.id] || el.type;

                 if (el.type === 'text') {
                   typeIcon = <Type size={14} className="text-slate-400"/>;
                 } else if (el.type === 'qr') {
                   typeIcon = <QrCode size={14} className="text-slate-400"/>;
                 } else if (el.type === 'barcode') {
                   typeIcon = <Barcode size={14} className="text-slate-400"/>;
                 } else if (el.type === 'line') {
                   typeIcon = <Activity size={14} className="text-slate-400"/>;
                   typeLabel = el.closed ? "Custom Frame" : "Custom Line";
                 } else if (el.type === 'frame') {
                   typeIcon = <PenTool size={14} className="text-slate-400"/>;
                   typeLabel = `Frame (${el.shapeType || 'Custom'})`;
                 }

                 return (
                   <div 
                    key={el.id} 
                    onClick={() => setField('idCard.selected', el.id)} 
                    className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border ${isSelected ? 'border-indigo-400 bg-indigo-50/50' : 'border-transparent hover:bg-slate-50'}`}
                   >
                     <div className="flex items-center gap-2">
                       {typeIcon}
                       <span className="text-xs font-bold text-slate-700 truncate w-32 uppercase tracking-tighter">{typeLabel}</span>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace (Canvas) */}
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
        {/* Workspace formatting toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 shadow-sm p-1 rounded-xl">
          <button onClick={() => setField('idCard.size', '54x86')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${design.idCard.size === '54x86' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Portrait</button>
          <button onClick={() => setField('idCard.size', '86x54')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${design.idCard.size === '86x54' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Landscape</button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <FontBar />
        </div>

        {/* The zooming workspace area — freely draggable */}
        <div className="w-full h-full bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden border border-white/50 relative p-10 mt-10">
          <Stage
            width={stageWidth}
            height={stageHeight}
            ref={stageRef}
            draggable={!isDrawingMode}
            x={stagePos.x}
            y={stagePos.y}
            onDragEnd={(e) => {
              if (e.target === e.target.getStage()) {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDblClick={handleDblClick}
            style={{ cursor: isDrawingMode ? 'crosshair' : 'grab' }}
          >
            <Layer>
              <Group id="card-group" x={cx} y={cy} scaleX={scale} scaleY={scale}>
                <IdCardPreview 
                  isReviewStep={false}
                  record={design.idCard.bulkWorkflow.datasetRecords?.[design.idCard.bulkWorkflow.sampleRecordIndex || 0]}
                  mapping={mapping}
                  onSelectElement={(id, sideName) => {
                    setField('idCard.selected', id);
                    if (sideName) setField('idCard.activeSide', sideName);
                  }}
                  onUpdateElement={(id, pos, sideName) => {
                    const side = sideName || activeSide;
                    const els = design.idCard[side].elements;
                    const movedEl = els.find((e: any) => e.id === id);
                    
                    if (movedEl?.type === 'image' && (pos.x !== undefined || pos.y !== undefined)) {
                      const updatedEl = { ...movedEl, ...pos };
                      const centerX = updatedEl.x + (updatedEl.width || 0) / 2;
                      const centerY = updatedEl.y + (updatedEl.height || 0) / 2;
                      
                      const targetFrame = els.find((e: any) => 
                        (e.type === 'frame' || e.type === 'line') && 
                        centerX > e.x && centerX < e.x + (e.width ?? 100) &&
                        centerY > e.y && centerY < e.y + (e.height ?? 100)
                      );
                      
                      if (targetFrame) {
                        // Transfer src and mapping
                        const newEls = els.filter((e: any) => e.id !== id).map((e: any) => {
                          if (e.id === targetFrame.id) {
                            return { ...e, src: movedEl.src };
                          }
                          return e;
                        });
                        
                        // Transfer mapping if exists
                        const imgMapping = mapping[id];
                        if (imgMapping) {
                           const newMapping = { ...mapping };
                           delete newMapping[id];
                           newMapping[targetFrame.id] = imgMapping;
                           setField('idCard.bulkWorkflow.mapping', newMapping);
                        }
                        
                        setField(`idCard.${side}.elements`, newEls);
                        setField('idCard.selected', targetFrame.id);
                        return;
                      }
                    }
                    
                    setField(`idCard.${side}.elements`, els.map((e: any) => e.id === id ? { ...e, ...pos } : e));
                  }}
                onDblClickElement={(id: string, sideName: string, e: any) => {
                  const side = sideName || activeSide;
                  const el = design.idCard[side].elements.find((el: any) => el.id === id);
                  if (!el) return;
                  if (el.type === 'text') {
                    const node = e.target;
                    const textPosition = node.absolutePosition();
                    const absScaleY = node.getAbsoluteScale().y;
                    const absScaleX = node.getAbsoluteScale().x;
                    
                    // Convert Konva's absolute stage coords to Container coords
                    const stageBox = stageRef.current.container().getBoundingClientRect();

                    setEditingText({
                      id, side, value: el.content, fontStyle: el.fontStyle, color: el.fill, align: el.align || 'left',
                      fontFamily: el.fontFamily || 'sans-serif',
                      fontSize: (el.fontSize || 12) * absScaleY, 
                      x: stageBox.left + textPosition.x, 
                      y: stageBox.top + textPosition.y,
                      width: node.width() * absScaleX + 10, 
                      height: node.height() * absScaleY + 10,
                    });
                  }
                }}
              />
              {/* Drawing Preview */}
              {isDrawing && drawingPoints.length >= 2 && (
                <Line
                  points={drawingPoints}
                  stroke="#5d5fef"
                  strokeWidth={2}
                  tension={(drawingTool === 'freeform' || drawingTool === 'freeform_frame') ? 0.5 : 0}
                  lineCap="round"
                  lineJoin="round"
                  closed={drawingTool === 'custom_frame' || drawingTool === 'freeform_frame'} 
                  opacity={0.5}
                />
              )}
              {isDrawing && multiPointSegments.length === 4 && (
                <Line
                  points={multiPointSegments}
                  stroke="#5d5fef"
                  strokeWidth={2}
                  dash={[5, 5]}
                  opacity={0.5}
                />
              )}
              </Group>
            </Layer>
          </Stage>
          {editingText && (
            <textarea
              value={editingText.value}
              onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
              onBlur={() => {
                const els = design.idCard[editingText.side].elements;
                setField(`idCard.${editingText.side}.elements`, els.map((el: any) => el.id === editingText.id ? { ...el, content: editingText.value } : el));
                setEditingText(null);
              }}
              autoFocus
              style={{
                position: 'fixed',
                top: editingText.y, left: editingText.x, width: editingText.width, height: editingText.height,
                fontSize: editingText.fontSize, fontFamily: editingText.fontFamily || 'sans-serif', fontWeight: editingText.fontStyle?.includes('bold') ? 'bold' : 'normal',
                color: editingText.color, background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #5d5fef', zIndex: 100,
                outline: 'none', resize: 'none'
              }}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar Toolbar */}
      <div className="w-16 bg-white border-l border-slate-200 shadow-sm flex flex-col z-10 shrink-0 items-center py-4 space-y-4">
        {/* Toggle Grid */}
        <button 
          onClick={() => setField('idCard.showGrid', !design.idCard.showGrid)}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group ${design.idCard.showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
          title="Toggle Grid Lines"
        >
          <Grid3x3 size={20} />
          <span className="text-[9px] font-bold group-hover:block transition-all text-center leading-tight">Grid</span>
        </button>

        {/* Toggle Both Sides */}
        <button 
          onClick={() => setField('idCard.showBothSides', !design.idCard.showBothSides)}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group ${design.idCard.showBothSides ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
          title="Toggle Two-Side Printing View"
        >
          <Columns size={20} />
          <span className="text-[9px] font-bold group-hover:block transition-all text-center leading-tight">2-Side</span>
        </button>

        <div className="w-8 h-[1px] bg-slate-100 my-1"></div>

        {/* Upload Image */}
        <label className="p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer" title="Add Static Image">
          <input type="file" accept="image/*" className="hidden" onChange={handleStaticImageUpload} />
          <ImagePlus size={20} />
          <span className="text-[9px] font-bold group-hover:block transition-all text-center leading-tight">Image</span>
        </label>

        {/* Add Text */}
        <button 
          onClick={addStaticText}
          className="p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
          title="Add Static Text"
        >
          <Type size={20} />
          <span className="text-[9px] font-bold group-hover:block transition-all text-center leading-tight">Text</span>
        </button>

        <div className="w-8 h-[1px] bg-slate-100 my-1"></div>

        {/* Zoom Controls */}
        <button 
          onClick={() => setZoom(Math.min(zoom + 0.1, 5))}
          className="p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <span className="text-[10px] font-bold text-slate-500">{Math.round(zoom * 100)}%</span>
        <button 
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.1))}
          className="p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>

        <div className="w-8 h-[1px] bg-slate-100 my-1"></div>

        {/* Reset View */}
        <button 
          onClick={resetView}
          className="p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Reset View"
        >
          <RotateCcw size={20} />
          <span className="text-[9px] font-bold group-hover:block transition-all text-center leading-tight">Reset</span>
        </button>
      </div>

    </div>
  );
}
