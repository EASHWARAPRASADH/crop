import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Layers, Search, Heart, 
    Users, Eye, Copy, Plus, Star, Upload, FileText, Trash2, X,
    Palette, CreditCard, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IdCardCustomizerApp } from '@/components/IdCardCustomizer/IdCardCustomizerApp';
import { AdvancedPDFEditor } from '@/components/AdvancedPDFEditor/AdvancedPDFEditor';

// ─── CSS for 3D Card Flip ───
const flipStyles = `
    .perspective-1000 {
        perspective: 1000px;
    }
    .preserve-3d {
        transform-style: preserve-3d;
    }
    .backface-hidden {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }
`;

// ─── Single Reference Template ───
const REFERENCE_TEMPLATE = {
    id: 'tmpl-ref-1',
    name: 'Corporate ID Card Template',
    category: 'Corporate',
    style: 'Modern',
    orientation: 'Landscape',
    colors: ['#1E40AF', '#3B82F6'],
    rating: 5.0,
    isFavorite: false,
    isNew: true,
    isPremium: false,
};

// ─── Uploaded Template Type ───
interface UploadedTemplate {
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnail: string | null; // data URL for images, null for PDFs
    uploadedAt: string;
}

const STORAGE_KEY = 'gotek_uploaded_templates';

// ─── Mini ID Card Components ───
const MiniIDCardFront = ({ colors }: { colors: string[] }) => (
    <div 
        className="w-full h-full rounded-xl shadow-xl flex flex-col overflow-hidden bg-white border border-gray-100"
        style={{ aspectRatio: '1.58/1' }}
    >
        <div className="h-[25%] w-full flex items-center px-3 gap-2" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
            <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <div className="flex flex-col">
                <div className="w-16 h-1.5 bg-white/60 rounded-full" />
                <div className="w-10 h-1 bg-white/40 rounded-full mt-0.5" />
            </div>
        </div>
        <div className="flex-1 flex px-3 py-3 gap-3">
            <div className="w-[35%] aspect-square rounded-lg bg-gray-100 border-2 border-blue-100 flex items-center justify-center overflow-hidden">
                <Users className="w-8 h-8 text-gray-300" />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="space-y-1">
                    <div className="w-[80%] h-2.5 bg-gray-800 rounded-full" />
                    <div className="w-[60%] h-2 bg-blue-500 rounded-full" />
                </div>
                <div className="space-y-1 mt-1">
                    <div className="w-[40%] h-1.5 bg-gray-300 rounded-full" />
                    <div className="w-[50%] h-1.5 bg-gray-200 rounded-full" />
                </div>
            </div>
        </div>
        <div className="px-3 pb-2 flex justify-end">
            <div className="w-[50%] h-5 bg-gray-50 border border-gray-100 rounded flex items-center justify-center gap-0.5 overflow-hidden px-1">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-[1px] bg-gray-400" style={{ height: `${Math.random() * 8 + 6}px` }} />
                ))}
            </div>
        </div>
    </div>
);

const MiniIDCardBack = () => (
    <div 
        className="w-full h-full rounded-xl shadow-xl flex flex-col p-3 bg-white border border-gray-100"
        style={{ aspectRatio: '1.58/1' }}
    >
        <div className="w-[40%] h-2.5 bg-blue-700/80 rounded-full mb-3" />
        <div className="space-y-1.5 mb-4">
            <div className="w-full h-1 bg-gray-200 rounded-full" />
            <div className="w-full h-1 bg-gray-200 rounded-full" />
            <div className="w-[80%] h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="mt-auto flex justify-between items-end">
            <div className="space-y-1">
                <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
                <div className="w-20 h-1.5 bg-gray-200 rounded-full" />
            </div>
            <div className="flex flex-col items-center">
                <div className="w-20 h-[1px] bg-gray-400 mb-1" />
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-700" />
    </div>
);

// ─── Reference Template Card Component ───
const TemplateCard = ({ template }: { template: typeof REFERENCE_TEMPLATE }) => {
    const [fav, setFav] = useState(template.isFavorite);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
        >
            <div className="relative">
                <div
                    className="aspect-[4/5] flex items-center justify-center relative overflow-hidden p-6 perspective-1000"
                    style={{ background: `linear-gradient(135deg, ${template.colors[0]}15, ${template.colors[1]}25)` }}
                >
                    <motion.div
                        className="w-full relative preserve-3d"
                        animate={{ rotateY: isHovered ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        style={{ height: 'fit-content' }}
                    >
                        <div className="backface-hidden w-full">
                            <MiniIDCardFront colors={template.colors} />
                        </div>
                        <div className="absolute inset-0 backface-hidden w-full h-full" style={{ transform: 'rotateY(180deg)' }}>
                            <MiniIDCardBack />
                        </div>
                    </motion.div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-end justify-center pb-6 gap-2 opacity-0 group-hover:opacity-100 z-10">
                    <button className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <div className="absolute top-3 left-3 flex gap-1 z-20">
                    {template.isNew && <span className="text-[10px] px-2 py-1 rounded-md bg-blue-600 text-white font-bold shadow-md tracking-wider">NEW</span>}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setFav(!fav); }} 
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 hover:bg-white transition-all shadow-md z-20 group/fav"
                >
                    <Heart className={`w-4 h-4 ${fav ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover/fav:text-red-400'}`} />
                </button>
            </div>
            <div className="p-5 border-t border-gray-50 bg-white relative z-20">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-1">{template.name}</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-none font-medium px-2 h-5 text-[10px] uppercase tracking-tight">
                            {template.category}
                        </Badge>
                        <span className="text-[11px] text-gray-400">• {template.style}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs text-amber-700 font-bold">{template.rating.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Uploaded Template Card ───
const UploadedTemplateCard = ({ template, onDelete }: { template: UploadedTemplate; onDelete: (id: string) => void }) => {
    const isImage = template.fileType.startsWith('image/');
    const isPdf = template.fileType === 'application/pdf';
    const fileSizeKB = (template.fileSize / 1024).toFixed(0);
    const fileExt = template.fileName.split('.').pop()?.toUpperCase() || 'FILE';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group cursor-pointer relative"
        >
            {/* Preview */}
            <div className="relative">
                <div className="aspect-[4/5] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {isImage && template.thumbnail ? (
                        <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="w-full h-full object-contain p-3"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-red-500" />
                            </div>
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-bold">
                                {fileExt}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-end justify-center pb-6 gap-2 opacity-0 group-hover:opacity-100 z-10">
                    <button className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110" title="Preview">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                        className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Badge */}
                <div className="absolute top-3 left-3 flex gap-1 z-20">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-600 text-white font-bold shadow-md tracking-wider">UPLOADED</span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 border-t border-gray-50 bg-white relative z-20">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-1">{template.name}</h3>
                <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-none font-medium px-2 h-5 text-[10px] uppercase tracking-tight">
                        {fileExt}
                    </Badge>
                    <span className="text-[11px] text-gray-400">{fileSizeKB} KB</span>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Component ───
const TemplateLibrary = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedTemplates, setUploadedTemplates] = useState<UploadedTemplate[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setUploadedTemplates(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load uploaded templates:', e);
        }
    }, []);

    // Save to localStorage when templates change
    const saveTemplates = (templates: UploadedTemplate[]) => {
        setUploadedTemplates(templates);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        } catch (e) {
            console.error('Failed to save templates:', e);
            toast.error('Storage limit reached. Some templates may not persist.');
        }
    };

    // Handle bulk file upload
    const handleFilesUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newTemplates: UploadedTemplate[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isImage = file.type.startsWith('image/');
            let thumbnail: string | null = null;

            if (isImage) {
                thumbnail = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }

            // Strip extension from name for display
            const displayName = file.name.replace(/\.[^/.]+$/, '');

            newTemplates.push({
                id: `uploaded-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
                name: displayName,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                thumbnail,
                uploadedAt: new Date().toISOString(),
            });
        }

        const updated = [...uploadedTemplates, ...newTemplates];
        saveTemplates(updated);
        toast.success(`${newTemplates.length} template${newTemplates.length > 1 ? 's' : ''} uploaded successfully!`);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteTemplate = (id: string) => {
        const updated = uploadedTemplates.filter(t => t.id !== id);
        saveTemplates(updated);
        toast.success('Template removed');
    };

    const totalTemplates = 1 + uploadedTemplates.length; // 1 reference + uploaded

    return (
        <div className="space-y-6">
            <style>{flipStyles}</style>
            
            <Tabs defaultValue="library" className="w-full">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Template Studio</h1>
                        <p className="text-gray-500 mt-1">Design, manage and organize your ID card templates</p>
                    </div>
                    <TabsList className="bg-white/80 backdrop-blur-md border border-gray-100 p-1 rounded-xl shadow-sm inline-flex">
                    <TabsTrigger 
                        value="library" 
                        className="px-6 rounded-lg font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
                    >
                        Library
                    </TabsTrigger>
                    <TabsTrigger 
                        value="designer" 
                        className="px-6 rounded-lg font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
                    >
                        Custom Designer
                    </TabsTrigger>
                    <TabsTrigger 
                        value="advanced" 
                        className="px-6 rounded-lg font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300 gap-2"
                    >
                        <Sparkles size={14} className="text-amber-400" /> Advanced PDF Editor
                    </TabsTrigger>
                </TabsList>
                </div>

                <TabsContent value="library" className="space-y-6 mt-0">
                    {/* Library Controls */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Available Templates</h2>
                            <p className="text-sm text-gray-400">{totalTemplates} professional designs</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 cursor-pointer font-semibold text-sm">
                                <Upload className="w-4 h-4" />
                                Upload Templates
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,image/*,.json,.psd,.ai,.svg"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleFilesUpload(e.target.files)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Template grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
                        
                        {/* Create Custom Action Card */}
                        <div 
                            className="block outline-none rounded-xl group cursor-pointer"
                            onClick={() => {
                                // Programmatically switch to designer tab
                                const designerTrigger = document.querySelector('[value="designer"]') as HTMLElement;
                                designerTrigger?.click();
                            }}
                        >
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-blue-50/30 rounded-xl border-2 border-dashed border-blue-200 overflow-hidden hover:border-blue-400 hover:bg-blue-50/50 transition-all h-full flex items-center justify-center p-6 min-h-[400px]"
                            >
                                <div className="text-center">
                                    <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <Palette className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Create Custom</h3>
                                    <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Start from scratch using the Custom Designer</p>
                                    <div className="mt-6 flex items-center justify-center text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Open Designer &rarr;
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* The reference template */}
                        <TemplateCard template={REFERENCE_TEMPLATE} />

                        {/* Uploaded templates */}
                        {uploadedTemplates.map((tmpl) => (
                            <UploadedTemplateCard 
                                key={tmpl.id} 
                                template={tmpl} 
                                onDelete={handleDeleteTemplate} 
                            />
                        ))}

                    </div>
                </TabsContent>

                <TabsContent value="designer" className="mt-0">
                    <IdCardCustomizerApp />
                </TabsContent>

                <TabsContent value="advanced" className="mt-0 h-[calc(100vh-220px)]">
                    <AdvancedPDFEditor />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TemplateLibrary;
