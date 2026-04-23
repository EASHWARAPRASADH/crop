import { Bell, Search, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface TopBarProps {
    sidebarCollapsed: boolean;
}

const TopBar = ({ sidebarCollapsed }: TopBarProps) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header
            className="fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6 transition-all duration-200"
            style={{ left: sidebarCollapsed ? 72 : 260 }}
        >
            {/* Left side empty for spacing */}
            <div className="flex-1"></div>
            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Bell className="w-5 h-5" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No new notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer last:border-0">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                                        n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{n.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100 bg-gray-50/50">
                                    View All Notifications
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('-', ' ') || 'Guest'}</p>
                        </div>
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <UserIcon className="w-4 h-4" />
                                    Profile & Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
