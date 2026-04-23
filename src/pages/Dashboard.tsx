import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, FileText, CreditCard, AlertCircle, Clock,
    TrendingUp, FolderOpen, Layers, CheckCircle, Shield
} from 'lucide-react';
import { dashboardService, projectService } from '@/services/dataService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DashboardStats {
    totalProjects: number;
    totalRecords: number;
    totalAdmins: number;
    totalUsers: number;
    pendingProjects: number;
    processingProjects: number;
    completedProjects: number;
    totalOrganizations: number;
}

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        totalRecords: 0,
        totalAdmins: 0,
        totalUsers: 0,
        pendingProjects: 0,
        processingProjects: 0,
        completedProjects: 0,
        totalOrganizations: 0
    });
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isUltraAdmin = user?.role === 'ultra-super-admin';
    const isSuperAdmin = user?.role === 'super-admin';
    const isSubAdmin = user?.role === 'admin';
    const isUser = user?.role === 'user';
    const isAdmin = isUltraAdmin || isSuperAdmin;

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch all projects and global user counts in parallel
            const [allProjects, globalStats] = await Promise.all([
                projectService.getAll().catch(() => []),
                dashboardService.getStats().catch(() => ({ totalProjects: 0, totalAdmins: 0, totalUsers: 0 })),
            ]);

            // --- Role-Based Project Filtering ---
            let authorizedProjects = allProjects;

            if (isAdmin) {
                // Ultra Super Admin & Super Admin see ALL projects
                authorizedProjects = allProjects;
            } else if (isSubAdmin) {
                // Admin sees ONLY assigned projects
                authorizedProjects = allProjects.filter((p: any) =>
                    p.assignedTo === (user?.id || user?._id)
                );
            } else {
                // Standard user sees only their organization's projects
                const userOrg = (user?.organization || '').trim().toLowerCase();
                authorizedProjects = allProjects.filter((p: any) =>
                    (p.organization || '').trim().toLowerCase() === userOrg
                );
            }

            // --- Calculate Real Stats ---
            const totalRecords = authorizedProjects.reduce((sum: number, p: any) => sum + (p.total_records || 0), 0);
            const pendingProjects = authorizedProjects.filter((p: any) => p.status === 'draft').length;
            const processingProjects = authorizedProjects.filter((p: any) =>
                p.status === 'active' || p.status === 'generating' || p.status === 'validated'
            ).length;
            const completedProjects = authorizedProjects.filter((p: any) => p.status === 'completed').length;
            const uniqueOrgs = new Set(authorizedProjects.map((p: any) => p.organization).filter(Boolean));

            // Recent projects (sorted by creation date, most recent first)
            const sorted = [...authorizedProjects].sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setRecentProjects(sorted.slice(0, 5));

            setStats({
                totalProjects: authorizedProjects.length,
                totalRecords,
                totalAdmins: globalStats.totalAdmins || 0,
                totalUsers: globalStats.totalUsers || 0,
                pendingProjects,
                processingProjects,
                completedProjects,
                totalOrganizations: uniqueOrgs.size,
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load real-time stats');
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Projects',
            value: stats.totalProjects,
            icon: FolderOpen,
            color: 'from-blue-500 to-blue-600',
            show: true
        },
        {
            label: 'Total Records',
            value: stats.totalRecords,
            icon: FileText,
            color: 'from-cyan-500 to-cyan-600',
            show: false
        },
        {
            label: 'Pending',
            value: stats.pendingProjects,
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            show: true
        },
        {
            label: 'Processing',
            value: stats.processingProjects,
            icon: TrendingUp,
            color: 'from-orange-500 to-orange-600',
            show: true
        },
        {
            label: 'Completed',
            value: stats.completedProjects,
            icon: CheckCircle,
            color: 'from-emerald-500 to-emerald-600',
            show: true
        },
        {
            label: 'Organizations',
            value: stats.totalOrganizations,
            icon: Layers,
            color: 'from-pink-500 to-pink-600',
            show: !isUser
        },
        {
            label: 'Total Admins',
            value: stats.totalAdmins,
            icon: Shield,
            color: 'from-purple-500 to-purple-600',
            show: isAdmin
        },
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'from-indigo-500 to-indigo-600',
            show: isAdmin
        },
    ].filter(card => card.show);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold text-gray-900"
                    >
                        Welcome back, {user?.name || 'User'} 👋
                    </motion.h1>
                    <p className="text-gray-500 mt-1">
                        {isAdmin
                            ? 'Full system overview — all projects and users across the platform.'
                            : isSubAdmin
                                ? 'Overview of your assigned projects and records.'
                                : 'Here\'s an overview of your workspace.'}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {loading ? '—' : (card.value ?? 0).toLocaleString()}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Projects from Real Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Recent Projects
                        </h2>
                        <a href="/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</a>
                    </div>
                    <div className="space-y-4">
                        {recentProjects.length === 0 && !loading && (
                            <p className="text-sm text-gray-400 text-center py-6 italic">No projects found.</p>
                        )}
                        {recentProjects.map((project, i) => (
                            <div key={project.id || i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (project.color || '#3B82F6') + '15' }}>
                                    <FolderOpen className="w-4 h-4" style={{ color: project.color || '#3B82F6' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {project.organization}{project.branch ? ` · ${project.branch}` : ''} · {project.total_records || 0} records
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                    {new Date(project.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                    <h3 className="text-lg font-bold mb-2">Workspace Status</h3>
                    <p className="text-blue-100 text-sm mb-4">
                        {stats.completedProjects > 0
                            ? `${stats.completedProjects} project${stats.completedProjects > 1 ? 's' : ''} completed. ${stats.processingProjects} currently processing.`
                            : 'Your systems are running normally. No critical issues detected.'}
                    </p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-blue-200">Active Projects</span>
                            <span className="font-bold">{stats.processingProjects}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-200">Pending Review</span>
                            <span className="font-bold">{stats.pendingProjects}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-200">Total Records</span>
                            <span className="font-bold">{stats.totalRecords.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
