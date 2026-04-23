import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Plus, Search, Download, Upload, Trash2, CheckCircle,
    XCircle, AlertTriangle, ChevronDown, Mail, Phone, Eye, Edit2
} from 'lucide-react';
import { recordService } from '@/services/dataService';
import { toast } from 'sonner';

const STATUSES = ['All', 'Valid', 'Invalid', 'Pending'];

const STATUS_ICON: Record<string, any> = {
    valid: { icon: CheckCircle, color: 'text-emerald-500' },
    invalid: { icon: XCircle, color: 'text-red-500' },
    pending: { icon: AlertTriangle, color: 'text-amber-500' },
};

const Records = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const perPage = 15;

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await recordService.getAll();
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching records:', error);
            toast.error('Failed to load records');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let result = [...records];
        if (statusFilter !== 'All') result = result.filter(r => r.status === statusFilter.toLowerCase());
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r => r.name.toLowerCase().includes(q) || r.id.includes(q) || (r.email && r.email.toLowerCase().includes(q)));
        }
        return result;
    }, [statusFilter, search, records]);

    const paginated = filtered.slice(0, page * perPage);

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
    };

    const toggleAll = () => {
        if (selected.size === paginated.length) setSelected(new Set());
        else setSelected(new Set(paginated.map(r => r.id)));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Records</h1>
                    <p className="text-gray-500 mt-1">Manage {records.length} student / employee records.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <Upload className="w-4 h-4" /> Import
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4" /> Add Record
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: records.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Valid', value: records.filter(r => r.status === 'valid').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Invalid', value: records.filter(r => r.status === 'invalid').length, icon: XCircle, color: 'text-red-600 bg-red-50' },
                    { label: 'Pending', value: records.filter(r => r.status === 'pending').length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, ID, email..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                {selected.size > 0 && (
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100">
                        <Trash2 className="w-4 h-4" /> Delete ({selected.size})
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-sm text-gray-500">Loading records...</p>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                        <p className="text-gray-500 mt-1">Import your first batch of records to get started.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left p-4 w-10">
                                    <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Department</th>
                                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Class</th>
                                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Photo</th>
                                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(record => {
                                const si = STATUS_ICON[record.status] || STATUS_ICON.pending;
                                return (
                                    <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <input type="checkbox" checked={selected.has(record.id)} onChange={() => toggleSelect(record.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-mono">{record.external_id || record.id.slice(0, 8)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                    {record.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{record.name}</p>
                                                    <p className="text-xs text-gray-400">{record.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 hidden md:table-cell">{record.department}</td>
                                        <td className="p-4 text-sm text-gray-600 hidden lg:table-cell">{record.class}</td>
                                        <td className="p-4">
                                            {record.has_photo ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✓ Yes</span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">✕ Missing</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <si.icon className={`w-4 h-4 ${si.color}`} />
                                                <span className="text-xs font-medium capitalize text-gray-600">{record.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600"><Edit2 className="w-4 h-4" /></button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {paginated.length < filtered.length && (
                <div className="text-center">
                    <button onClick={() => setPage(p => p + 1)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                        Load More ({filtered.length - paginated.length} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default Records;
