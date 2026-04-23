import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    FolderOpen, Plus, Search, MoreVertical, Users, CheckCircle,
    AlertCircle, Clock, Layers, CreditCard, Calendar, Trash2, Pencil,
    ChevronRight, XCircle, AlertTriangle, X, UserPlus, Shield, Settings, FileText,
    Building2, Printer, Package, Play, Check, Loader2, Download, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrder } from '@/hooks/useOrder';
import { useConfiguratorStore } from '@/store/useConfiguratorStore';
import { projectService } from '@/services/dataService';
import { authService } from '@/services/authService';
import { Project, User, RecordIssue } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
    validated: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Validated' },
    generating: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Generating' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
};

const PIPELINE_STAGES = [
    { key: 'data_collected', label: 'Data', icon: FileText },
    { key: 'processing', label: 'Processing', icon: Play },
    { key: 'id_card_generated', label: 'Generated', icon: Package },
    { key: 'validation', label: 'Validation', icon: ShieldCheck },
    { key: 'printing', label: 'Printing', icon: Printer },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
];

const PipelineStatus = ({ project }: { project: Project }) => {
    let completedStages: string[] = [];
    try {
        completedStages = JSON.parse(project.completed_stages || '[]');
    } catch (e) {
        console.warn('Failed to parse completed_stages', e);
        completedStages = [];
    }

    return (
        <div className="flex items-center gap-3 mt-3">
            {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = completedStages.includes(stage.key);
                return (
                    <div key={stage.key} className="flex items-center gap-1.5" title={stage.label}>
                        <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-300",
                            isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-gray-50 border-gray-200 text-transparent"
                        )}>
                            <Check className="w-3 h-3" strokeWidth={4} />
                        </div>
                        <span className={cn("text-[10px] font-bold", isCompleted ? "text-emerald-600" : "text-gray-400")}>
                            {stage.label}
                        </span>
                        {idx < PIPELINE_STAGES.length - 1 && <div className="w-2 h-px bg-gray-100" />}
                    </div>
                )
            })}
        </div>
    );
};

const Projects = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'ultra-super-admin';
    const isAdmin = user?.role === 'super-admin' || isSuperAdmin;
    const isSubAdmin = user?.role === 'admin';
    const isUser = user?.role === 'user';
    const canManageProjects = isAdmin || isSuperAdmin;

    const [projects, setProjects] = useState<Project[]>([]);
    const [subAdmins, setSubAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [activeProjectForAssign, setActiveProjectForAssign] = useState<string | null>(null);
    const [newProject, setNewProject] = useState({ name: '', org: '', template: 'School', branch: '' });
    const [customTemplate, setCustomTemplate] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const navigate = useNavigate();
    const { setOrder } = useOrder();
    const setField = useConfiguratorStore(state => state.setField);

    useEffect(() => {
        fetchProjects();
        if (canManageProjects) fetchSubAdmins();
    }, []);

    const fetchSubAdmins = async () => {
        try {
            const users = await authService.getUsers();
            setSubAdmins(users.filter(u => u.role === 'admin'));
        } catch (error) {
            console.error('Failed to load admins', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getAll();
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        try {
            const projectData = {
                ...newProject,
                organization: isAdmin ? newProject.org : (user?.organization || 'GOTEK'),
                branch: newProject.branch,
                status: 'draft',
                current_stage: 'data_collected',
                completed_stages: '[]',
                total_records: 0,
                valid_records: 0,
                invalid_records: 0,
                missing_photos: 0,
                color: '#3B82F6',
                created_by: user?.email
            };
            const created = await projectService.create(projectData);
            setProjects([created, ...projects]);
            setIsNewProjectModalOpen(false);
            setNewProject({ name: '', org: '', template: 'School', branch: '' });
            setCustomTemplate('');
            toast.success('Project created successfully');
        } catch (error) {
            console.error('Failed to create project:', error);
            toast.error('Failed to create project');
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            setIsDeleting(true);
            const projectId = projectToDelete.id || projectToDelete._id;
            await projectService.delete(projectId);
            setProjects(projects.filter(p => (p.id !== projectId && p._id !== projectId)));
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
            toast.success('Project deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete project:', error);
            const msg = error.response?.data?.message || 'Failed to delete project';
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAssignProject = async (projectId: string, subAdminId: string, subAdminName: string) => {
        try {
            await projectService.update(projectId, { assignedTo: subAdminId, assignedToName: subAdminName });
            setProjects(projects.map(p => {
                if (p.id === projectId || p._id === projectId) {
                    return { ...p, assignedTo: subAdminId, assignedToName: subAdminName } as Project;
                }
                return p;
            }));
            toast.success(`Project assigned to ${subAdminName}`);
            setIsAssignModalOpen(false);
        } catch (error: any) {
            console.error('Failed to assign project', error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message;
            toast.error(`Failed to assign project: ${msg}`);
        }
    };

    const handleSelectProject = async (project: any) => {
        try {
            setField('idCard.selected', project.id);
            setOrder({
                id: `order-${project.id}`,
                projectId: project.id,
                templateId: project.template,
                status: project.status || 'draft',
                totalCards: project.total_records || 0,
                generatedCards: 0,
                createdAt: project.created_at,
                updatedAt: new Date().toISOString()
            });
            
            toast.success(`Project "${project.name}" selected`);
            navigate(`/validation?orderId=${project.id}`);
        } catch (error: any) {
            console.error('Error selecting project:', error);
            toast.error('Failed to select project');
        }
    };

    const filtered = projects.filter(p => {
        // Role-based visibility logic
        let hasAccess = false;
        
        if (isAdmin) {
            // Super Admin and Ultra Super Admin see everything
            hasAccess = true;
        } else if (isSubAdmin) {
            // Admins (Sub-Admins) see ONLY projects specifically assigned to them
            hasAccess = (p.assignedTo === user?.id || p.assignedTo === user?._id);
        } else {
            // Standard users see projects from their organization
            const userOrg = (user?.organization || '').trim().toLowerCase();
            const projectOrg = (p.organization || '').trim().toLowerCase();
            hasAccess = (userOrg === projectOrg);
        }

        if (!hasAccess) return false;

        // Apply search filter
        const pName = (p.name || '').toLowerCase();
        const pOrg = (p.organization || '').toLowerCase();
        const pBranch = (p.branch || '').toLowerCase();
        const searchTerms = search.toLowerCase();
        
        return pName.includes(searchTerms) || 
               pOrg.includes(searchTerms) || 
               pBranch.includes(searchTerms);
    });

    const groupedProjects = filtered.reduce((acc, p) => {
        const org = p.organization || 'Unassigned';
        if (!acc[org]) acc[org] = [];
        acc[org].push(p);
        return acc;
    }, {} as Record<string, Project[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500 mt-1">
                        {isSubAdmin ? 'Projects assigned to you' : 'Manage your ID card projects and template mappings.'}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsNewProjectModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                        <Plus className="w-4 h-4" /> New Project
                    </button>
                )}
            </div>


            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or organizations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
            </div>

            <div className="space-y-8">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-sm text-gray-500">Loading projects...</p>
                    </div>
                ) : Object.keys(groupedProjects).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
                        <p className="text-gray-500 mt-1">Create your first project to get started.</p>
                    </div>
                ) : Object.entries(groupedProjects).map(([org, orgProjects]) => (
                    <div key={org} className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <div className="flex flex-col">
                                <h2 className="text-lg font-bold text-gray-900">{org}</h2>
                            </div>
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{orgProjects.length}</span>
                        </div>
                        <div className="space-y-3">
                            {orgProjects.map((project, i) => {
                                const status = STATUS_STYLES[project.status] || STATUS_STYLES.draft;
                                const totalRecords = project.total_records || 0;
                                const validRecords = project.valid_records || 0;
                                const progress = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0;
                                
                                return (
                                    <motion.div key={project.id || project._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (project.color || '#3B82F6') + '15' }}>
                                                    <FolderOpen className="w-6 h-6" style={{ color: project.color || '#3B82F6' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-bold">
                                                            {project.organization}
                                                        </span>
                                                        {project.branch && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-bold">
                                                                {project.branch}
                                                            </span>
                                                        )}
                                                        {project.assignedToName && !isUser && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-full font-bold flex items-center gap-1">
                                                                <Shield className="w-3 h-3" /> Assigned To: {project.assignedToName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <PipelineStatus project={project} />
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Created {new Date(project.created_at).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(project.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    {project.pdf_url && (
                                                        <a href={`/api/projects/${project.id}/view-pdf?token=${localStorage.getItem('gotek_token')}`} target="_blank" rel="noreferrer"
                                                            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95">
                                                            <Download className="w-4 h-4" />
                                                            View Final PDF
                                                        </a>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => { setActiveProjectForAssign(project.id); setIsAssignModalOpen(true); }}
                                                            className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 border border-blue-100 transition-colors shadow-sm bg-white"
                                                            title="Assign Project">
                                                            <UserPlus className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => { setProjectToDelete(project); setIsDeleteModalOpen(true); }}
                                                            className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 border border-red-100 transition-colors shadow-sm bg-white"
                                                            title="Delete Project">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {isNewProjectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewProjectModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
                                <button onClick={() => setIsNewProjectModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Name</label>
                                    <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Student IDs 2026" 
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization</label>
                                    {isAdmin ? (
                                        <input type="text" value={newProject.org} onChange={e => setNewProject({...newProject, org: e.target.value})} placeholder="Enter Organization..." 
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm" />
                                    ) : (
                                        <input type="text" value={user?.organization || 'GOTEK'} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed" />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                                    <input type="text" value={newProject.branch} onChange={e => setNewProject({...newProject, branch: e.target.value})} placeholder="e.g. Main Campus" 
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button onClick={() => setIsNewProjectModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleCreateProject} disabled={!newProject.name || (!isAdmin ? false : !newProject.org)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200">Create Project</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Assign Project</h2>
                                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-gray-500 mb-6 font-medium">Select an Admin to handle the editor portal for this project.</p>
                            
                            <div className="space-y-2">
                                {subAdmins.map((subAdmin) => {
                                    const currentProject = projects.find(p => p.id === activeProjectForAssign || p._id === activeProjectForAssign);
                                    const isSelected = currentProject?.assignedTo === subAdmin._id || currentProject?.assignedTo === subAdmin.id;
                                    return (
                                        <div key={subAdmin._id || subAdmin.id} onClick={() => activeProjectForAssign && handleAssignProject(activeProjectForAssign, subAdmin._id || subAdmin.id || '', subAdmin.name)}
                                            className={cn("p-4 border-2 rounded-xl flex items-center justify-between group cursor-pointer transition-all", isSelected ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100/80")}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm", isSelected ? "bg-blue-600 text-white" : "bg-white text-gray-400 group-hover:text-gray-600")}>
                                                    {subAdmin.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={cn("text-xs font-extrabold", isSelected ? "text-blue-900" : "text-gray-900")}>{subAdmin.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{subAdmin.email}</p>
                                                </div>
                                            </div>
                                            {isSelected ? <CheckCircle className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </div>
                                    );
                                })}
                                {subAdmins.length === 0 && <p className="text-sm text-gray-500 text-center py-4 italic">No admins found.</p>}
                            </div>
                            <div className="mt-6"><button onClick={() => setIsAssignModalOpen(false)} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors transition-all active:scale-95">Done</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden">
                            <div className="flex items-center gap-3 text-red-600 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                                <h2 className="text-xl font-bold">Delete Project?</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-6 font-medium">Are you sure you want to delete <span className="font-bold text-gray-900">"{projectToDelete?.name}"</span>? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={handleDeleteProject} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Projects;
