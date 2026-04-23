import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Shield, Palette, UserPlus, Trash2, ShieldCheck, Mail, Lock, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService, User as UserType } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const isUltraAdmin = user?.role === 'ultra-super-admin';
    const isAdmin = user?.role === 'super-admin' || isUltraAdmin;
    const isSubAdmin = user?.role === 'admin';
    const canManageAccess = isAdmin || isUltraAdmin;
    const [newAdmin, setNewAdmin] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'admin', 
        organization: isAdmin ? '' : (user?.organization || 'GOTEK') 
    });

    useEffect(() => {
        if (isAdmin) {
            fetchAdmins();
        }
    }, [user, isAdmin]);

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const users = await authService.getUsers();
            // Filter users based on current role's permissions
            let allowedRolesToView = ['ultra-super-admin', 'super-admin', 'admin', 'user'];
            
            if (user?.role === 'super-admin') {
                allowedRolesToView = ['admin', 'user'];
            } else if (user?.role === 'admin') {
                allowedRolesToView = ['user'];
            }
            
            const filteredUsers = users.filter((u: any) => allowedRolesToView.includes(u.role));
            setAdminUsers(filteredUsers);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetNewAdminForm = () => {
        setNewAdmin({ 
            name: '', 
            email: '', 
            password: '', 
            role: 'admin', 
            organization: isAdmin ? '' : (user?.organization || 'GOTEK') 
        });
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await authService.createAdmin({
                name: newAdmin.name,
                email: newAdmin.email,
                password: newAdmin.password,
                role: newAdmin.role,
                organization: newAdmin.organization || user?.organization || 'GOTEK'
            });
            toast.success('Access created successfully');
            setShowAddDialog(false);
            resetNewAdminForm();
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create access');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to revoke access for ${name}?`)) return;
        
        try {
            await authService.deleteUser(id);
            toast.success(`Access for ${name} revoked.`);
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to revoke access');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        
        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setIsUpdatingProfile(true);
        try {
            await authService.updateProfile(user!.id || user!._id, { name });
            updateUser({ name });
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get("newPassword") as string;
        
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        try {
            await authService.updatePassword(user!.id || user!._id, newPassword);
            toast.success("Password updated successfully!");
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        }
    };

    const getRoleLabel = (role: string) => {
        if (role === 'ultra-super-admin') return 'Ultra Super admin';
        if (role === 'super-admin') return 'Super admin';
        return role.replace('-', ' ');
    };


    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account, roles, and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                        </div>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleUpdateProfile}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                <Input name="name" defaultValue={user?.name || ''} className="rounded-xl border-gray-200" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                                <Input defaultValue={user?.email || ''} readOnly className="rounded-xl border-gray-200 bg-gray-50 text-gray-500" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Organization</label>
                                <Input defaultValue={user?.organization || ''} readOnly className="rounded-xl border-gray-200 bg-gray-50 text-gray-500" />
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <Button type="submit" disabled={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-md shadow-blue-500/10">
                                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-rose-50 rounded-lg">
                                <Lock className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Secure your account with a new password</p>
                            </div>
                        </div>
                        <form className="max-w-md space-y-4" onSubmit={handleUpdatePassword}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                                <Input name="newPassword" type="password" placeholder="••••••••" className="rounded-xl border-gray-200" required />
                            </div>
                            <Button type="submit" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl px-8">
                                Update Password
                            </Button>
                        </form>
                    </motion.div>
                </div>

                {/* Role info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Account Status</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Access Level</p>
                                <p className="text-sm font-bold text-blue-600 capitalize mt-0.5">{user?.role || 'user'}</p>
                            </div>
                            <ShieldCheck className="w-8 h-8 text-blue-200" />
                        </div>

                        <div className="space-y-3 px-1 mt-2">
                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-500">Template Editing</span>
                                {isAdmin || isSubAdmin ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none shadow-none">Enabled</Badge>
                                ) : (
                                    <span className="font-bold text-gray-400">Restricted</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-500">Card Generation</span>
                                {isAdmin || isSubAdmin ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none shadow-none">Active</Badge>
                                ) : (
                                    <span className="font-bold text-gray-400">Restricted</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-500">User Management</span>
                                <span className="font-bold text-gray-400">
                                    {canManageAccess ? 'Full Access' : 'Restricted'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Super Admin / Admin Section: User Management */}
                {canManageAccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Admin Panel Access</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Manage administrative roles and dashboard access</p>
                                </div>
                            </div>

                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-md shadow-emerald-500/10">
                                        <UserPlus className="w-4 h-4" />
                                        Create New Access
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[450px] rounded-3xl p-8">
                                    <form onSubmit={handleCreateAdmin}>
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold">New Access Request</DialogTitle>
                                            <DialogDescription className="text-sm font-medium pt-1">
                                                Grant system access privileges to a new user.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6 py-8">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input id="name" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="John Doe" className="pl-11 rounded-xl" required />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input id="email" type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="admin@gotek.com" className="pl-11 rounded-xl" required />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="role" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Select Role</Label>
                                                <Select value={newAdmin.role} onValueChange={val => setNewAdmin({ ...newAdmin, role: val })}>
                                                    <SelectTrigger id="role" className="rounded-xl border-gray-200">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {isUltraAdmin && <SelectItem value="super-admin">Super Admin</SelectItem>}
                                                        <SelectItem value="admin">Admin (Editor)</SelectItem>
                                                        <SelectItem value="user">Standard User</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Organization</Label>
                                                {isAdmin ? (
                                                    <Input 
                                                        value={newAdmin.organization} 
                                                        onChange={e => setNewAdmin({...newAdmin, organization: e.target.value})} 
                                                        placeholder="Organization name" 
                                                        className="rounded-xl border-gray-200" 
                                                        required
                                                    />
                                                ) : (
                                                    <Input 
                                                        value={user?.organization || 'GOTEK'} 
                                                        readOnly 
                                                        className="rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" 
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="pass" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Temporary Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input id="pass" type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="••••••••" className="pl-11 rounded-xl" required />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" onClick={() => {
                                                setShowAddDialog(false);
                                                resetNewAdminForm();
                                            }} variant="outline" className="rounded-xl flex-1">Cancel</Button>
                                            <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 min-w-[140px]">
                                                {isCreating ? 'Creating...' : 'Create Account'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-gray-100">
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12 pl-8">Admin User</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12">Role</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12">Organization</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12">Status</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12 text-right pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching admin data...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : adminUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center">
                                                <p className="text-sm font-medium text-gray-400">No administrative users found.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        adminUsers.map((admin) => (
                                            <TableRow key={admin.id || admin._id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{admin.name}</span>
                                                        <span className="text-xs text-gray-500">{admin.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-md border-none font-bold text-[10px] uppercase px-2 py-0.5",
                                                        admin.role === 'ultra-super-admin' ? "bg-amber-50 text-amber-700" : 
                                                        admin.role === 'super-admin' ? "bg-blue-50 text-blue-700" : 
                                                        admin.role === 'admin' ? "bg-slate-50 text-slate-700" :
                                                        "bg-emerald-50 text-emerald-700"
                                                    )}>
                                                        {getRoleLabel(admin.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium text-gray-600">{admin.organization}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        <span className="text-xs font-bold text-emerald-600">Active</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    {(isUltraAdmin && admin.role !== 'ultra-super-admin') || 
                                                     (isAdmin && (admin.role === 'admin' || admin.role === 'user')) ? (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            onClick={() => handleDeleteUser(admin.id || admin._id, admin.name)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    ) : null}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
export default Settings;