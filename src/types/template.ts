// Template system types for UniCard Solutions

export interface TemplateDynamicField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'image' | 'qr';
  placeholder?: string;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'dynamic_field';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  
  // Text-specific properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // Image-specific properties
  imageUrl?: string;
  imageFit?: 'fill' | 'contain' | 'cover';
  
  // Shape-specific properties
  shapeType?: 'rectangle' | 'circle' | 'line';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // Dynamic field properties
  fieldName?: string;
  dynamicFieldType?: 'student_name' | 'father_name' | 'dob' | 'roll_no' | 'student_id' | 'class' | 'section' | 'address' | 'phone' | 'blood_group' | 'photo' | 'qr_code' | 'school_name' | 'school_logo';
}

export interface TemplateCanvas {
  width: number; // in pixels (at 300 DPI)
  height: number; // in pixels (at 300 DPI)
  widthInches: number; // 3.37 for standard ID card
  heightInches: number; // 2.13 for standard ID card
  dpi: number; // 300 for print quality
  orientation: 'landscape' | 'portrait';
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface TemplateData {
  id?: string;
  name: string;
  description?: string;
  canvas: TemplateCanvas;
  elements: TemplateElement[];
  thumbnailUrl?: string;
  isPublic: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentData {
  id: string;
  student_name: string;
  father_name?: string;
  date_of_birth?: string;
  roll_number?: string;
  student_id?: string;
  class: string;
  section?: string;
  address?: string;
  gender?: string;
  phone_number?: string;
  blood_group?: string;
  photo_url?: string;
}

export interface SchoolData {
  id: string;
  school_name: string;
  logo_url?: string;
  contact_person: string;
  address: string;
  area?: string;
  pin_code?: string;
  whatsapp_number: string;
}

export interface OrderData {
  id: string;
  school_id: string;
  template_id?: string;
  status: 'draft' | 'submitted' | 'in_design' | 'printed' | 'delivered' | 'completed';
  total_students: number;
  notes?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CardGenerationOptions {
  template: TemplateData;
  students: StudentData[];
  school: SchoolData;
  includeQR: boolean;
  outputFormat: 'pdf' | 'png';
  resolution: number; // DPI
}

export const DYNAMIC_FIELDS: TemplateDynamicField[] = [
  { id: 'student_name', name: 'student_name', label: 'Student Name', type: 'text' },
  { id: 'father_name', name: 'father_name', label: "Father's Name", type: 'text' },
  { id: 'dob', name: 'date_of_birth', label: 'Date of Birth', type: 'text' },
  { id: 'roll_no', name: 'roll_number', label: 'Roll Number', type: 'text' },
  { id: 'student_id', name: 'student_id', label: 'Student ID', type: 'text' },
  { id: 'class', name: 'class', label: 'Class', type: 'text' },
  { id: 'section', name: 'section', label: 'Section', type: 'text' },
  { id: 'address', name: 'address', label: 'Address', type: 'text' },
  { id: 'phone', name: 'phone_number', label: 'Phone Number', type: 'text' },
  { id: 'blood_group', name: 'blood_group', label: 'Blood Group', type: 'text' },
  { id: 'photo', name: 'photo_url', label: 'Student Photo', type: 'image' },
  { id: 'qr_code', name: 'qr_code', label: 'QR Code', type: 'qr' },
  { id: 'school_name', name: 'school_name', label: 'School Name', type: 'text' },
  { id: 'school_logo', name: 'school_logo', label: 'School Logo', type: 'image' },
];

export const ID_CARD_PRESETS = {
  standard: {
    widthInches: 3.37,
    heightInches: 2.13,
    dpi: 300,
  },
  large: {
    widthInches: 4,
    heightInches: 3,
    dpi: 300,
  },
  custom: {
    widthInches: 3.37,
    heightInches: 2.13,
    dpi: 300,
  },
};

