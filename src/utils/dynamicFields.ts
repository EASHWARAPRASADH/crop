export interface DynamicField {
  id: string;
  name: string;
  placeholder: string;
  description: string;
  category: 'student' | 'school' | 'system' | 'custom';
  dataType: 'text' | 'number' | 'date' | 'image' | 'qr';
  format?: {
    uppercase?: boolean;
    lowercase?: boolean;
    dateFormat?: string;
    prefix?: string;
    suffix?: string;
    maxLength?: number;
  };
  required?: boolean;
  defaultValue?: string;
}

export const PREDEFINED_FIELDS: DynamicField[] = [
  // Student Information
  {
    id: 'student_name',
    name: 'Student Name',
    placeholder: '{{student_name}}',
    description: 'Full name of the student',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true, maxLength: 50 },
    required: true,
  },
  {
    id: 'father_name',
    name: 'Father\'s Name',
    placeholder: '{{father_name}}',
    description: 'Father\'s full name',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true, maxLength: 50 },
  },
  {
    id: 'class',
    name: 'Class',
    placeholder: '{{class}}',
    description: 'Student\'s class/grade',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true },
    required: true,
  },
  {
    id: 'section',
    name: 'Section',
    placeholder: '{{section}}',
    description: 'Student\'s section',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true },
  },
  {
    id: 'roll_number',
    name: 'Roll Number',
    placeholder: '{{roll_number}}',
    description: 'Student\'s roll number',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true },
  },
  {
    id: 'student_id',
    name: 'Student ID',
    placeholder: '{{student_id}}',
    description: 'Unique student identifier',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true },
  },
  {
    id: 'date_of_birth',
    name: 'Date of Birth',
    placeholder: '{{date_of_birth}}',
    description: 'Student\'s date of birth',
    category: 'student',
    dataType: 'date',
    format: { dateFormat: 'DD/MM/YYYY' },
  },
  {
    id: 'address',
    name: 'Address',
    placeholder: '{{address}}',
    description: 'Student\'s address',
    category: 'student',
    dataType: 'text',
    format: { maxLength: 100 },
  },
  {
    id: 'gender',
    name: 'Gender',
    placeholder: '{{gender}}',
    description: 'Student\'s gender',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true },
  },
  {
    id: 'phone_number',
    name: 'Phone Number',
    placeholder: '{{phone_number}}',
    description: 'Student\'s phone number',
    category: 'student',
    dataType: 'text',
  },
  {
    id: 'blood_group',
    name: 'Blood Group',
    placeholder: '{{blood_group}}',
    description: 'Student\'s blood group',
    category: 'student',
    dataType: 'text',
    format: { uppercase: true },
  },
  {
    id: 'student_photo',
    name: 'Student Photo',
    placeholder: '{{student_photo}}',
    description: 'Student\'s photograph',
    category: 'student',
    dataType: 'image',
    required: true,
  },

  // School Information
  {
    id: 'school_name',
    name: 'School Name',
    placeholder: '{{school_name}}',
    description: 'Name of the school',
    category: 'school',
    dataType: 'text',
    format: { uppercase: true },
  },
  {
    id: 'school_logo',
    name: 'School Logo',
    placeholder: '{{school_logo}}',
    description: 'School\'s logo',
    category: 'school',
    dataType: 'image',
  },
  {
    id: 'school_address',
    name: 'School Address',
    placeholder: '{{school_address}}',
    description: 'School\'s address',
    category: 'school',
    dataType: 'text',
  },
  {
    id: 'school_phone',
    name: 'School Phone',
    placeholder: '{{school_phone}}',
    description: 'School\'s phone number',
    category: 'school',
    dataType: 'text',
  },
  {
    id: 'school_website',
    name: 'School Website',
    placeholder: '{{school_website}}',
    description: 'School\'s website URL',
    category: 'school',
    dataType: 'text',
  },

  // System Fields
  {
    id: 'card_number',
    name: 'Card Number',
    placeholder: '{{card_number}}',
    description: 'Unique card identifier',
    category: 'system',
    dataType: 'text',
    format: { prefix: 'CARD-', uppercase: true },
  },
  {
    id: 'issue_date',
    name: 'Issue Date',
    placeholder: '{{issue_date}}',
    description: 'Date when card was issued',
    category: 'system',
    dataType: 'date',
    format: { dateFormat: 'DD/MM/YYYY' },
  },
  {
    id: 'valid_until',
    name: 'Valid Until',
    placeholder: '{{valid_until}}',
    description: 'Card expiry date',
    category: 'system',
    dataType: 'date',
    format: { dateFormat: 'DD/MM/YYYY' },
  },
  {
    id: 'qr_code',
    name: 'QR Code',
    placeholder: '{{qr_code}}',
    description: 'QR code with student information',
    category: 'system',
    dataType: 'qr',
  },
];

export const getFieldById = (id: string): DynamicField | undefined => {
  return PREDEFINED_FIELDS.find(field => field.id === id);
};

export const getFieldsByCategory = (category: DynamicField['category']): DynamicField[] => {
  return PREDEFINED_FIELDS.filter(field => field.category === category);
};

export const formatFieldValue = (field: DynamicField, value: any): string => {
  if (!value && value !== 0) return field.defaultValue || '';

  let formattedValue = String(value);

  // Apply formatting
  if (field.format) {
    if (field.format.uppercase) {
      formattedValue = formattedValue.toUpperCase();
    }
    if (field.format.lowercase) {
      formattedValue = formattedValue.toLowerCase();
    }
    if (field.format.maxLength && formattedValue.length > field.format.maxLength) {
      formattedValue = formattedValue.substring(0, field.format.maxLength);
    }
    if (field.format.prefix) {
      formattedValue = field.format.prefix + formattedValue;
    }
    if (field.format.suffix) {
      formattedValue = formattedValue + field.format.suffix;
    }
  }

  return formattedValue;
};

export const validateFieldValue = (field: DynamicField, value: any): { valid: boolean; error?: string } => {
  if (field.required && (!value || value.toString().trim() === '')) {
    return { valid: false, error: `${field.name} is required` };
  }

  if (!value && value !== 0) return { valid: true };

  const stringValue = String(value);

  if (field.format?.maxLength && stringValue.length > field.format.maxLength) {
    return { valid: false, error: `${field.name} exceeds maximum length of ${field.format.maxLength}` };
  }

  if (field.dataType === 'number' && isNaN(Number(stringValue))) {
    return { valid: false, error: `${field.name} must be a valid number` };
  }

  if (field.dataType === 'date') {
    const date = new Date(stringValue);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `${field.name} must be a valid date` };
    }
  }

  return { valid: true };
};

export const extractFieldsFromText = (text: string): string[] => {
  const fieldRegex = /\{\{([^}]+)\}\}/g;
  const matches = text.match(fieldRegex);
  return matches ? matches.map(match => match.slice(2, -2)) : [];
};

export const replaceFieldsInText = (text: string, data: Record<string, any>): string => {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, fieldName) => {
    const field = getFieldById(fieldName);
    const value = data[fieldName];
    
    if (field && value !== undefined) {
      return formatFieldValue(field, value);
    }
    
    return match; // Keep original placeholder if no data or field found
  });
};

export const createCustomField = (
  name: string,
  placeholder: string,
  description: string,
  dataType: DynamicField['dataType'] = 'text',
  format?: DynamicField['format']
): DynamicField => {
  return {
    id: `custom_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name,
    placeholder: `{{${name.toLowerCase().replace(/\s+/g, '_')}}}`,
    description,
    category: 'custom',
    dataType,
    format,
  };
};
