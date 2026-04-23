import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Play, Loader2, Settings, CheckCircle, Users, Layers, FileText, Download } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { jsPDF } from 'jspdf';
import { Canvas, StaticCanvas } from 'fabric';
import { toast } from 'sonner';

const GenerateCards = () => {
    const store = useEditorStore();
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (store.importedRecords.length === 0) {
            toast.error('No records found. Please import Excel data first.');
            return;
        }

        const template = store.templates.find(t => t.id === store.activeTemplateId) || store.templates[0];
        if (!template && !store.undoStack.length) {
            toast.error('No template found. Please design a card first.');
            return;
        }

        setGenerating(true);
        setProgress(0);
        setCompleted(false);

        try {
            const records = store.importedRecords;
            const total = records.length;
            
            // Get the template JSON. If no saved template, use the current undo stack (latest JSON)
            const templateJSON = template ? JSON.parse(template.canvasJSON) : JSON.parse(store.undoStack[store.undoStack.length - 1]);
            
            // Calculate PDF dimensions based on canvas (approximate 300 DPI conversion if needed, but here we use points)
            // CR80 is 3.375 x 2.125 inches. At 72 DPI that's 243 x 153.
            // Our canvas is 1014x642 (approx 300 DPI scale).
            const isHorizontal = store.orientation === 'horizontal';
            const pdf = new jsPDF({
                orientation: isHorizontal ? 'landscape' : 'portrait',
                unit: 'px',
                format: [store.canvasWidth, store.canvasHeight]
            });

            // Off-screen canvas for rendering
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = store.canvasWidth;
            offscreenCanvas.height = store.canvasHeight;
            
            const staticCanvas = new StaticCanvas(offscreenCanvas, {
                width: store.canvasWidth,
                height: store.canvasHeight
            });

            for (let i = 0; i < total; i++) {
                const record = records[i];
                
                // Clear and reload template for each record to avoid accumulation
                await staticCanvas.loadFromJSON(templateJSON);
                
                // Process dynamic fields
                const objects = staticCanvas.getObjects();
                objects.forEach((obj: any) => {
                    if (obj.dataField && record[obj.dataField]) {
                        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                            obj.set({ text: String(record[obj.dataField]) });
                        }
                        // Add image support here later if needed
                    }
                });

                staticCanvas.renderAll();
                
                const imgData = staticCanvas.toDataURL({
                    format: 'png',
                    quality: 1,
                    multiplier: 1
                });

                if (i > 0) pdf.addPage([store.canvasWidth, store.canvasHeight], isHorizontal ? 'landscape' : 'portrait');
                pdf.addImage(imgData, 'PNG', 0, 0, store.canvasWidth, store.canvasHeight);
                
                setProgress(Math.round(((i + 1) / total) * 100));
                
                // Artificial delay to prevent UI freeze and allow progress to show
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
            }

            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setCompleted(true);
            toast.success('PDF generated successfully!');
        } catch (error) {
            console.error('Generation failed:', error);
            toast.error('Failed to generate cards.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Bulk_Cards_${new Date().getTime()}.pdf`;
            link.click();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Generate Cards</h1>
                <p className="text-gray-500 mt-1">Bulk generate ID cards from validated records.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" /> Generation Settings
                        </h2>
                        <div className="space-y-4 text-sm text-gray-600">
                           <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                               <Layers className="text-blue-500" />
                               <div>
                                   <p className="font-semibold text-blue-900">Current Template</p>
                                   <p className="text-xs text-blue-700">{store.templateName || 'Active Design'}</p>
                               </div>
                           </div>
                           <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
                               <Users className="text-emerald-500" />
                               <div>
                                   <p className="font-semibold text-emerald-900">Data Records</p>
                                   <p className="text-xs text-emerald-700">{store.importedRecords.length} records ready for processing</p>
                               </div>
                           </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 p-6">
                        {!generating && !completed && (
                            <button onClick={handleGenerate}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-base font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200">
                                <Play className="w-5 h-5" /> Start Real Generation
                            </button>
                        )}
                        {generating && (
                            <div className="text-center space-y-4">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                                <p className="text-sm font-medium text-gray-700">Generating PDF... High quality render takes time.</p>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-blue-600 rounded-full" animate={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-xs text-gray-500">{progress}% complete • Processing record {Math.round((progress/100) * store.importedRecords.length)} / {store.importedRecords.length}</p>
                            </div>
                        )}
                        {completed && (
                            <div className="text-center space-y-3">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                                <p className="text-lg font-semibold text-gray-900">Generation Complete!</p>
                                <p className="text-sm text-gray-500">{store.importedRecords.length} ID cards generated successfully.</p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-md">
                                        <Download className="w-4 h-4" /> Download PDF
                                    </button>
                                    <button onClick={() => setCompleted(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                                        Restart
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="space-y-4">
                    {[
                        { label: 'Ready to Generate', value: store.importedRecords.length.toLocaleString(), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Active Template', value: store.templateName, icon: Layers, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Orientation', value: store.orientation, icon: FileText, color: 'text-violet-600 bg-violet-50' },
                        { label: 'Canvas Size', value: `${store.canvasWidth}x${store.canvasHeight}`, icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 capitalize">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GenerateCards;
