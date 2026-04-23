import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Maximize, Printer, Loader2, Layout } from 'lucide-react';

interface SheetPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheetFormat: 'A4' | 'A3';
    setSheetFormat: (val: 'A4' | 'A3') => void;
    cardSide: string;
    setCardSide: (val: string) => void;
    dpi: string;
    setDpi: (val: string) => void;
    totalCards: number;
    onExport: () => void;
    isGenerating: boolean;
}

const SheetPreviewModal: React.FC<SheetPreviewModalProps> = ({
    isOpen, onClose, sheetFormat, setSheetFormat, cardSide, setCardSide, dpi, setDpi, totalCards, onExport, isGenerating
}) => {
    const [margin, setMargin] = useState(10);
    const [spacing, setSpacing] = useState(5);
    const [scale, setScale] = useState(0.8);
    
    // Default CR80 Card dims (mm)
    const cardW = 86;
    const cardH = 54;
    
    // Sheet dims in mm
    const sheetW = sheetFormat === 'A4' ? 210 : 297;
    const sheetH = sheetFormat === 'A4' ? 297 : 420;
    
    // Calculate layout
    const layout = useMemo(() => {
        const availableW = sheetW - (2 * margin);
        const availableH = sheetH - (2 * margin);
        
        let cols = 0;
        let rows = 0;
        
        if (availableW > 0 && availableH > 0) {
            cols = Math.floor((availableW + spacing) / (cardW + spacing));
            rows = Math.floor((availableH + spacing) / (cardH + spacing));
        }
        
        cols = Math.max(0, cols);
        rows = Math.max(0, rows);
        
        const cardsPerSheet = cols * rows;
        const totalSheets = cardsPerSheet > 0 ? Math.ceil(totalCards / cardsPerSheet) : 0;
        
        return { cols, rows, cardsPerSheet, totalSheets };
    }, [sheetW, sheetH, margin, spacing, totalCards]);

    // Multiplier for px rendering
    const M = 2.5;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex bg-gray-900/80 backdrop-blur-sm overflow-hidden font-sans">
            <motion.div 
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                className="w-80 bg-white shadow-2xl flex flex-col h-full border-r border-gray-200 flex-shrink-0"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Layout className="w-5 h-5 text-gray-500" /> Print Engine
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto space-y-6 flex-1">
                    {/* Settings Form */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sheet Settings</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sheet Format</label>
                            <select value={sheetFormat} onChange={e => setSheetFormat(e.target.value as 'A4'|'A3')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <option value="A4">A4 (210 × 297 mm)</option>
                                <option value="A3">A3 (297 × 420 mm)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1 flex justify-between">
                                Page Margin <span className="text-gray-400 font-mono text-xs">{margin}mm</span>
                            </label>
                            <input type="range" min="0" max="30" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1 flex justify-between">
                                Card Spacing <span className="text-gray-400 font-mono text-xs">{spacing}mm</span>
                            </label>
                            <input type="range" min="0" max="20" value={spacing} onChange={e => setSpacing(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Print Options</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Side</label>
                            <select value={cardSide} onChange={e => setCardSide(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <option value="front+back">Front + Back</option>
                                <option value="front">Front Only</option>
                                <option value="back">Back Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Export DPI</label>
                            <select value={dpi} onChange={e => setDpi(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <option value="300">300 DPI (Press Quality)</option>
                                <option value="150">150 DPI (Print Quality)</option>
                            </select>
                        </div>
                    </div>

                    {/* Layout Stats Panel */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Layout Statistics</h3>
                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Cards Per Row</span>
                                <span className="font-semibold text-gray-900">{layout.cols}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Rows Per Sheet</span>
                                <span className="font-semibold text-gray-900">{layout.rows}</span>
                            </div>
                            <div className="w-full h-px bg-blue-100/50 my-1" />
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 font-medium">Cards Per Sheet</span>
                                <span className="font-bold text-blue-700">{layout.cardsPerSheet}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 font-medium">Estimated Sheets</span>
                                <span className="font-bold text-blue-700">{layout.totalSheets}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
                    <button 
                        onClick={onExport}
                        disabled={isGenerating || layout.cardsPerSheet === 0}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Generate Press PDF
                    </button>
                    {layout.cardsPerSheet === 0 && (
                        <p className="text-xs text-red-500 mt-2 text-center">Settings prevent any cards from fitting.</p>
                    )}
                </div>
            </motion.div>

            {/* Print Workspace Context */}
            <div className="flex-1 relative flex flex-col bg-[#e0e2e5]">
                 {/* Toolbar */}
                 <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-xl">
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Zoom Out">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <div className="px-2 text-xs font-medium text-gray-500 min-w-[3rem] text-center w-12">
                        {Math.round(scale * 100)}%
                    </div>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Zoom In">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button onClick={() => setScale(0.8)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Fit Screen">
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>

                {/* Canvas Workspace */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: scale }}
                         transition={{ duration: 0.2 }}
                         className="relative bg-white shadow-2xl transition-all duration-200 origin-center"
                         style={{ 
                             width: `${sheetW * M}px`, 
                             height: `${sheetH * M}px`,
                             padding: `${margin * M}px`,
                         }}
                    >
                        {/* Page info overlay */}
                        <div className="absolute top-2 left-2 text-[8px] font-mono text-gray-400 font-medium tracking-wide">
                            {sheetFormat} Press Layout • D:{new Date().toISOString().split('T')[0]} • DPI:{dpi} • M:{margin}mm S:{spacing}mm
                        </div>
                        {/* Color Bars Simulation */}
                        <div className="absolute top-1 right-2 flex gap-0.5 opacity-60">
                            {['#00ffff', '#ff00ff', '#ffff00', '#000000'].map(c => <div key={c} className="w-1.5 h-1.5" style={{ backgroundColor: c }} />)}
                        </div>

                        {/* Cards Grid Container */}
                        <div 
                            className="flex flex-wrap content-start"
                            style={{ gap: `${spacing * M}px` }}
                        >
                            {Array.from({ length: layout.cardsPerSheet }).map((_, i) => (
                                <div 
                                    key={i}
                                    className="relative bg-white border border-dashed border-blue-200 shadow-sm flex items-center justify-center flex-shrink-0 group"
                                    style={{ 
                                        width: `${cardW * M}px`, 
                                        height: `${cardH * M}px` 
                                    }}
                                >
                                    {/* Crop Marks Simulation */}
                                    <div className="absolute -top-[5px] -left-[1px] w-[1px] h-[4px] bg-red-400/50" />
                                    <div className="absolute -left-[5px] -top-[1px] w-[4px] h-[1px] bg-red-400/50" />
                                    <div className="absolute -bottom-[5px] -left-[1px] w-[1px] h-[4px] bg-red-400/50" />
                                    <div className="absolute -left-[5px] -bottom-[1px] w-[4px] h-[1px] bg-red-400/50" />
                                    <div className="absolute -top-[5px] -right-[1px] w-[1px] h-[4px] bg-red-400/50" />
                                    <div className="absolute -right-[5px] -top-[1px] w-[4px] h-[1px] bg-red-400/50" />
                                    <div className="absolute -bottom-[5px] -right-[1px] w-[1px] h-[4px] bg-red-400/50" />
                                    <div className="absolute -right-[5px] -bottom-[1px] w-[4px] h-[1px] bg-red-400/50" />

                                    {/* Safe Area Indicator */}
                                    <div className="absolute inset-[3px] border border-red-100/30 rounded-sm pointer-events-none" />

                                    <div className="flex items-center gap-2 text-blue-300 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="w-4 h-4 rounded-sm bg-blue-100 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-blue-200 rounded-full" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider">Card Preview</span>
                                    </div>
                                    
                                    {/* Bleed line hint */}
                                    <div className="absolute inset-0 border border-transparent group-hover:border-blue-100/50 transition-colors pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SheetPreviewModal;
