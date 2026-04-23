import api from './api';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: string;
    organization?: string;
}

export interface User {
    id?: string;
    _id: string;
    name: string;
    email: string;
    role: 'ultra-super-admin' | 'super-admin' | 'admin' | 'user';
    organization: string;
    isActive: boolean;
    token?: string;
}

export const authService = {
    async login(data: LoginData): Promise<User> {
        const res = await api.post('/auth/login', data);
        const user = res.data;
        localStorage.setItem('gotek_token', user.token);
        localStorage.setItem('gotek_user', JSON.stringify(user));
        return user;
    },

    async register(data: RegisterData): Promise<User> {
        const res = await api.post('/auth/register', data);
        const user = res.data;
        localStorage.setItem('gotek_token', user.token);
        localStorage.setItem('gotek_user', JSON.stringify(user));
        return user;
    },

    async createAdmin(data: RegisterData): Promise<User> {
        const res = await api.post('/auth/register', data);
        return res.data;
    },

    async getMe(): Promise<User> {
        const res = await api.get('/auth/me');
        return res.data;
    },

    async getUsers(): Promise<User[]> {
        const res = await api.get('/auth/users');
        return res.data;
    },

    async updateUserRole(id: string, role: string): Promise<User> {
        const res = await api.put(`/auth/users/${id}/role`, { role });
        return res.data;
    },

    async updatePassword(id: string, password: string): Promise<any> {
        const res = await api.put(`/auth/users/${id}/password`, { password });
        return res.data;
    },

    async updateProfile(id: string, profileData: any): Promise<any> {
        const res = await api.put(`/auth/users/${id}`, profileData);
        return res.data;
    },

    async deleteUser(id: string): Promise<any> {
        const res = await api.delete(`/auth/users/${id}`);
        return res.data;
    },

    logout() {
        localStorage.removeItem('gotek_token');
        localStorage.removeItem('gotek_user');
    },

    getStoredUser(): User | null {
        try {
            const stored = localStorage.getItem('gotek_user');
            if (!stored || stored === 'undefined') return null;
            return JSON.parse(stored);
        } catch {
            return null;
        }
    },

    getToken(): string | null {
        return localStorage.getItem('gotek_token');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },
};
