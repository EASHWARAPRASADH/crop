import api from './api';

export const projectService = {
    async getAll() {
        const res = await api.get('/projects');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/projects/${id}`);
        return res.data;
    },
    async create(data: any) {
        const res = await api.post('/projects', data);
        return res.data;
    },
    async update(id: string, data: any) {
        const res = await api.put(`/projects/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/projects/${id}`);
        return res.data;
    },
    async getIssues(id: string) {
        const res = await api.get(`/projects/${id}/issues`);
        return res.data;
    },
};

export const recordService = {
    async getAll(projectId?: string) {
        const url = projectId ? `/records?projectId=${projectId}` : '/records';
        const res = await api.get(url);
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/records/${id}`);
        return res.data;
    },
    async create(data: any) {
        const res = await api.post('/records', data);
        return res.data;
    },
    async update(id: string, data: any) {
        const res = await api.put(`/records/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/records/${id}`);
        return res.data;
    },
    async bulkCreate(projectId: string, records: any[]) {
        const res = await api.post('/records/bulk', { projectId, records });
        return res.data;
    },
};

export const studentService = recordService;

export const orderService = {
    async getAll() {
        const res = await api.get('/orders');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/orders/${id}`);
        return res.data;
    },
    async create(data: any) {
        const res = await api.post('/orders', data);
        return res.data;
    },
    async updateStatus(id: string, status: string) {
        const res = await api.put(`/orders/${id}/status`, { status });
        return res.data;
    },
};

export const uploadService = {
    async uploadExcel(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'excel');
        const res = await api.post('/upload/excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data; // { path: '...' }
    },
    async uploadZip(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'zip');
        const res = await api.post('/upload/zip', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    async uploadPhoto(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'photo');
        const res = await api.post('/upload/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data; // { url: '...', path: '...' }
    }
};

export const dashboardService = {
    async getStats() {
        const res = await api.get('/dashboard/stats');
        return res.data;
    },
};

export const schoolService = {
    async getAll() {
        const res = await api.get('/schools');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/schools/${id}`);
        return res.data;
    },
    async create(data: any) {
        const res = await api.post('/schools', data);
        return res.data;
    },
    async update(id: string, data: any) {
        const res = await api.put(`/schools/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/schools/${id}`);
        return res.data;
    },
    async toggleVerify(id: string) {
        const res = await api.put(`/schools/${id}/verify`);
        return res.data;
    }
};

export const templateService = {
    async getAll() {
        const res = await api.get('/templates');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/templates/${id}`);
        return res.data;
    },
    async create(data: any) {
        const res = await api.post('/templates', data);
        return res.data;
    },
    async update(id: string, data: any) {
        const res = await api.put(`/templates/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/templates/${id}`);
        return res.data;
    }
};

export const advertisementService = {
    async getAll() {
        const res = await api.get('/advertisements');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/advertisements/${id}`);
        return res.data;
    },
    async create(data: any) {
        const res = await api.post('/advertisements', data);
        return res.data;
    },
    async update(id: string, data: any) {
        const res = await api.put(`/advertisements/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/advertisements/${id}`);
        return res.data;
    }
};
