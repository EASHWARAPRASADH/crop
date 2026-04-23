import React, { useState, useEffect } from 'react';
import { useConfiguratorStore } from '../../../store/useConfiguratorStore';
import { AlignLeft, AlignCenter, AlignRight, Bold, Trash2, X, Type, Image as ImageIcon } from 'lucide-react';
import { loadGoogleFont } from '../../../data/googleFonts';

export default function FloatingToolbar({ stageRef }: any) {
  const design = useConfiguratorStore(state => state.design);
  const setField = useConfiguratorStore(state => state.setField);
  const activeSide = design.idCard.activeSide;
  const selectedId = design.idCard.selected;
  const elements = design.idCard[activeSide].elements;
  const mapping = design.idCard.bulkWorkflow.mapping;
  const el = elements.find((e: any) => e.id === selectedId);
  
  // Local states for numeric inputs to allow "erasing fully and typing"
  const [fontSizeInput, setFontSizeInput] = useState("");
  const [widthInput, setWidthInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [strokeWidthInput, setStrokeWidthInput] = useState("");

  useEffect(() => {
    if (el) {
      setFontSizeInput((el.fontSize || 12).toString());
      setWidthInput((el.width || 100).toString());
      setSizeInput((el.width || 50).toString());
      setStrokeWidthInput((el.strokeWidth || 2).toString());
    }
  }, [selectedId, el?.id]);


  const [position, setPosition] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!selectedId || !stageRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      try {
        const stage = stageRef.current;
        const node = stage.findOne(`#${selectedId}`);
        if (node) {
          const rect = node.getClientRect();
          const stageBox = stage.container().getBoundingClientRect();
          // Position slightly above the element
          setPosition({
            x: stageBox.left + rect.x + (rect.width / 2),
            y: stageBox.top + rect.y - 70
          });
        }
      } catch(e) {
        // ignore
      }
    };

    updatePosition();
    // In a real deployment, we'd bind to drag events. For now, an interval is a cheap fallback
    // to keep the floating toolbar locked to the element during drag
    const interval = setInterval(updatePosition, 50);
    return () => clearInterval(interval);
  }, [selectedId, stageRef, el?.x, el?.y, el?.width, el?.height]);

  if (!el || !position) return null;

  const updateEl = (changes: any) => {
    setField(`idCard.${activeSide}.elements`, elements.map((e: any) => e.id === selectedId ? { ...e, ...changes } : e));
  };

  const deleteEl = () => {
    setField(`idCard.${activeSide}.elements`, elements.filter((e: any) => e.id !== selectedId));
    setField('idCard.selected', null);
    
    // Cleanup mapping
    const newMapping = { ...mapping };
    delete newMapping[selectedId];
    setField('idCard.bulkWorkflow.mapping', newMapping);
  };

  return (
    <div 
      className="fixed z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white p-2 animate-in zoom-in-95 duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
    >
      <div className="px-2 border-r border-slate-200">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">MAPPED TO</span>
        <span className="text-xs font-bold text-indigo-600 truncate max-w-[100px] block">{mapping[selectedId] || 'Manual'}</span>
      </div>

      {el.type === 'text' && (
        <div className="flex items-center gap-1.5 px-2 border-r border-slate-200">
          <label className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400">Size</span>
            <input 
              type="text" 
              value={fontSizeInput} 
              onChange={(e) => {
                setFontSizeInput(e.target.value);
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val > 0) updateEl({ fontSize: val });
              }}
              onBlur={() => setFontSizeInput((el.fontSize || 12).toString())}
              className="w-10 h-7 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold"
            />
          </label>
          <label className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400">Font</span>
            <input 
              type="text"
              value={el.fontFamily || 'Sans-serif'}
              onChange={(e) => {
                const family = e.target.value;
                loadGoogleFont(family);
                updateEl({ fontFamily: family });
              }}
              list="font-picker-list"
              className="w-24 h-7 bg-slate-50 border border-slate-200 rounded-lg text-center text-[10px] font-bold truncate"
              style={{ fontFamily: el.fontFamily ? `"${el.fontFamily}", sans-serif` : undefined }}
            />
          </label>
          <label className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400">Width</span>
            <input 
              type="text" 
              value={widthInput} 
              onChange={(e) => {
                setWidthInput(e.target.value);
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 5) updateEl({ width: val });
              }}
              onBlur={() => setWidthInput((el.width || 100).toString())}
              className="w-12 h-7 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold"
            />
          </label>
          <button 
            onClick={() => updateEl({ fontStyle: el.fontStyle === 'bold' ? 'normal' : 'bold' })}
            className={`p-1.5 rounded-lg transition-colors ${el.fontStyle === 'bold' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Bold size={14}/>
          </button>
          <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-200">
            <button onClick={() => updateEl({ align: 'left' })} className={`p-1 rounded ${el.align === 'left' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><AlignLeft size={12}/></button>
            <button onClick={() => updateEl({ align: 'center' })} className={`p-1 rounded ${el.align === 'center' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><AlignCenter size={12}/></button>
            <button onClick={() => updateEl({ align: 'right' })} className={`p-1 rounded ${el.align === 'right' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><AlignRight size={12}/></button>
          </div>
          <input 
            type="color" 
            value={el.fill || '#000000'} 
            onChange={(e) => updateEl({ fill: e.target.value })}
            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
          />
        </div>
      )}

      {(el.type === 'qr' || el.type === 'barcode' || el.type === 'image' || el.type === 'frame' || el.type === 'line') && (
        <div className="flex items-center gap-2 px-2 border-r border-slate-200">
           {(el.type !== 'line') && (
             <label className="flex flex-col">
               <span className="text-[9px] font-bold text-slate-400 mb-0.5">SIZE (px)</span>
                <input 
                  type="text" 
                  value={sizeInput} 
                  onChange={(e) => {
                    setSizeInput(e.target.value);
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) updateEl({ width: val, height: val });
                  }}
                  onBlur={() => setSizeInput((el.width || 50).toString())}
                  className="w-12 h-6 text-xs bg-slate-50 border rounded text-center"
                />
             </label>
           )}
           
           {el.type === 'line' && (
             <>
               <label className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 mb-0.5">WIDTH</span>
                  <input 
                    type="text" 
                    value={strokeWidthInput} 
                    onChange={(e) => {
                      setStrokeWidthInput(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0) updateEl({ strokeWidth: val });
                    }}
                    onBlur={() => setStrokeWidthInput((el.strokeWidth || 2).toString())}
                    className="w-10 h-6 text-xs bg-slate-50 border rounded text-center"
                  />
               </label>
               <label className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 mb-0.5">COLOR</span>
                 <input type="color" value={el.stroke || '#5d5fef'} onChange={(e) => updateEl({ stroke: e.target.value })} className="w-6 h-6 border-none bg-transparent"/>
               </label>
             </>
           )}

           {el.type === 'image' && (
             <div className="flex flex-col ml-1">
               <span className="text-[9px] font-bold text-slate-400 mb-0.5">SHAPE</span>
               <div className="flex gap-1">
                  <button onClick={() => updateEl({ cornerRadius: 0 })} className={`p-1 rounded text-[10px] font-bold ${!el.cornerRadius ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}>Sq</button>
                  <button onClick={() => updateEl({ cornerRadius: 15 })} className={`p-1 rounded text-[10px] font-bold ${el.cornerRadius === 15 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}>Ro</button>
                  <button onClick={() => updateEl({ cornerRadius: (el.width || 50) / 2 })} className={`p-1 rounded text-[10px] font-bold ${(el.cornerRadius as number) >= (el.width || 50) / 2 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}>Ci</button>
               </div>
             </div>
           )}

           {el.type === 'frame' && (
              <div className="flex flex-col ml-1">
                <span className="text-[9px] font-bold text-slate-400 mb-0.5">PHOTO</span>
                <label className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors shadow-sm">
                  <ImageIcon size={12} />
                  <span className="text-[10px] font-bold whitespace-nowrap">Replace</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => updateEl({ src: ev.target?.result as string });
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
              </div>
           )}

           {(el.type === 'qr' || el.type === 'barcode') && (
             <label className="flex flex-col">
               <span className="text-[9px] font-bold text-slate-400 mb-0.5">COLOR</span>
               <input type="color" value={el.fill || '#000000'} onChange={(e) => updateEl({ fill: e.target.value })} className="w-6 h-6 border-none bg-transparent"/>
             </label>
           )}
        </div>
      )}

      <div className="px-2 flex gap-1">
        <button onClick={deleteEl} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
        <button onClick={() => setField('idCard.selected', null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><X size={16}/></button>
      </div>
    </div>
  );
}
