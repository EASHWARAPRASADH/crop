export type UserRole = 'ultra-super-admin' | 'super-admin' | 'admin' | 'user';

export interface User {
    id?: string;
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    organization: string;
    isActive: boolean;
    token?: string;
    created_at?: string;
}

export interface Project {
    id: string;
    _id?: string;
    name: string;
    organization: string;
    template: string;
    status: 'draft' | 'active' | 'validated' | 'generating' | 'completed';
    total_records: number;
    valid_records: number;
    invalid_records: number;
    missing_photos?: number;
    assignedTo?: string;
    assignedToName?: string;
    color?: string;
    created_at: string;
    current_stage?: string;
    completed_stages?: string; // JSON string
    pdf_url?: string;
    branch?: string;
}

export interface RecordIssue {
    id: string;
    recordId: string;
    record: string;
    message: string;
    severity: 'error' | 'warning';
    fixable: boolean;
}

export interface ProjectRecord {
    id: string;
    _id?: string;
    project_id: string;
    name: string;
    email?: string;
    status: 'valid' | 'invalid' | 'pending';
    photo_url?: string;
    data: Record<string, any>;
    created_at: string;
}
