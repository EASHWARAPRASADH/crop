import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, CheckCircle, FileText, Download, 
    Printer, ArrowRight, ChevronRight, Package, Upload, 
    Check, Play, Loader2, Search, ShieldCheck
} from 'lucide-react';
import { projectService, uploadService } from '@/services/dataService';
import { Project } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAGES = [
    { key: 'data_collected', label: 'Data Collected', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'processing', label: 'Processing', icon: Play, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'id_card_generated', label: 'ID Card Generated', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'validation', label: 'Validation', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'printing', label: 'Printing', icon: Printer, color: 'text-gray-600', bg: 'bg-gray-50' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
];

const getStageIndex = (stageKey?: string) => {
    const idx = STAGES.findIndex(s => s.key === stageKey);
    return idx === -1 ? 0 : idx;
};

/** Safely parse completed_stages — never throws */
const safeParseStages = (raw?: string | null): string[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const RequestTracking = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getAll();
            setProjects(data || []);
        } catch (error) {
            console.error('Failed to fetch projects', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const toggleStage = async (project: Project, stageKey: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        const completed = safeParseStages(project.completed_stages);
        const stageIdx = STAGES.findIndex(s => s.key === stageKey);
        const isCurrentlyDone = completed.includes(stageKey);

        // 1. Check for forward sequence (completing a stage)
        if (!isCurrentlyDone) {
            // Must have all previous stages done
            for (let i = 0; i < stageIdx; i++) {
                if (!completed.includes(STAGES[i].key)) {
                    toast.error(`Please complete "${STAGES[i].label}" first`);
                    return;
                }
            }
        } 
        // 2. Check for backward sequence (undoing a stage)
        else {
            // Cannot undo if any later stage is done
            for (let i = stageIdx + 1; i < STAGES.length; i++) {
                if (completed.includes(STAGES[i].key)) {
                    toast.error(`Please undo "${STAGES[i].label}" first`);
                    return;
                }
            }
        }

        // Special case: ID Card Generated stage requires PDF upload to mark as done
        if (stageKey === 'id_card_generated' && !isCurrentlyDone && !project.pdf_url) {
            toast.error('Please upload a PDF to complete the "ID Card Generated" stage');
            setExpandedId(project.id || project._id || null);
            return;
        }

        try {
            let newCompleted: string[];
            if (isCurrentlyDone) {
                newCompleted = completed.filter(s => s !== stageKey);
            } else {
                newCompleted = [...completed, stageKey];
            }

            const firstUncompletedIdx = STAGES.findIndex(s => !newCompleted.includes(s.key));
            const nextStage = firstUncompletedIdx !== -1 ? STAGES[firstUncompletedIdx].key : STAGES[STAGES.length - 1].key;

            await projectService.update(project.id || project._id || '', {
                current_stage: nextStage,
                completed_stages: JSON.stringify(newCompleted)
            });

            toast.success('Stage updated');
            fetchProjects();
        } catch (error: any) {
            console.error('Failed to update stage', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
            toast.error(`Update failed: ${errorMsg}`);
        }
    };

    const handleFileUpload = async (project: Project, file: File) => {
        const completed = safeParseStages(project.completed_stages);
        
        // Ensure Processing is done before allowing upload
        const processingIdx = STAGES.findIndex(s => s.key === 'processing');
        for (let i = 0; i <= processingIdx; i++) {
            if (!completed.includes(STAGES[i].key)) {
                toast.error(`Please complete "${STAGES[i].label}" before uploading`);
                return;
            }
        }

        try {
            setUploadingId(project.id || project._id || '');
            const res = await uploadService.uploadPhoto(file);
            const pdfUrl = res.url;

            if (!completed.includes('id_card_generated')) {
                completed.push('id_card_generated');
            }

            await projectService.update(project.id || project._id || '', {
                current_stage: 'validation',
                completed_stages: JSON.stringify(completed),
                pdf_url: pdfUrl
            });

            toast.success('PDF uploaded and project moved to Validation');
            fetchProjects();
        } catch (error: any) {
            console.error('Upload failed', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Upload failed';
            toast.error(errorMsg);
        } finally {
            setUploadingId(null);
        }
    };

    const filteredProjects = projects.filter(p => 
        (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (p.organization || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request Tracking</h1>
                    <p className="text-gray-500 mt-1">Manage and track the lifecycle of project requests.</p>
                </div>
            </div>

            {/* Pipeline Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Pipeline Overview
                </h2>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                    {STAGES.map((stage, i) => {
                        const count = projects.filter(p => p.current_stage === stage.key).length;
                        return (
                            <div key={stage.key} className="flex items-center gap-1 flex-1 min-w-[120px]">
                                <div className="flex-1 text-center">
                                    <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center ${count > 0 ? stage.bg + ' ' + stage.color : 'bg-gray-50 text-gray-400'}`}>
                                        <stage.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-gray-600 mt-2">{stage.label}</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none mt-1">{count}</p>
                                </div>
                                {i < STAGES.length - 1 && <ArrowRight className="w-4 h-4 text-gray-200 flex-shrink-0 mt-[-16px]" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or organizations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                        <p className="mt-4 text-gray-500 font-medium">Loading project requests...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 italic text-gray-400">
                        No projects found matching your search.
                    </div>
                ) : (
                    filteredProjects.map((project, i) => {
                        const currentStageIdx = getStageIndex(project.current_stage);
                        const isExpanded = expandedId === (project.id || project._id);
                        const completedStages = safeParseStages(project.completed_stages);

                        return (
                            <motion.div key={project.id || project._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-xl border border-gray-200 transition-all duration-200 overflow-hidden hover:shadow-md">
                                <div className="p-4 cursor-pointer flex items-center gap-4" onClick={() => setExpandedId(isExpanded ? null : (project.id || project._id || null))}>
                                    
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Package className="w-6 h-6 text-gray-400" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{project.name}</h3>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{(project.id || project._id || '').slice(-6)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {STAGES.map((stage, idx) => {
                                                const isCompleted = completedStages.includes(stage.key);
                                                const canToggle = isCompleted || (idx === 0 || completedStages.includes(STAGES[idx-1].key));
                                                
                                                return (
                                                    <div key={stage.key} className="flex items-center gap-1">
                                                        <button 
                                                            onClick={(e) => toggleStage(project, stage.key, e)}
                                                            disabled={!canToggle}
                                                            className={cn(
                                                                "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all duration-200",
                                                                isCompleted ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-200 hover:border-blue-400",
                                                                !canToggle && "opacity-30 cursor-not-allowed"
                                                            )}>
                                                            <Check className={cn("w-3.5 h-3.5", !isCompleted && "opacity-0")} strokeWidth={4} />
                                                        </button>
                                                        {idx < STAGES.length - 1 && <div className={cn("w-2 h-0.5", isCompleted ? "bg-blue-100" : "bg-gray-100")} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                            STAGES[currentStageIdx].bg, STAGES[currentStageIdx].color
                                        )}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {STAGES[currentStageIdx].label}
                                        </div>
                                        <ChevronRight className={cn("w-5 h-5 text-gray-400 transition-transform", isExpanded && "rotate-90")} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-gray-100 bg-gray-50/50 p-5">
                                        <div className="flex items-start justify-between gap-8">
                                            <div className="flex-1 space-y-6">
                                                <div className="relative">
                                                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-100" />
                                                    <div className="space-y-8 relative">
                                                        {STAGES.map((stage) => {
                                                            const isDone = completedStages.includes(stage.key);
                                                            const isCurrent = project.current_stage === stage.key;

                                                            return (
                                                                <div key={stage.key} className="flex items-center gap-4 group">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                                                                        isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : 
                                                                        isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-100" : 
                                                                        "bg-white border-2 border-gray-200 text-gray-400",
                                                                        !isDone && !isCurrent && "opacity-40"
                                                                    )}>
                                                                        {isDone ? <Check className="w-4 h-4" /> : <stage.icon className="w-4 h-4" />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <p className={cn("text-xs font-bold", isDone ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-gray-500")}>
                                                                                    {stage.label}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400">
                                                                                    {isDone ? 'Completed' : isCurrent ? 'Active step' : 'Pending'}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {stage.key === 'id_card_generated' && (
                                                                                    <label className={cn(
                                                                                        "flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-[10px] font-bold text-purple-600 hover:bg-purple-50 transition-all shadow-sm",
                                                                                        (isDone || isCurrent) ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                                                                                    )}>
                                                                                        <Upload className="w-3 h-3" />
                                                                                        {uploadingId === (project.id || project._id) ? 'Uploading...' : 'Upload PDF'}
                                                                                        <input type="file" accept=".pdf" className="hidden" 
                                                                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(project, e.target.files[0])} 
                                                                                            disabled={!!uploadingId || (!isDone && !isCurrent)} />
                                                                                    </label>
                                                                                )}
                                                                                <button onClick={(e) => toggleStage(project, stage.key, e)}
                                                                                    disabled={!isDone && !isCurrent}
                                                                                    className={cn(
                                                                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md",
                                                                                        isDone ? "bg-emerald-100 text-emerald-700 shadow-emerald-50" : 
                                                                                        isCurrent ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100" :
                                                                                        "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                                    )}>
                                                                                    <Check className="w-3 h-3" /> {isDone ? 'Undo' : 'Mark Done'}
                                                                                </button>
                                                                                {isDone && stage.key === 'id_card_generated' && project.pdf_url && (
                                                                                    <a href={`/api/projects/${project.id || project._id}/view-pdf?token=${localStorage.getItem('gotek_token')}`} target="_blank" rel="noreferrer"
                                                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-all">
                                                                                        <Download className="w-3 h-3" /> View Final PDF
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-64 space-y-4">
                                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Project Assets</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 group hover:bg-blue-50 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-[11px] font-bold text-gray-700 truncate">Records Data</p>
                                                                <p className="text-[9px] text-gray-400">XLSX • {project.total_records || 0} rows</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 group hover:bg-blue-50 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-[11px] font-bold text-gray-700 truncate">Source Photos</p>
                                                                <p className="text-[9px] text-gray-400">ZIP • High Res</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RequestTracking;
