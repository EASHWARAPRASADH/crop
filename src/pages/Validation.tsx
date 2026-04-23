import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  RefreshCw, 
  Sparkles, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { projectService, studentService } from '@/services/dataService';
import { useOrder } from '@/hooks/useOrder';
import { toast } from 'sonner';
import PhotoProcessor from '@/components/validation/PhotoProcessor';
import { PhotoMatch } from '@/types/validation';

const Validation = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { currentOrder, loadOrderById, refreshOrder, isLoading: isOrderLoading } = useOrder();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
    
    const [recordCount, setRecordCount] = useState(0);
    const [imageCount, setImageCount] = useState(0);
    const [matchedCount, setMatchedCount] = useState(0);
    const [unlinkedCount, setUnlinkedCount] = useState(0);

    const handleStatsUpdate = (newStats: { total: number; valid: number; errors: number; warnings: number }) => {
        setRecordCount(newStats.total);
        setMatchedCount(newStats.valid);
        setUnlinkedCount(newStats.errors);
    };

    const processedOrderIdRef = useRef<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(!!orderId);

    useEffect(() => {
        if (orderId && (!currentOrder || currentOrder.id !== orderId) && processedOrderIdRef.current !== orderId) {
            processedOrderIdRef.current = orderId;
            setIsInitialLoading(true);
            loadOrderById(orderId).finally(() => {
                 setIsInitialLoading(false);
            });
        } else if (!orderId) {
            setIsInitialLoading(false);
        }
    }, [orderId, currentOrder, loadOrderById]);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentOrder) return;
            try {
                setLoading(true);
                console.log('Validation - Loading students for projectId:', currentOrder.projectId);
                // Use projectId from currentOrder (PHP backend uses 'id' and 'projectId' fields)
                const list = await studentService.getAll(currentOrder.projectId);
                console.log('Validation - Students loaded:', list);
                console.log('Validation - Students count:', list?.length || 0);
                setStudents(list || []);
                
                setRecordCount(list.length);
                const withPhotos = list.filter((s: any) => s.photoUrl).length;
                setMatchedCount(withPhotos);
                setUnlinkedCount(list.length - withPhotos);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [currentOrder]);

    const stats = {
        total: recordCount,
        valid: matchedCount,
        errors: unlinkedCount,
        warnings: Math.max(0, recordCount - matchedCount),
    };

    const [availableProjects, setAvailableProjects] = useState<any[]>([]);
    const [fetchingProjects, setFetchingProjects] = useState(false);

    useEffect(() => {
        if (!currentOrder && !orderId) {
            const fetchProjects = async () => {
                try {
                    setFetchingProjects(true);
                    const list = await projectService.getAll();
                    setAvailableProjects(list || []);
                } catch (err) {
                    console.error('Failed to fetch projects:', err);
                } finally {
                    setFetchingProjects(false);
                }
            };
            fetchProjects();
        }
    }, [currentOrder, orderId]);

    const handleProjectSelect = (proj: any) => {
        // Find if this project has an order, or just navigate with its ID
        // The loadOrderById function handles finding/creating an order for a project
        navigate(`/validation?orderId=${proj.id}`);
        // The useEffect will trigger loadOrderById(proj.id)
    };

    if (isOrderLoading || isInitialLoading || (loading && !students.length)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50/50">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Initializing Validation Engine...</p>
            </div>
        );
    }

    if (!currentOrder) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 p-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full"
                >
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 shadow-sm border border-amber-100">
                            <AlertTriangle size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Select a Project</h1>
                        <p className="text-gray-500 mt-2 font-medium">To use the Validation Hub, please choose a project from the list below.</p>
                    </div>

                    <div className="space-y-3">
                        {fetchingProjects ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : availableProjects.length > 0 ? (
                            availableProjects.map((proj) => (
                                <button
                                    key={proj.id}
                                    onClick={() => handleProjectSelect(proj)}
                                    className="w-full flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-3 h-12 rounded-full" 
                                            style={{ backgroundColor: proj.color || '#3B82F6' }}
                                        />
                                        <div className="text-left">
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{proj.name}</h3>
                                            <p className="text-sm text-gray-500 font-medium">{proj.organization || 'No Organization'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right mr-4 hidden sm:block">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{proj.status}</p>
                                            <p className="text-xs text-gray-500 font-medium">{proj.total_records || 0} Records</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ShieldCheck size={20} />
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-3xl">
                                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500 font-bold">No projects found</p>
                                <button 
                                    onClick={() => navigate('/projects')}
                                    className="mt-4 text-blue-600 font-bold hover:underline"
                                >
                                    Create your first project
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header section with Glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <ShieldCheck size={200} className="text-blue-600" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase tracking-tighter text-[10px] font-black">Production Ready</Badge>
                           <span className="text-xs text-gray-400 font-medium">• Fully Synchronized Hub</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Validation Hub</h1>
                        <p className="text-gray-500 mt-2 max-w-xl font-medium">
                            The central nerve center for your ID card project. Upload data, enhance photos with AI, and verify everything before generation.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => refreshOrder()}
                        className="group flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200/50 active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> 
                        Sync Workspace
                    </button>
                </div>


            </div>



            {/* Main Content Area */}
            <PhotoProcessor 
                students={students} 
                currentOrder={currentOrder} 
                photoMatches={photoMatches}
                setPhotoMatches={setPhotoMatches}
                onStatsUpdate={handleStatsUpdate}
                onPhotosProcessed={(matches) => {
                    setPhotoMatches(matches);
                }}
                onComplete={async () => {
                    await refreshOrder();
                }}
            />
        </div>
    );
};

const Badge = ({ children, className }: { children: React.ReactNode, className: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
        {children}
    </span>
);

export default Validation;
