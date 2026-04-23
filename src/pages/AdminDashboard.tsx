import { useRequireAuth } from "@/hooks/useAuth";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Package, Layout, AlertCircle, Users, TrendingUp, Clock, CheckCircle, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardService, schoolService, orderService, studentService, templateService } from "@/services/dataService";
import { toast } from "sonner";

interface DashboardStats {
  totalSchools: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalStudents: number;
  totalTemplates: number;
  activeTemplates: number;
  newSchoolsThisMonth: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  totalSuperAdmins: number;
  totalAdmins: number;
  totalUsers: number;
}

const AdminDashboard = () => {
  const { user, isLoading } = useRequireAuth("/");
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalStudents: 0,
    totalTemplates: 0,
    activeTemplates: 0,
    newSchoolsThisMonth: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
    totalSuperAdmins: 0,
    totalAdmins: 0,
    totalUsers: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setIsLoadingStats(true);
      try {
        // Fetch projects and global system stats
        const [projects, globalStats, templates] = await Promise.all([
          projectService.getAll().catch(() => []),
          dashboardService.getStats().catch(() => ({ totalProjects: 0, totalSuperAdmins: 0, totalAdmins: 0, totalUsers: 0 })),
          templateService.getAll().catch(() => ({ templates: [] })),
        ]);

        const templatesList = Array.isArray(templates) ? templates : (templates?.templates || []);

        // --- Role-Based Filtering ---
        const isUltraAdmin = user?.role === 'ultra-super-admin';
        const isSuperAdmin = user?.role === 'super-admin';
        const isSubAdmin = user?.role === 'admin';

        let authorizedProjects = projects;
        if (isSubAdmin) {
          // Sub-admins only see stats for projects assigned to them
          authorizedProjects = projects.filter((p: any) => p.assignedTo === (user?.id || user?._id));
        } else if (!isUltraAdmin && !isSuperAdmin) {
          // Standard users see stats for their organization
          const userOrg = (user?.organization || '').trim().toLowerCase();
          authorizedProjects = projects.filter((p: any) => (p.organization || '').trim().toLowerCase() === userOrg);
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // --- Real-time Stat Calculation ---

        // 1. Schools: Count unique organizations in the authorized project list
        const uniqueOrgs = new Set(authorizedProjects.map((p: any) => p.organization).filter(Boolean));
        const schoolCount = uniqueOrgs.size;

        // 2. Status Progress
        const pendingProjects = authorizedProjects.filter((p: any) => p.status === 'draft').length;
        const processingProjects = authorizedProjects.filter((p: any) => p.status === 'active' || p.status === 'generating' || p.status === 'validated').length;
        const completedProjects = authorizedProjects.filter((p: any) => p.status === 'completed').length;

        // 3. Records: Sum total records across authorized projects
        const totalRecordsCount = authorizedProjects.reduce((sum: number, p: any) => sum + (p.total_records || 0), 0);

        // 4. Monthly Tracking
        const projectsThisMonth = authorizedProjects.filter((p: any) => new Date(p.created_at) >= monthStart).length;

        setStats({
          totalSchools: schoolCount,
          totalOrders: authorizedProjects.length,
          pendingOrders: pendingProjects,
          completedOrders: completedProjects,
          totalStudents: totalRecordsCount,
          totalTemplates: templatesList.length,
          activeTemplates: templatesList.filter((t: any) => t.isPublic).length,
          newSchoolsThisMonth: Array.from(uniqueOrgs).length, // For now, treat all reachable orgs as schools
          ordersThisMonth: projectsThisMonth,
          revenueThisMonth: projectsThisMonth * 50,
          totalSuperAdmins: globalStats.totalSuperAdmins || 0,
          totalAdmins: globalStats.totalAdmins || 0,
          totalUsers: globalStats.totalUsers || 0,
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading || isLoadingStats) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        {isUltraAdmin ? (
          /* Specialized 8-Tile Command Center for Ultra Super Admin */
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Layout className="w-6 h-6 text-blue-600" />
              Ultra Admin Command Center
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* 1. Total Projects */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-gray-900">{stats.totalOrders}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">Total Projects</CardDescription>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 2. Pending */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-yellow-600">{stats.pendingOrders}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">Pending</CardDescription>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 3. Processing */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-blue-600">
                        {stats.totalOrders - stats.pendingOrders - stats.completedOrders}
                      </CardTitle>
                      <CardDescription className="font-bold text-gray-500">Processing</CardDescription>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 4. Completed */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-green-600">{stats.completedOrders}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">Completed</CardDescription>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 5. Organization */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-gray-900">{stats.totalSchools}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">Organization</CardDescription>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <School className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 6. Total Super Admin */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-red-600">{stats.totalSuperAdmins}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">Total Super Admin</CardDescription>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl">
                      <Shield className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 7. Admin */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-purple-600">{stats.totalAdmins}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">Admin</CardDescription>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 8. User */}
              <Card className="card-gradient shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold text-indigo-600">{stats.totalUsers}</CardTitle>
                      <CardDescription className="font-bold text-gray-500">User</CardDescription>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl">
                      <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        ) : (
          /* Standard Layout for other administrative levels */
          <div className="space-y-10">
            {/* System Overview Section */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-blue-600" />
                System Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-gray-900">{stats.totalSchools}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Total Schools</CardDescription>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <School className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-purple-600">{stats.totalAdmins}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Total Admins</CardDescription>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Total Users</CardDescription>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Project Statistics Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Project Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-gray-900">{stats.totalOrders}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Total Projects</CardDescription>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Pending</CardDescription>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-xl">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-blue-600">{stats.totalOrders - stats.pendingOrders - stats.completedOrders}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Processing</CardDescription>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-gradient shadow-sm border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-green-600">{stats.completedOrders}</CardTitle>
                        <CardDescription className="font-medium text-gray-500">Completed</CardDescription>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-orange-600">{stats.newSchoolsThisMonth}</CardTitle>
                  <CardDescription>New Schools This Month</CardDescription>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600/60" />
              </div>
            </CardHeader>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-indigo-600">{stats.ordersThisMonth}</CardTitle>
                  <CardDescription>Orders This Month</CardDescription>
                </div>
                <Package className="w-8 h-8 text-indigo-600/60" />
              </div>
            </CardHeader>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-emerald-600">₹{stats.revenueThisMonth}</CardTitle>
                  <CardDescription>Revenue This Month</CardDescription>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600/60" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/schools'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <School className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Schools</CardTitle>
                  <CardDescription>Manage schools</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/orders'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Orders</CardTitle>
                  <CardDescription>View all orders</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>


          <Card
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/advertisements'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advertisements</CardTitle>
                  <CardDescription>Manage ads</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
