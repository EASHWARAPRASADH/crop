import * as XLSX from 'xlsx';
import {
  CheckCircle2,
  CreditCard,
  ImagePlus,
  Link2,
  Palette,
  Paperclip,
  Ruler,
  Shield,
  Type,
  Square,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Layers,
  ChevronUp,
  ChevronDown,
  Database,
  FileCheck,
  RefreshCw,
  Grid,
  Download,
  Trash2,
  Circle,
  TrendingDown,
  ShoppingBag,
  Move,
  ChevronRight,
  FileArchive,
  Settings,
  Image as ImageIcon,
  UploadCloud,
  X,
  Maximize2,
} from 'lucide-react';

import { useMemo, useRef, useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions && pdfjsLib.version) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} else if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(window as any).pdfjsLib.version}/pdf.worker.min.mjs`;
}

async function convertPdfToImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
  return canvas.toDataURL('image/png', 0.9);
}

import IdCardPreview from './IdCardPreview';
import { Stage, Layer } from 'react-konva';
import {
  accessoryOptions,
  clipTypes,
  fonts,
  gradientPresets,
  presetColors,
  widths,
} from '../../data/options';
import { patternCategories, getPatternsByCategory } from '../../data/strapPatterns';
import { parseColorCode, toHexColor } from '../../lib/colorUtils';
import { prepareUploadAsset } from '../../lib/fileReaders';
import { calculatePricing, formatCurrency } from '../../lib/pricing';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import DropzoneField from './DropzoneField';

interface OptionGridProps {
  items: any[];
  selected: string;
  onChange: (value: string) => void;
  icon?: any;
}

function OptionGrid({ items, selected, onChange, icon: Icon }: OptionGridProps) {
  const activeClasses = 'border-[#5d5fef] bg-[#5d5fef]/5 text-[#5d5fef] shadow-sm';
  const accentClasses = 'text-[#5d5fef]';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const active = selected === item.label;
        return (
          <button
            key={item.label}
            type="button"
            title={item.description}
            onClick={() => onChange(item.label)}
            className={`min-h-[80px] rounded-[20px] border-2 p-3 text-left transition-all duration-300 ${active ? activeClasses : 'border-[#eef2f6] bg-white text-[#1a1a1a] hover:border-[#5d5fef]/30 hover:bg-[#f8faff]'
              }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${active ? 'bg-[#5d5fef] text-white' : 'bg-[#f8faff] text-[#5d5fef]'}`}>
                {Icon ? <Icon size={16} /> : <CheckCircle2 size={16} />}
              </div>
              {active ? <CheckCircle2 size={16} className={accentClasses} /> : null}
            </div>
            <div className="text-[13px] font-bold leading-tight">{item.label}</div>
            <div className="mt-0.5 text-[11px] text-[#919191] line-clamp-1">{item.description}</div>
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ label, hint, tip }: { label: string; hint?: string | number; tip?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-[13px]">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[#1a1a1a]">{label}</span>
      </div>
      {hint ? <span className="text-[11px] text-[#919191]">{hint}</span> : (tip ? <span className="text-[11px] text-[#919191]">{tip}</span> : null)}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[14px] border border-[#eef2f6] bg-[#f8faff] px-4 py-3 text-[13px] text-[#1a1a1a] outline-none transition-all focus:border-[#5d5fef] focus:bg-white focus:ring-4 focus:ring-[#5d5fef]/10 ${className}`}
      {...props}
    />
  );
}

function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-[14px] border border-[#eef2f6] bg-[#f8faff] px-4 py-3 text-[13px] text-[#1a1a1a] outline-none transition-all focus:border-[#5d5fef] focus:bg-white focus:ring-4 focus:ring-[#5d5fef]/10 appearance-none ${className}`}
      {...props}
    />
  );
}

function Slider({ value, min, max, step, onChange }: { value: number; min: string; max: string; step?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-full accent-[#5d5fef] h-2 bg-[#eef2f6] rounded-lg cursor-pointer" />;
}

const steps = [
  {
    title: 'Upload Template',
    subtitle: 'Upload a Canva PDF or Image template.',
    icon: CreditCard,
    tip: 'Upload your background template and add text/image placeholders over it.',
  },
  {
    title: 'Mapping',
    subtitle: 'Link your dataset fields to template placeholders.',
    icon: Database,
    tip: 'Choose which column in your CSV maps to each text or image field on the card.',
  },
  {
    title: 'Confirm',
    subtitle: 'Verify the mapping with a sample record.',
    icon: FileCheck,
    tip: 'Check if the data appears correctly on the card preview.',
  },
  {
    title: 'Process',
    subtitle: 'Generate cards for all records in your dataset.',
    icon: RefreshCw,
    tip: 'We are applying your mapping to all records in the background.',
  },
  {
    title: 'Final Review',
    subtitle: 'Review and edit individual generated cards.',
    icon: Grid,
    tip: 'You can fix typos or swap photos for specific records here.',
  },
  {
    title: 'Export',
    subtitle: 'Download your print-ready files.',
    icon: Download,
    tip: 'Choose between PDF for printing or bulk PNG images.',
  },
];

const cardSizes: Record<string, { width: number; height: number }> = {
  '54x86': { width: 153, height: 244 },
  '86x54': { width: 244, height: 153 },
  '100x70': { width: 283, height: 198 },
  '70x100': { width: 198, height: 283 },
};

interface CustomizationPanelProps {
  currentStep: number;
  setCurrentStep: (update: number | ((prev: number) => number)) => void;
  onSubmit?: () => void;
  loading?: boolean;
  stageRef?: React.RefObject<any>;
}

export default function CustomizationPanel({ currentStep, setCurrentStep, onSubmit, loading }: CustomizationPanelProps) {
  const navigate = useNavigate();
  const mappingStageRef = useRef<any>(null);
  const design = useConfiguratorStore((state: any) => state.design);
  const setField = useConfiguratorStore((state: any) => state.setField);
  const toggleAccessory = useConfiguratorStore((state: any) => state.toggleAccessory);
  const setUploadAsset = useConfiguratorStore((state: any) => state.setUploadAsset);
  const [patternCategory, setPatternCategory] = useState('professional');
  const [previewModalRecord, setPreviewModalRecord] = useState<any>(null);

  const pricing = useMemo(() => calculatePricing(design), [design]);

  const customColorState = useMemo(() => parseColorCode(design.customColorCode), [design.customColorCode]);
  const colorPickerValue = useMemo(
    () => {
      if (design.lanyardColor && design.lanyardColor.startsWith('#')) return design.lanyardColor;
      return toHexColor(customColorState.valid ? customColorState.normalized : '#5d5fef');
    },
    [customColorState, design.lanyardColor],
  );
  const hasCustomColorError = design.customColorCode.trim() !== '' && !customColorState.valid && !design.customColorCode.includes('linear-gradient') && !design.customColorCode.includes('radial-gradient');

  const goNext = () => setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
  const goBack = () => setCurrentStep((step) => Math.max(0, step - 1));

  // Progress simulation for Step 4 (index 3)
  useEffect(() => {
    let interval: any;
    if (currentStep === 3 && design.idCard.bulkWorkflow.progress < 100) {
      setField('idCard.bulkWorkflow.isProcessing', true);
      interval = setInterval(() => {
        const nextProgress = Math.min(100, design.idCard.bulkWorkflow.progress + 2);
        setField('idCard.bulkWorkflow.progress', nextProgress);
        if (nextProgress === 100) {
          setField('idCard.bulkWorkflow.isProcessing', false);
          clearInterval(interval);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [currentStep, design.idCard.bulkWorkflow.progress]);


  const handleUpload = async (file: File, key: string) => {
    if (!file) return;
    const asset = await prepareUploadAsset(file);
    setUploadAsset(key, asset.file, asset.previewUrl, asset.name);
  };

  const handleColorCodeChange = (value: string) => {
    setField('customColorCode', value);
    if (value.includes('linear-gradient') || value.includes('radial-gradient')) {
      setField('lanyardColor', value);
      return;
    }
    const parsed = parseColorCode(value);
    if (parsed.valid) {
      setField('lanyardColor', parsed.normalized);
    }
  };

  const activeStep = steps[currentStep];
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  const syncColourSelection = (value: string, pantone: string = design.pantone) => {
    setField('lanyardColor', value);
    setField('customColorCode', value);
    if (pantone) setField('pantone', pantone);
  };

  const content = [
    <div key="design-step" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            const newSize = '54x86';
            const oldSize = design.idCard.size;
            if (oldSize === newSize || oldSize === '86x54') { setField('idCard.size', newSize); return; }
            const wRatio = 153 / 198;
            const hRatio = 244 / 283;
            const scaleElements = (elements: any[]) => elements.map(el => {
              const newEl = { ...el };
              if (newEl.x !== undefined) newEl.x *= wRatio;
              if (newEl.y !== undefined) newEl.y *= hRatio;
              if (newEl.width !== undefined) newEl.width *= wRatio;
              if (newEl.height !== undefined && el.type !== 'text') newEl.height *= hRatio;
              if (newEl.fontSize !== undefined) newEl.fontSize *= Math.min(wRatio, hRatio);
              if (newEl.cornerRadius !== undefined) {
                if (Array.isArray(newEl.cornerRadius)) newEl.cornerRadius = newEl.cornerRadius.map(r => r * Math.min(wRatio, hRatio));
                else newEl.cornerRadius *= Math.min(wRatio, hRatio);
              }
              return newEl;
            });
            setField('idCard.front.elements', scaleElements(design.idCard.front.elements));
            setField('idCard.back.elements', scaleElements(design.idCard.back.elements));
            setField('idCard.size', newSize);
          }}
          className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${design.idCard.size === '54x86' || design.idCard.size === '86x54' ? 'bg-[#5d5fef]/5 border-[#5d5fef] text-[#5d5fef]' : 'bg-white border-[#eef2f6] hover:border-[#5d5fef]/30'}`}
        >
          54mm x 86mm (Vertical)
        </button>
        <button
          onClick={() => {
            const newSize = '100x70';
            const oldSize = design.idCard.size;
            if (oldSize === newSize || oldSize === '70x100') { setField('idCard.size', newSize); return; }
            const wRatio = 283 / 153;
            const hRatio = 198 / 244;
            const scaleElements = (elements: any[]) => elements.map(el => {
              const newEl = { ...el };
              if (newEl.x !== undefined) newEl.x *= wRatio;
              if (newEl.y !== undefined) newEl.y *= hRatio;
              if (newEl.width !== undefined) newEl.width *= wRatio;
              if (newEl.height !== undefined && el.type !== 'text') newEl.height *= hRatio;
              if (newEl.fontSize !== undefined) newEl.fontSize *= Math.min(wRatio, hRatio);
              if (newEl.cornerRadius !== undefined) {
                if (Array.isArray(newEl.cornerRadius)) newEl.cornerRadius = newEl.cornerRadius.map(r => r * Math.min(wRatio, hRatio));
                else newEl.cornerRadius *= Math.min(wRatio, hRatio);
              }
              return newEl;
            });
            setField('idCard.front.elements', scaleElements(design.idCard.front.elements));
            setField('idCard.back.elements', scaleElements(design.idCard.back.elements));
            setField('idCard.size', newSize);
          }}
          className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${design.idCard.size === '100x70' || design.idCard.size === '70x100' ? 'bg-[#5d5fef]/5 border-[#5d5fef] text-[#5d5fef]' : 'bg-white border-[#eef2f6] hover:border-[#5d5fef]/30'}`}
        >
          100mm x 70mm (Horizontal)
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-[#eef2f6]">
        <div className="flex">
          <button
            onClick={() => setField('idCard.activeSide', 'front')}
            className={`py-2 px-4 font-bold text-[13px] transition-all ${design.idCard.activeSide !== 'back' ? 'border-b-2 border-[#5d5fef] text-[#5d5fef]' : 'text-[#919191] hover:text-[#1a1a1a]'}`}>
            Front
          </button>
          <button
            onClick={() => setField('idCard.activeSide', 'back')}
            className={`py-2 px-4 font-bold text-[13px] transition-all ${design.idCard.activeSide === 'back' ? 'border-b-2 border-[#5d5fef] text-[#5d5fef]' : 'text-[#919191] hover:text-[#1a1a1a]'}`}>
            Back
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setField('idCard.showBothSides', !design.idCard.showBothSides)} className="flex items-center gap-2 mb-2 px-2 selection:bg-transparent cursor-pointer">
            <label className="text-[11px] font-bold text-[#1a1a1a] cursor-pointer">Show Both Sides</label>
            <div className={`flex w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${design.idCard.showBothSides ? 'bg-[#5d5fef]' : 'bg-[#eef2f6]'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${design.idCard.showBothSides ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <button onClick={() => setField('idCard.showGrid', !design.idCard.showGrid)} className="flex items-center gap-2 mb-2 px-2 selection:bg-transparent cursor-pointer">
            <label className="text-[11px] font-bold text-[#1a1a1a] cursor-pointer">Grid View</label>
            <div className={`flex w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${design.idCard.showGrid ? 'bg-[#5d5fef]' : 'bg-[#eef2f6]'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${design.idCard.showGrid ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>
      <div className="rounded-[24px] border-2 border-dashed border-[#5d5fef]/30 bg-[#f8faff] p-6 text-center hover:bg-[#5d5fef]/5 transition-colors">
        <input
          type="file"
          accept=".pdf,image/*"
          id={`template-upload-${design.idCard.activeSide}`}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              let dataUrl = '';
              if (file.name.toLowerCase().endsWith('.pdf')) {
                dataUrl = await convertPdfToImage(file);
              } else {
                dataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (event) => resolve(event.target?.result as string);
                  reader.readAsDataURL(file);
                });
              }
              setField(`idCard.${design.idCard.activeSide}.backgroundImage`, dataUrl);
            } catch (err) {
              console.error('Error uploading template', err);
              alert('Could not upload template.');
            }
          }}
        />
        <label htmlFor={`template-upload-${design.idCard.activeSide}`} className="cursor-pointer flex flex-col items-center">
          <UploadCloud size={32} className="text-[#5d5fef] mb-3" />
          <span className="text-[14px] font-bold text-[#1a1a1a]">
            {design.idCard[design.idCard.activeSide].backgroundImage ? 'Change Template' : 'Upload Template'} for {design.idCard.activeSide === 'front' ? 'Front' : 'Back'}
          </span>
          <span className="text-[12px] text-[#919191] mt-1">Accepts PDF, PNG, JPG (Canva export)</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const side = design.idCard.activeSide;
            if (confirm(`Empty all elements on the ${side} side?`)) {
              setField(`idCard.${side}.elements`, []);
              setField('idCard.selected', null);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-[14px] border border-red-100 bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
              if (newEl.width) newEl.x = (width - newEl.width) / 2;
              if (newEl.height) newEl.y = (height - newEl.height) / 2;
              return newEl;
            });
            setField(`idCard.${side}.elements`, elements);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-[14px] border border-[#5d5fef]/10 bg-[#5d5fef]/5 text-[#5d5fef] text-[11px] font-bold hover:bg-[#5d5fef] hover:text-white transition-all shadow-sm"
        >
          <AlignCenter size={14} /> Center All
        </button>
      </div>

      <div className="rounded-[24px] border-2 border-[#eef2f6] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <label className="text-[13px] font-bold text-[#1a1a1a] block">Add Data Placeholders / Elements</label>
          <span className="text-[11px] text-[#919191]">Add shapes or position boxes where Excel data should appear.</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => {
              const side = design.idCard.activeSide;
              const newEl = { id: `text-${Date.now()}`, type: 'text', content: 'New Text', x: 20, y: 20, width: 100, fontSize: 12, fill: '#1a1a1a', align: 'left' };
              setField(`idCard.${side}.elements`, design.idCard[side].elements.concat(newEl));
              setField('idCard.selected', newEl.id);
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-[18px] bg-[#f8faff] py-3.5 transition-all hover:bg-[#5d5fef]/5 hover:text-[#5d5fef] text-[#919191] border-2 border-transparent hover:border-[#5d5fef]/20"
          >
            <Type size={20} strokeWidth={2.5} />
            <span className="text-[11px] font-bold">Text</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const side = design.idCard.activeSide;
                  const newEl = { id: `image-${Date.now()}`, type: 'image', src: event.target?.result as string, x: 20, y: 40, width: 80, height: 80, cornerRadius: 0 };
                  setField(`idCard.${side}.elements`, design.idCard[side].elements.concat(newEl));
                  setField('idCard.selected', newEl.id);
                };
                reader.readAsDataURL(file);
              };
              input.click();
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-[18px] bg-[#f8faff] py-3.5 transition-all hover:bg-[#5d5fef]/5 hover:text-[#5d5fef] text-[#919191] border-2 border-transparent hover:border-[#5d5fef]/20"
          >
            <ImagePlus size={20} strokeWidth={2.5} />
            <span className="text-[11px] font-bold">Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const side = design.idCard.activeSide;
              const newEl = { id: `rect-${Date.now()}`, type: 'rect', x: 20, y: 20, width: 60, height: 60, fill: '#eeeeee', stroke: '#cccccc', strokeWidth: 1, cornerRadius: 4 };
              setField(`idCard.${side}.elements`, design.idCard[side].elements.concat(newEl));
              setField('idCard.selected', newEl.id);
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-[18px] bg-[#f8faff] py-3.5 transition-all hover:bg-[#5d5fef]/5 hover:text-[#5d5fef] text-[#919191] border-2 border-transparent hover:border-[#5d5fef]/20"
          >
            <Square size={20} strokeWidth={2.5} />
            <span className="text-[11px] font-bold">Shape</span>
          </button>
        </div>
      </div>

      <div className="rounded-[24px] border-2 border-[#eef2f6] p-5 bg-white shadow-sm mt-4">
        <span className="text-[13px] font-bold text-[#1a1a1a] mb-3 block">{design.idCard.activeSide === 'front' ? 'Front' : 'Back'} Background Color (For Shapes / Base)</span>
        <div className="bg-[#f8faff] rounded-[20px] p-4 space-y-5 border border-[#eef2f6]">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0">
              <input
                type="color"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                value={design.idCard[design.idCard.activeSide].backgroundColor.includes('gradient') ? '#ffffff' : design.idCard[design.idCard.activeSide].backgroundColor}
                onChange={(e) => setField(`idCard.${design.idCard.activeSide}.backgroundColor`, e.target.value)}
              />
              <div
                className="w-full h-full rounded-xl border-2 border-white shadow-sm"
                style={{ backgroundColor: design.idCard[design.idCard.activeSide].backgroundColor.includes('gradient') ? '#ffffff' : design.idCard[design.idCard.activeSide].backgroundColor }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-[#919191] uppercase tracking-wider mb-0.5 block">
                {design.idCard[design.idCard.activeSide].backgroundColor.includes('gradient') ? 'Gradient Color' : 'Solid Color'}
              </span>
              <div className="text-[12px] font-black text-[#1a1a1a] truncate" title={design.idCard[design.idCard.activeSide].backgroundColor}>
                {design.idCard[design.idCard.activeSide].backgroundColor.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#eef2f6]">
            <div className="mb-3 text-[11px] font-bold text-[#919191] uppercase tracking-wider">Gradient Presets</div>
            <div className="grid grid-cols-6 gap-2.5">
              {gradientPresets.map((grad: any) => (
                <button
                  type="button"
                  key={grad.name}
                  onClick={() => setField(`idCard.${design.idCard.activeSide}.backgroundColor`, grad.value)}
                  className={`aspect-square w-full rounded-lg border-2 transition-all ${design.idCard[design.idCard.activeSide].backgroundColor === grad.value ? 'border-[#5d5fef] scale-110 shadow-md ring-2 ring-[#5d5fef]/20' : 'border-white hover:border-[#5d5fef]/30'}`}
                  style={{ background: grad.value }}
                  title={grad.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Property Editor Panel */}
      {(() => {
        const side = design.idCard.activeSide;
        const selectedId = design.idCard.selected;
        const selectedEl = design.idCard[side].elements.find((e: any) => e.id === selectedId);
        if (selectedEl) {
          return (
            <div className="rounded-[24px] border-2 border-[#5d5fef] bg-white p-5 mt-2 shadow-[0_8px_30px_rgb(93,95,239,0.12)] animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5d5fef] text-white">
                    {selectedEl.type === 'text' ? <Type size={14} /> : selectedEl.type === 'image' ? <ImagePlus size={14} /> : <Square size={14} />}
                  </div>
                  <span className="text-[13px] font-bold text-[#1a1a1a] capitalize">{selectedEl.type} Settings</span>
                </div>
                <button onClick={() => { setField(`idCard.${side}.elements`, design.idCard[side].elements.filter((e: any) => e.id !== selectedId)); setField('idCard.selected', null); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>

              <div className="space-y-4">
                {selectedEl.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <FieldLabel label="Content" />
                      <Input value={selectedEl.content} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, content: e.target.value } : el); setField(`idCard.${side}.elements`, updated); }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <FieldLabel label="Size" hint={`${Math.round(selectedEl.fontSize || 12)}px`} />
                        <Slider min="6" max="80" value={selectedEl.fontSize || 12} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, fontSize: Number(e.target.value) } : el); setField(`idCard.${side}.elements`, updated); }} />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel label="Color" />
                        <Input type="color" value={selectedEl.fill || '#000000'} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, fill: e.target.value } : el); setField(`idCard.${side}.elements`, updated); }} className="h-10 p-1.5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#f8faff] p-1.5 rounded-xl border border-[#eef2f6]">
                      <button onClick={() => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, align: 'left' } : el); setField(`idCard.${side}.elements`, updated); }} className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${selectedEl.align === 'left' ? 'bg-white text-[#5d5fef] shadow-sm' : 'text-[#919191]'}`}><AlignLeft size={16} /></button>
                      <button onClick={() => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, align: 'center' } : el); setField(`idCard.${side}.elements`, updated); }} className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${selectedEl.align === 'center' ? 'bg-white text-[#5d5fef] shadow-sm' : 'text-[#919191]'}`}><AlignCenter size={16} /></button>
                      <button onClick={() => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, align: 'right' } : el); setField(`idCard.${side}.elements`, updated); }} className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${selectedEl.align === 'right' ? 'bg-white text-[#5d5fef] shadow-sm' : 'text-[#919191]'}`}><AlignRight size={16} /></button>
                    </div>
                  </div>
                )}
                {selectedEl.type !== 'text' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel label="Width" hint={`${Math.round(selectedEl.width)}px`} />
                        <Slider min="10" max="400" value={selectedEl.width} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, width: Number(e.target.value), height: el.type === 'circle' ? Number(e.target.value) : el.height } : el); setField(`idCard.${side}.elements`, updated); }} />
                      </div>
                      {selectedEl.type !== 'circle' && selectedEl.type !== 'triangle' && selectedEl.type !== 'rhombus' && (
                        <div>
                          <FieldLabel label="Height" hint={`${Math.round(selectedEl.height || 80)}px`} />
                          <Slider min="10" max="400" value={selectedEl.height || 80} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, height: Number(e.target.value) } : el); setField(`idCard.${side}.elements`, updated); }} />
                        </div>
                      )}
                    </div>
                    {selectedEl.type !== 'image' && (
                      <div>
                        <FieldLabel label="Fill Color" />
                        <Input type="color" value={selectedEl.fill || '#eeeeee'} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, fill: e.target.value } : el); setField(`idCard.${side}.elements`, updated); }} className="h-10 p-1.5" />
                      </div>
                    )}
                    {(selectedEl.type === 'rect' || selectedEl.type === 'image') && (
                      <div>
                        <FieldLabel label="Corner Radius" />
                        <Slider min="0" max="100" value={selectedEl.cornerRadius || 0} onChange={(e) => { const updated = design.idCard[side].elements.map((el: any) => el.id === selectedId ? { ...el, cornerRadius: Number(e.target.value) } : el); setField(`idCard.${side}.elements`, updated); }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-[#f1f5f9]">
                  <button onClick={() => { const others = design.idCard[side].elements.filter((el: any) => el.id !== selectedId); setField(`idCard.${side}.elements`, [...others, selectedEl]); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#f8faff] text-[#1a1a1a] text-[11px] font-bold hover:bg-[#eef2f6] transition-all"><ChevronUp size={14} /> To Front</button>
                  <button onClick={() => { const others = design.idCard[side].elements.filter((el: any) => el.id !== selectedId); setField(`idCard.${side}.elements`, [selectedEl, ...others]); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#f8faff] text-[#1a1a1a] text-[11px] font-bold hover:bg-[#eef2f6] transition-all"><ChevronDown size={14} /> To Back</button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="rounded-[24px] border-2 border-dashed border-[#5d5fef]/20 bg-[#5d5fef]/5 p-5 mt-2 text-center">
            <CreditCard size={28} className="mx-auto text-[#5d5fef]/40 mb-2" />
            <p className="text-[12px] font-bold text-[#5d5fef]">Select an element to edit</p>
            <p className="text-[10px] text-[#919191] mt-0.5">Edit text, colors, shapes, or templates above.</p>
          </div>
        );
      })()}

      <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 mt-4">
        <div className="flex items-start gap-3 text-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          <div className="flex-1 text-amber-900">
            <h4 className="text-[12px] font-bold">Important Note</h4>
            <p className="mt-1 text-[11px] leading-relaxed">The final physical print output may vary slightly in appearance or saturation from this digital preview.</p>
          </div>
        </div>
      </div>
    </div>,
    <div key="mapping" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <h3 className="text-[14px] font-bold text-blue-900 mb-2 flex items-center gap-2">
          <Database size={18} /> Dataset Mapping
        </h3>
        <p className="text-[12px] text-blue-700 leading-relaxed mb-4">
          Upload your dataset to connect columns to the design elements. Drag and drop fields onto the card preview.
        </p>

        {(!design.idCard.bulkWorkflow.datasetColumns || design.idCard.bulkWorkflow.datasetColumns.length === 0) ? (
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-white shadow-sm hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = event.target?.result;
                      const workbook = XLSX.read(data, { type: 'binary' });
                      const firstSheetName = workbook.SheetNames[0];
                      const worksheet = workbook.Sheets[firstSheetName];

                      const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
                      const records = XLSX.utils.sheet_to_json(worksheet);

                      if (headers && records.length > 0) {
                        setField('idCard.bulkWorkflow.datasetColumns', headers);
                        setField('idCard.bulkWorkflow.datasetRecords', records);
                        setField('idCard.bulkWorkflow.mapping', {});
                      }
                    } catch (err) {
                      console.error('Error parsing excel', err);
                      alert('Could not parse Excel file. Ensure it is a valid .xlsx or .xls file.');
                    }
                  };
                  reader.readAsBinaryString(file);
                }
              }}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center transform hover:scale-105 transition-all shadow-sm">
                <UploadCloud size={28} />
              </div>
              <div>
                <span className="text-[14px] font-bold text-blue-600 hover:text-blue-700 block">Click to upload or drag and drop</span>
                <p className="text-[12px] text-gray-500 mt-1">Excel dataset (.xlsx, .xls) with records</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
              <div className="text-[12px] font-bold text-green-700 flex items-center gap-1.5 px-2">
                <CheckCircle2 size={16} />
                Loaded {design.idCard.bulkWorkflow.datasetRecords.length} records & {design.idCard.bulkWorkflow.datasetColumns.length} fields
              </div>
              <button
                onClick={() => {
                  setField('idCard.bulkWorkflow.datasetColumns', []);
                  setField('idCard.bulkWorkflow.datasetRecords', []);
                  setField('idCard.bulkWorkflow.mapping', {});
                }}
                className="text-[11px] text-red-500 font-bold hover:underline py-1 px-2 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear Dataset
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="text-[13px] font-bold text-gray-900">Dataset Columns (Drag to map)</h4>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{design.idCard.bulkWorkflow.datasetColumns.length} fields</span>
                </div>

                <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                  {design.idCard.bulkWorkflow.datasetColumns.map((col: string) => {
                    const sampleVal = design.idCard.bulkWorkflow.datasetRecords[0]?.[col];
                    const isImageLike = sampleVal && typeof sampleVal === 'string' && (sampleVal.startsWith('http') || sampleVal.startsWith('data:image') || sampleVal.toLowerCase().endsWith('.jpg') || sampleVal.toLowerCase().endsWith('.png'));
                    const isMapped = Object.values(design.idCard.bulkWorkflow.mapping).includes(col);

                    return (
                      <div
                        key={col}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', col);
                          e.currentTarget.classList.add('opacity-50', 'ring-2', 'ring-blue-500');
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-blue-500');
                        }}
                        className={`p-3 bg-white border ${isMapped ? 'border-green-300 bg-green-50/30' : 'border-gray-200'} rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 active:cursor-grabbing cursor-grab transition-all group select-none`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${isMapped ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'} transition-colors`}>
                              <Move size={12} />
                            </div>
                            <span className="text-[12px] font-bold text-gray-800 truncate">{col}</span>
                          </div>
                          {isMapped && <CheckCircle2 size={14} className="text-green-500" />}
                        </div>
                        <div className="text-[10.5px] text-gray-500 truncate pl-8">
                          {isImageLike ? (
                            <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md inline-flex w-max">
                              <ImageIcon size={10} /> Image/Photo reference
                            </span>
                          ) : (
                            <span className="bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 text-gray-600 inline-block w-full truncate">"{sampleVal || 'Empty'}"</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {(() => {
              const allEls = [...design.idCard.front.elements, ...design.idCard.back.elements];
              const hasImageMapping = Object.entries(design.idCard.bulkWorkflow.mapping).some(([elId, col]) => {
                const el = allEls.find((e: any) => e.id === elId);
                return el && el.type === 'image' && el.id !== 'photo-ring' && el.id !== 'photo-border';
              });

              if (hasImageMapping) {
                return (
                  <div className="mt-4 p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-[14px] font-bold text-emerald-900 mb-2 flex items-center gap-2">
                      <ImageIcon size={18} /> Upload Mapped Images
                    </h4>
                    <p className="text-[12px] text-emerald-700 leading-relaxed mb-4">
                      You have mapped an image element to a dataset column. Please upload the corresponding image files so they can be processed and matched to your dataset records.
                    </p>
                    <div className="flex items-center justify-between">
                      <label className="cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-emerald-200 text-[12px] font-bold text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                        <input
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const zip = new JSZip();
                              const loadedZip = await zip.loadAsync(file);
                              const newImages = { ...(design.idCard.bulkWorkflow.datasetImages || {}) };

                              const imagePromises: Promise<void>[] = [];
                              for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
                                if (!zipEntry.dir && relativePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
                                  imagePromises.push(
                                    zipEntry.async("base64").then((base64: string) => {
                                      const ext = relativePath.split('.').pop()?.toLowerCase();
                                      let mimeType = 'image/jpeg';
                                      if (ext === 'png') mimeType = 'image/png';
                                      else if (ext === 'webp') mimeType = 'image/webp';
                                      const dataUrl = `data:${mimeType};base64,${base64}`;
                                      newImages[zipEntry.name.split('/').pop() || zipEntry.name] = dataUrl;
                                      newImages[zipEntry.name.replace(/\.[^/.]+$/, "").split('/').pop() || zipEntry.name] = dataUrl;
                                    })
                                  );
                                }
                              }
                              await Promise.all(imagePromises);
                              setField('idCard.bulkWorkflow.datasetImages', newImages);
                            } catch (err) {
                              console.error(err);
                              alert("Failed to process ZIP file.");
                            }
                          }}
                        />
                        <span className="flex items-center gap-2"><UploadCloud size={16} /> Upload Images ZIP</span>
                      </label>
                      {Object.keys(design.idCard.bulkWorkflow.datasetImages || {}).length > 0 && (
                        <div className="text-[12px] font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                          {Object.keys(design.idCard.bulkWorkflow.datasetImages || {}).length} Images Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Manual fallback mapped view */}
            {Object.keys(design.idCard.bulkWorkflow.mapping).length > 0 && (
              <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <h4 className="text-[12px] font-bold text-gray-700 mb-3 flex items-center gap-2"><Link2 size={14} /> Active Mappings Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(design.idCard.bulkWorkflow.mapping).map(([elId, colName]) => {
                    const allEls = [...design.idCard.front.elements, ...design.idCard.back.elements];
                    const elDef = allEls.find((e: any) => e.id === elId);
                    return (
                      <div key={elId} className="flex flex-col gap-1 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black truncate">{elDef?.content || elDef?.type || elId}</div>
                        <div className="text-[12px] font-bold text-blue-600 flex items-center gap-1.5"><Database size={12} /> {colName as string}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,

    <div key="confirm" className="space-y-6 text-center">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <FileCheck size={32} />
        </div>
        <h3 className="text-[16px] font-bold text-emerald-900 mb-2">Check Sample Preview</h3>
        <p className="text-[13px] text-emerald-700 leading-relaxed mb-6">
          We've applied your mapping to a sample record. Verify that the layout and data look correct before starting bulk processing.
        </p>

        <div className="inline-block p-1 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="scale-[0.6] origin-top h-[180px] w-[260px]">
            <Stage width={260} height={180}>
              <Layer>
                <IdCardPreview
                  isReviewStep={true}
                  record={(design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords[0] : null}
                  mapping={design.idCard.bulkWorkflow.mapping}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setPreviewModalRecord((design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords[0] : null)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl shadow-sm inline-flex items-center gap-2 transition-colors"
          >
            <Maximize2 size={14} /> View Full Size Preview
          </button>
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl border border-emerald-100 text-left">
          <h4 className="text-[12px] font-bold text-gray-900 mb-3">Confirmation Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <div className="p-2 rounded-lg bg-emerald-50/30">
              <span className="text-gray-400 block mb-0.5">Total Records</span>
              <span className="font-bold text-gray-900">{(design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords.length : 0} Participants</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50/30">
              <span className="text-gray-400 block mb-0.5">Mapped Fields</span>
              <span className="font-bold text-gray-900">{Object.keys(design.idCard.bulkWorkflow.mapping).length} Elements</span>
            </div>
          </div>
        </div>
      </div>
    </div>,

    <div key="process" className="space-y-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-blue-50 flex items-center justify-center">
          <RefreshCw size={48} className="text-blue-500 animate-spin" />
        </div>
        <div className="absolute top-0 right-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-[12px] font-black shadow-lg">
          {design.idCard.bulkWorkflow.progress}%
        </div>
      </div>

      <div className="text-center space-y-3 max-w-xs">
        <h3 className="text-[18px] font-bold text-gray-900 tracking-tight">Generating Cards...</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          We are applying your design and mapping to {(design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords.length : 0} records. This will take a few moments.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${design.idCard.bulkWorkflow.progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] font-bold text-blue-600">
          <span>{Math.round(((design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords.length : 0) * (design.idCard.bulkWorkflow.progress / 100))} / {(design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords.length : 0} PROCESSED</span>
          <button className="text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest text-[10px]">Cancel</button>
        </div>
      </div>
    </div>,

    <div key="review-grid" className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Grid size={20} className="text-blue-600" /> Processed Results
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <input type="text" placeholder="Search records..." className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500/20" />
            <Eye size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600"><Layers size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {((design.idCard.bulkWorkflow.datasetRecords && design.idCard.bulkWorkflow.datasetRecords.length > 0) ? design.idCard.bulkWorkflow.datasetRecords : []).map((rec: any, i: number) => {
          // Find ID field dynamically if possible
          const idField = rec['ID'] || rec['id'] || rec['employee_id'] || rec['user_id'] || `Record ${i + 1}`;
          const nameField = rec['Full Name'] || rec['name'] || rec['first_name'] || rec['title'] || `User`;

          return (
            <div key={i} className="group relative bg-white rounded-2xl border border-gray-100 p-3 hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer">
              <div className="aspect-[3/2] bg-gray-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                <div className="scale-[0.35] origin-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <Stage width={283} height={198}>
                    <Layer>
                      <IdCardPreview
                        isReviewStep={true}
                        record={rec}
                        mapping={design.idCard.bulkWorkflow.mapping}
                      />
                    </Layer>
                  </Stage>
                </div>
              </div>
              <div className="px-1 flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-bold text-gray-900">{nameField}</h4>
                  <p className="text-[9px] text-gray-400 uppercase font-black">ID: {idField}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalRecord(rec)}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>,

    <div key="export" className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border-2 border-blue-500 bg-blue-50/50 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-all ring-4 ring-white shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mb-4">
            <FileArchive size={24} />
          </div>
          <h4 className="text-[15px] font-bold text-blue-900 mb-1">Print-Ready PDF</h4>
          <p className="text-[11px] text-blue-700/70">Bulk documents merged with bleed and crop marks.</p>
        </div>
        <div className="p-6 rounded-2xl border-2 border-transparent bg-gray-50 flex flex-col items-center text-center cursor-pointer hover:bg-white hover:border-gray-200 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 text-gray-600 flex items-center justify-center mb-4">
            <ImageIcon size={24} />
          </div>
          <h4 className="text-[15px] font-bold text-gray-900 mb-1">Bulk PNG Images</h4>
          <p className="text-[11px] text-gray-500">A ZIP file containing individual card images.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 p-6 bg-white space-y-6">
        <h4 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
          <Settings size={18} className="text-gray-400" /> Export Settings
        </h4>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <FieldLabel label="Resolution (DPI)" hint="300 DPI Recommended" />
            <Slider min="72" max="600" step="1" value={design.idCard.bulkWorkflow.exportSettings.dpi} onChange={(e) => {
              setField('idCard.bulkWorkflow.exportSettings.dpi', Number(e.target.value));
            }} />
          </div>
          <div>
            <FieldLabel label="Bleed Margin (mm)" hint="Standard 3mm" />
            <Slider min="0" max="10" step="0.5" value={design.idCard.bulkWorkflow.exportSettings.bleed} onChange={(e) => {
              setField('idCard.bulkWorkflow.exportSettings.bleed', Number(e.target.value));
            }} />
          </div>
          <div>
            <FieldLabel label="Page Size" />
            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>A4 (Portrait)</option>
              <option>A4 (Landscape)</option>
              <option>US Letter</option>
              <option>Fit to ID Card</option>
            </select>
          </div>
          <div>
            <FieldLabel label="Color Profile" />
            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>sRGB (Digital)</option>
              <option>CMYK (Print Offset)</option>
            </select>
          </div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between border-b border-[#eef2f6] pb-4">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="px-5 py-2.5 rounded-[14px] text-[13px] font-bold text-[#1a1a1a] bg-white border border-[#eef2f6] hover:bg-[#f8faff] disabled:opacity-30 transition-all"
        >
          Back
        </button>
        <button
          type="button"
          disabled={loading || (currentStep === 3 && design.idCard.bulkWorkflow.progress < 100)}
          onClick={() => {
            if (currentStep === 4) { // Final Review (was 5)
              navigate('/exports?action=bulk-export');
            } else if (currentStep === steps.length - 1) {
              if (onSubmit) onSubmit();
            } else {
              goNext();
            }
          }}
          className={`px-8 py-2.5 rounded-[14px] text-[13px] font-bold text-white transition-all shadow-[0_6px_20px_rgba(93,95,239,0.2)] disabled:opacity-50 disabled:cursor-not-allowed ${currentStep === 4 || currentStep === steps.length - 1 ? 'bg-[#10b981] hover:bg-[#059669]' : 'bg-[#5d5fef] hover:bg-[#4a4cd9]'}`}
        >
          {loading || (currentStep === 3 && design.idCard.bulkWorkflow.progress < 100) ? 'Processing...' : (currentStep === 4 || currentStep === steps.length - 1 ? 'Next' : 'Continue')}
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#5d5fef]/10 text-[#5d5fef]">
            {activeStep.icon ? <activeStep.icon size={24} /> : <Palette size={24} />}
          </div>
          <div className="text-right">
            <span className="text-[14px] font-bold text-[#1a1a1a]">Step {currentStep + 1} of {steps.length}</span>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-1.5 w-32 rounded-full bg-[#f8faff] overflow-hidden border border-[#eef2f6]">
                <div className="h-full bg-[#5d5fef] transition-all duration-500 shadow-[0_0_8px_rgba(93,95,239,0.5)]" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[12px] font-bold text-[#5d5fef]">{progress}%</span>
            </div>
          </div>
        </div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a]">{activeStep.title}</h2>
        <p className="text-[14px] text-[#919191] mt-1">{activeStep.subtitle}</p>
      </div>

      <div className="panel-scroll flex-1 overflow-y-auto pr-2 pb-8">
        {content[currentStep]}
      </div>

      {previewModalRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-2xl relative flex flex-col items-center border border-gray-100 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setPreviewModalRecord(null)} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors z-10">
              <X size={20} />
            </button>
            <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2 w-full justify-center"><Maximize2 size={18} className="text-blue-500" /> Full Size Preview</h3>
            <div className="border-4 border-gray-100 shadow-inner rounded-xl overflow-hidden bg-[#f8faff] p-8 flex justify-center items-center">
              <Stage width={design.idCard.size === '100x70' || design.idCard.size === '70x100' ? Math.max(283, 198) * 1.5 : Math.max(244, 153) * 1.5} height={design.idCard.size === '100x70' || design.idCard.size === '70x100' ? Math.max(283, 198) * 1.5 : Math.max(244, 153) * 1.5}>
                <Layer scaleX={1.5} scaleY={1.5}>
                  <IdCardPreview isReviewStep={true} record={previewModalRecord} mapping={design.idCard.bulkWorkflow.mapping} />
                </Layer>
              </Stage>
            </div>
            <div className="mt-4 text-[13px] text-gray-500 font-medium">Record Title: {previewModalRecord['Full Name'] || previewModalRecord['name'] || previewModalRecord['first_name'] || previewModalRecord['title'] || 'Sample'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
