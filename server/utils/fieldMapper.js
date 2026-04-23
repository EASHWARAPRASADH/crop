/**
 * Smart Auto-Mapping Engine
 * Automatically detects column types from Excel headers
 */

const FIELD_PATTERNS = {
    name: ['name', 'student name', 'full name', 'employee name', 'first name', 'student_name'],
    id_number: ['id', 'id number', 'register no', 'register number', 'roll no', 'roll number', 'emp id', 'employee id', 'registration', 'enrollment', 'id_number'],
    department: ['department', 'dept', 'division', 'branch', 'faculty'],
    class: ['class', 'section', 'grade', 'year', 'semester', 'batch'],
    designation: ['designation', 'position', 'title', 'role', 'job title'],
    blood_group: ['blood group', 'blood_group', 'blood type', 'bg'],
    photo: ['photo', 'image', 'picture', 'photo_url', 'avatar', 'photograph'],
    email: ['email', 'e-mail', 'mail', 'email address'],
    phone: ['phone', 'mobile', 'contact', 'tel', 'telephone', 'phone number'],
    address: ['address', 'addr', 'residence', 'location'],
    dob: ['dob', 'date of birth', 'birth date', 'birthday'],
    valid_until: ['valid until', 'valid_until', 'expiry', 'expiry date', 'validity'],
    issue_date: ['issue date', 'issue_date', 'issued on', 'date of issue'],
};

export function autoMapColumns(headers) {
    const mapping = {};

    headers.forEach((header) => {
        const normalized = header.toLowerCase().trim();
        for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
            if (patterns.some((p) => normalized.includes(p) || p.includes(normalized))) {
                mapping[header] = field;
                break;
            }
        }
    });

    return mapping;
}

export function detectColumnType(header, sampleValues) {
    const normalized = header.toLowerCase().trim();

    // Check pattern match first
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
        if (patterns.some((p) => normalized.includes(p) || p.includes(normalized))) {
            return field;
        }
    }

    // Heuristic: check sample values
    if (sampleValues && sampleValues.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;

        if (sampleValues.every((v) => emailRegex.test(v))) return 'email';
        if (sampleValues.every((v) => phoneRegex.test(v))) return 'phone';
    }

    return null;
}
