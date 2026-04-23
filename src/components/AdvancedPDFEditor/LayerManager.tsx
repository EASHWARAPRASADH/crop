import React, { useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { Card } from '@/components/ui/card';
import { Layers, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LayerManager = ({ canvas }: { canvas: fabric.Canvas | null }) => {
  const [layers, setLayers] = useState<any[]>([]);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      // Fabric 6 getObjects() returns all items
      const objects = canvas.getObjects().reverse();
      setLayers(objects.map((obj: any, index: number) => ({
        id: obj.name || `Layer ${layers.length - index}`,
        type: obj.type,
        locked: !obj.selectable,
        visible: obj.visible,
        ref: obj
      })));
    };

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('selection:created', updateLayers);
    canvas.on('selection:cleared', updateLayers);

    updateLayers();
    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
    };
  }, [canvas]);

  const toggleLock = (layer: any) => {
    layer.ref.set({ selectable: !layer.locked, evented: !layer.locked });
    canvas?.renderAll();
    // Trigger update
    setLayers([...layers]);
  };

  const toggleVisibility = (layer: any) => {
    layer.ref.set({ visible: !layer.visible });
    canvas?.renderAll();
    setLayers([...layers]);
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden bg-white shadow-sm border-slate-200">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} /> Layer Management
        </h3>
        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
          {layers.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {layers.length === 0 ? (
          <div className="text-[11px] text-slate-400 text-center py-8">No layers yet</div>
        ) : (
          layers.map((layer, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-2 rounded-lg text-[11px] border transition-all ${layer.locked ? 'bg-slate-50/50 border-transparent text-slate-400' : 'bg-white border-slate-100 text-slate-700 shadow-sm'}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${layer.locked ? 'bg-slate-300' : 'bg-indigo-400'}`} />
                <span className="font-semibold capitalize truncate max-w-[120px]">
                  {layer.type === 'itext' ? (layer.ref.text?.substring(0, 15) || 'Text') : layer.type}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                  onClick={() => toggleVisibility(layer)}
                >
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-amber-600"
                  onClick={() => toggleLock(layer)}
                >
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
