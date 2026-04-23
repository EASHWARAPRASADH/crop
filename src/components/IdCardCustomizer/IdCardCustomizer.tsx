import {
  CheckCircle2,
  CreditCard,
  Trash2,
  AlignCenter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useConfiguratorStore } from '@/store/useConfiguratorStore';

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-[13px]">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[#1a1a1a]">{label}</span>
      </div>
      {hint ? <span className="text-[11px] text-[#919191]">{hint}</span> : null}
    </div>
  );
}

const cardSizes: Record<string, { width: number; height: number }> = {
  '54x86': { width: 153, height: 244 },
  '86x54': { width: 244, height: 153 },
  '100x70': { width: 283, height: 198 },
  '70x100': { width: 198, height: 283 },
};

export const IdCardCustomizer = () => {
  const design = useConfiguratorStore((state) => state.design);
  const setField = useConfiguratorStore((state) => state.setField);

  const handleSizeChange = (newSize: string) => {
    const oldSize = design.idCard.size;
    if (oldSize === newSize) return;

    const oldDim = cardSizes[oldSize] || cardSizes['54x86'];
    const newDim = cardSizes[newSize];

    const wRatio = newDim.width / oldDim.width;
    const hRatio = newDim.height / oldDim.height;
    const minRatio = Math.min(wRatio, hRatio);

    const scaleElements = (elements: any[]) => elements.map(el => {
      const newEl = { ...el };
      if (newEl.x !== undefined) newEl.x *= wRatio;
      if (newEl.y !== undefined) newEl.y *= hRatio;
      if (newEl.width !== undefined) newEl.width *= wRatio;
      if (newEl.height !== undefined && el.type !== 'text') newEl.height *= hRatio;
      if (newEl.fontSize !== undefined) newEl.fontSize *= minRatio;
      if (newEl.cornerRadius !== undefined) {
        if (Array.isArray(newEl.cornerRadius)) {
          newEl.cornerRadius = newEl.cornerRadius.map((r: number) => r * minRatio);
        } else {
          newEl.cornerRadius *= minRatio;
        }
      }
      return newEl;
    });

    setField('idCard.front.elements', scaleElements(design.idCard.front.elements));
    setField('idCard.back.elements', scaleElements(design.idCard.back.elements));
    setField('idCard.size', newSize);
  };

  return (
    <div className="space-y-6">
      {/* Size Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSizeChange('54x86')}
          className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all shadow-sm ${design.idCard.size === '54x86' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-100 hover:border-gray-200 text-slate-600'}`}
        >
          54mm x 86mm (Vertical)
        </button>
        <button
          onClick={() => handleSizeChange('100x70')}
          className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all shadow-sm ${design.idCard.size === '100x70' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-100 hover:border-gray-200 text-slate-600'}`}
        >
          100mm x 70mm (Horizontal)
        </button>
      </div>

      {/* Front/Back Tabs & Toggle */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-1">
        <div className="flex gap-1">
          <button
            onClick={() => setField('idCard.activeSide', 'front')}
            className={`py-2 px-4 font-bold text-sm transition-all relative ${design.idCard.activeSide !== 'back' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            Front
            {design.idCard.activeSide !== 'back' && <motion.div layoutId="activeSide" className="absolute bottom-[-5px] left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
          </button>
          <button
            onClick={() => setField('idCard.activeSide', 'back')}
            className={`py-2 px-4 font-bold text-sm transition-all relative ${design.idCard.activeSide === 'back' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            Back
            {design.idCard.activeSide === 'back' && <motion.div layoutId="activeSide" className="absolute bottom-[-5px] left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
          </button>
        </div>
        <div className="flex items-center gap-2 px-2 selection:bg-transparent cursor-pointer" onClick={() => setField('idCard.showBothSides', !design.idCard.showBothSides)}>
          <label className="text-[11px] font-bold text-slate-500 cursor-pointer uppercase tracking-tight">Show Both Sides</label>
          <div className={`flex w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${design.idCard.showBothSides ? 'bg-indigo-500' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${design.idCard.showBothSides ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>

      {/* Global Actions Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const side = design.idCard.activeSide;
            if (confirm(`Clear all elements on the ${side.toUpperCase()} side?`)) {
              setField(`idCard.${side}.elements`, []);
              setField('idCard.selected', null);
              toast.info(`${side.toUpperCase()} side cleared`);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <Trash2 size={14} /> Clear {design.idCard.activeSide === 'front' ? 'Front' : 'Back'}
        </button>
        <button
          onClick={() => {
            const side = design.idCard.activeSide;
            const size = design.idCard.size;
            const { width, height } = cardSizes[size] || cardSizes['54x86'];
            const elements = design.idCard[side].elements.map((el: any) => {
              const newEl = { ...el };
              if (newEl.width) {
                newEl.x = (width - newEl.width) / 2;
              }
              // For text, height might not be explicitly set, use fontSize as proxy or omit
              if (newEl.height || newEl.fontSize) {
                const elHeight = newEl.height || newEl.fontSize || 20;
                newEl.y = (height - elHeight) / 2;
              }
              return newEl;
            });
            setField(`idCard.${side}.elements`, elements);
            toast.success(`Centered all elements on ${side.toUpperCase()} side`);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 text-[11px] font-bold hover:bg-blue-500 hover:text-white transition-all shadow-sm"
        >
          <AlignCenter size={14} /> Center All
        </button>
      </div>
    </div>
  );
};
