import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            <TopBar sidebarCollapsed={sidebarCollapsed} />
            <main
                className="pt-16 min-h-screen transition-all duration-200"
                style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
            >
                <div className="p-6">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    }>
                        <Outlet />
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
