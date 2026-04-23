import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, FileText, Type, Upload, CheckCircle,
    Printer, Download, Clock, Settings, ChevronLeft, ChevronRight,
    FolderOpen, CreditCard, Layers, ChevronDown, FileArchive, Image, FileSpreadsheet, Palette, FileEdit

} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

import { useAuth } from '@/hooks/useAuth';

type NavItem = { label: string; icon: any; path: string; allowedRoles: string[] };
type NavGroup = { title: string; items: NavItem[]; isCollapsible?: boolean; id?: string };

const ALL_ROLES = ['ultra-super-admin', 'super-admin', 'admin', 'user'];
const EDITOR_ROLES = ['ultra-super-admin', 'super-admin', 'admin'];
const ADMIN_ROLES = ['ultra-super-admin', 'super-admin', 'admin'];

const navigation: NavGroup[] = [
    {
        title: 'MAIN',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', allowedRoles: ALL_ROLES },
            { label: 'Projects', icon: FolderOpen, path: '/projects', allowedRoles: ALL_ROLES }
        ]
    },
    {
        title: 'DATA',
        id: 'data',
        isCollapsible: true,
        items: [
            { label: 'Validation Hub', icon: CheckCircle, path: '/validation', allowedRoles: EDITOR_ROLES },
            { label: 'Customizer', icon: Palette, path: '/customizer', allowedRoles: EDITOR_ROLES }
        ]
    },
    {
        title: 'OPERATIONS',
        items: [
            { label: 'Request tracking', icon: Clock, path: '/tracking', allowedRoles: ADMIN_ROLES }
        ]
    },
    {
        title: 'SYSTEM',
        items: [
            { label: 'Settings', icon: Settings, path: '/settings', allowedRoles: ALL_ROLES }
        ]
    }
];

const SidebarItem = ({ item, collapsed, isActive, isNested = false }: { item: NavItem, collapsed: boolean, isActive: boolean, isNested?: boolean }) => (
    <Link
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={cn(
            'flex items-center gap-3 py-2.5 rounded-lg transition-all duration-150 group relative',
            collapsed ? 'px-3 justify-center' : (isNested ? 'px-4 pl-10' : 'px-3'),
            isActive
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm ring-1 ring-blue-100/50'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
    >
        <item.icon className={cn(
            'w-5 h-5 flex-shrink-0 transition-all duration-200',
            isActive ? 'text-blue-600 drop-shadow-sm scale-110' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'
        )} />
        <AnimatePresence>
            {!collapsed && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="text-sm whitespace-nowrap"
                >
                    {item.label}
                </motion.span>
            )}
        </AnimatePresence>
        {collapsed && (
            <div className="absolute left-full ml-3 px-2 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all shadow-xl shadow-gray-900/10 -translate-x-2 group-hover:translate-x-0">
                {item.label}
            </div>
        )}
    </Link>
);

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
    const { user } = useAuth();
    const role = user?.role || 'user';

    // Filter navigation based on role
    const filteredNavigation = navigation.map(group => ({
        ...group,
        items: group.items.filter(item => item.allowedRoles.includes(role))
    })).filter(group => group.items.length > 0);

    // Check if any data children are active on load
    const dataGroup = filteredNavigation.find(g => g.id === 'data');
    const isDataChildActive = dataGroup?.items.some(i => location.pathname.startsWith(i.path)) || false;
    const [dataExpanded, setDataExpanded] = useState(isDataChildActive);

    // Auto-collapse dropdowns if sidebar itself collapses
    useEffect(() => {
        if (collapsed) {
            setDataExpanded(false);
        }
    }, [collapsed]);


    useEffect(() => {
        if (!collapsed && isDataChildActive) setDataExpanded(true);
    }, [location.pathname, collapsed, isDataChildActive]);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 76 : 260 }}
            transition={{ duration: 0.25, type: 'spring', bounce: 0, damping: 25 }}
            className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 flex flex-col shadow-sm"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100/80 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1"
                            >
                                <h1 className="text-[17px] font-bold text-gray-900 tracking-tight whitespace-nowrap uppercase">GOTEK</h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
                {filteredNavigation.map((group, groupIdx) => {
                    const isGroupActive = group.items.some(item => location.pathname.startsWith(item.path));

                    return (
                        <div key={group.title} className="space-y-1">
                            {!collapsed && (
                                <motion.h3
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                                >
                                    {group.title}
                                </motion.h3>
                            )}

                            {collapsed && groupIdx > 0 && (
                                <div className="h-px bg-gray-100 mx-3 my-2" />
                            )}

                            {group.isCollapsible && !collapsed ? (() => {
                                const expanded = dataExpanded;
                                const setExpanded = setDataExpanded;
                                const groupIcon = Upload;
                                const groupLabel = 'Data';

                                return (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                                                isGroupActive && !expanded ? "bg-blue-50/50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 text-sm font-medium">
                                                {(() => { const Icon = groupIcon; return <Icon className={cn("w-5 h-5", isGroupActive && !expanded ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />; })()}
                                                {groupLabel}
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 text-gray-400 transition-transform duration-200",
                                                expanded ? "rotate-180" : ""
                                            )} />
                                        </button>

                                        <AnimatePresence>
                                            {expanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    className="overflow-hidden space-y-1"
                                                >
                                                    <div className="pt-1 pb-2 relative">
                                                        <div className="absolute left-[21px] top-0 bottom-4 w-px bg-gray-200" />
                                                        {group.items.map(item => (
                                                            <SidebarItem
                                                                key={item.path}
                                                                item={item}
                                                                collapsed={collapsed}
                                                                isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                                                                isNested={true}
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })() : (
                                <div className="space-y-1">
                                    {group.items.map(item => (
                                        <SidebarItem
                                            key={item.path}
                                            item={item}
                                            collapsed={collapsed}
                                            isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 hover:shadow-sm transition-all bg-white border border-transparent"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
