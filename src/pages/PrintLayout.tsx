import { useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, Settings, Eye, CreditCard, Maximize2 } from 'lucide-react';

const PrintLayout = () => {
    const [sheetSize, setSheetSize] = useState('A4');
    const [cardsPerRow, setCardsPerRow] = useState(2);
    const [cardsPerCol, setCardsPerCol] = useState(5);
    const [duplex, setDuplex] = useState(true);
    const [cropMarks, setCropMarks] = useState(true);
    const [bleed, setBleed] = useState(3);

    const totalCards = cardsPerRow * cardsPerCol;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Print Layout</h1>
                    <p className="text-gray-500 mt-1">Configure {sheetSize} sheet layouts with duplex printing support.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                    <Printer className="w-4 h-4" /> Generate Print Sheets
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings */}
                <div className="space-y-5">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-gray-400" /> Sheet Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sheet Size</label>
                                <select value={sheetSize} onChange={e => setSheetSize(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
                                    <option value="A4">A4 (210 × 297 mm)</option>
                                    <option value="A3">A3 (297 × 420 mm)</option>
                                    <option value="Letter">Letter (8.5 × 11 in)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cards per Row</label>
                                    <input type="number" value={cardsPerRow} onChange={e => setCardsPerRow(+e.target.value)} min={1} max={4}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cards per Column</label>
                                    <input type="number" value={cardsPerCol} onChange={e => setCardsPerCol(+e.target.value)} min={1} max={8}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bleed (mm)</label>
                                <input type="range" min={0} max={10} value={bleed} onChange={e => setBleed(+e.target.value)} className="w-full" />
                                <p className="text-xs text-gray-500 mt-1">{bleed}mm bleed margin</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Duplex (Front + Back)</span>
                                <button onClick={() => setDuplex(!duplex)} className={`w-10 h-6 rounded-full transition-colors ${duplex ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${duplex ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Crop Marks</span>
                                <button onClick={() => setCropMarks(!cropMarks)} className={`w-10 h-6 rounded-full transition-colors ${cropMarks ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${cropMarks ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /> Summary</h2>
                        {[
                            { label: 'Sheet Size', value: sheetSize },
                            { label: 'Cards per Sheet', value: `${totalCards} (${cardsPerRow}×${cardsPerCol})` },
                            { label: 'Duplex', value: duplex ? 'Yes' : 'No' },
                            { label: 'Crop Marks', value: cropMarks ? 'Yes' : 'No' },
                            { label: 'Bleed', value: `${bleed}mm` },
                            { label: 'Sheets for 1250 cards', value: `${Math.ceil(1250 / totalCards)} sheets` },
                        ].map(row => (
                            <div key={row.label} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">{row.label}</span>
                                <span className="font-medium text-gray-900">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="lg:col-span-2">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Eye className="w-4 h-4 text-gray-400" /> Sheet Preview</h2>
                            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Maximize2 className="w-4 h-4" /></button>
                        </div>
                        {/* Simulated sheet */}
                        <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
                            <div className="bg-white shadow-lg border border-gray-200 relative" style={{ width: sheetSize === 'A3' ? 420 : 297, height: sheetSize === 'A3' ? 560 : 400 }}>
                                {cropMarks && (
                                    <>
                                        <div className="absolute -top-3 left-4 w-px h-3 bg-gray-400" />
                                        <div className="absolute -top-3 right-4 w-px h-3 bg-gray-400" />
                                        <div className="absolute -bottom-3 left-4 w-px h-3 bg-gray-400" />
                                        <div className="absolute -bottom-3 right-4 w-px h-3 bg-gray-400" />
                                        <div className="absolute top-4 -left-3 w-3 h-px bg-gray-400" />
                                        <div className="absolute top-4 -right-3 w-3 h-px bg-gray-400" />
                                        <div className="absolute bottom-4 -left-3 w-3 h-px bg-gray-400" />
                                        <div className="absolute bottom-4 -right-3 w-3 h-px bg-gray-400" />
                                    </>
                                )}
                                <div className="p-4 h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`, gridTemplateRows: `repeat(${cardsPerCol}, 1fr)`, gap: '4px' }}>
                                    {Array.from({ length: totalCards }, (_, i) => (
                                        <div key={i} className="bg-gradient-to-br from-blue-100 to-blue-200 rounded border border-blue-300/30 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-blue-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default PrintLayout;
