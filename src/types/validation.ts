export interface PhotoMatch {
  filename: string;
  studentId?: string;
  studentName?: string;
  matched: boolean;
  originalFile: File;
  processedBlob: Blob;
  brightness?: number;
  contrast?: number;
  enhance?: number;
  temperature?: number;
  // Performance and memory leak fixes
  originalUrl?: string;
  processedUrl?: string;
}
