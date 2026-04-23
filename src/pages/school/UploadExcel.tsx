import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useOrder } from "@/hooks/useOrder";
import { recordService, uploadService } from "@/services/dataService";
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, FileSpreadsheet, FileArchive, Image as ImageIcon } from "lucide-react";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useEditorStore } from "@/store/useEditorStore";

interface StudentData {
  student_name: string;
  father_name?: string;
  class: string;
  section?: string;
  roll_number?: string;
  student_id?: string;
  date_of_birth?: string;
  address?: string;
  gender?: string;
  phone_number?: string;
  blood_group?: string;
  photo?: Blob;
  photo_name?: string;
}

interface ColumnMapping {
  [key: string]: string;
}

interface ProcessedPhoto {
  name: string;
  blob: Blob;
  originalName: string;
  previewUrl: string;
}

export const UploadExcel = ({ embedded = false, onFileChange }: { 
  embedded?: boolean; 
  onFileChange?: (hasFile: boolean, hasImages: boolean, recordCount: number, imageCount: number) => void;
}) => {
  const navigate = useNavigate();
  const { currentOrder, refreshOrder } = useOrder();
  const isOrderLocked = currentOrder && currentOrder.status !== 'draft';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mappedData, setMappedData] = useState<StudentData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [processedPhotos, setProcessedPhotos] = useState<ProcessedPhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoProcessingProgress, setPhotoProcessingProgress] = useState(0);
  const [photoMatchingEnabled, setPhotoMatchingEnabled] = useState(false);

  // Verification result type for photo-to-excel matching
  interface VerificationRow {
    photoName: string;
    photoId: string; // numbers extracted from photo name
    matchedName: string; // student name from matched Excel row
    matched: boolean;
    photoBlob?: Blob;
  }

  const [verificationResults, setVerificationResults] = useState<VerificationRow[]>([]);

  const requiredFields = ['student_name', 'class'];
  const optionalFields = ['father_name', 'section', 'roll_number', 'student_id', 'date_of_birth', 'address', 'gender', 'phone_number', 'blood_group'];

  if (isOrderLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SchoolHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Order is locked. You cannot upload students after submission.
              </p>
              <Button onClick={() => navigate('/school/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
        selectedFile.type !== 'application/vnd.ms-excel') {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const clearAll = () => {
    setFile(null);
    setZipFile(null);
    setExcelData([]);
    setRawHeaders([]);
    setColumnMapping({});
    setMappedData([]);
    setErrors([]);
    processedPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setProcessedPhotos([]);
    setVerificationResults([]);
    setPhotoMatchingEnabled(false);
    toast.success("Cleared all data");
  };

  const handleZipFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/zip' && selectedFile.type !== 'application/x-zip-compressed') {
        toast.error('Please select a valid ZIP file');
        return;
      }
      setZipFile(selectedFile);
      await processZipFile(selectedFile);
    }
  };

  const processZipFile = async (file: File) => {
    setIsProcessingPhotos(true);
    setPhotoProcessingProgress(0);
    setErrors([]);

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const imageFiles: { name: string; blob: Blob }[] = [];

      // Extract image files from ZIP
      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (!zipEntry.dir && filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          const blob = await zipEntry.async('blob');
          imageFiles.push({ name: filename, blob });
        }
      }

      if (imageFiles.length === 0) {
        setErrors(['No image files found in the ZIP archive']);
        setIsProcessingPhotos(false);
        return;
      }

      toast.info(`Found ${imageFiles.length} photos. Extracting files...`);

      // Process files without AI processing - just extract as-is
      const processed: ProcessedPhoto[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const { name, blob } = imageFiles[i];
        processed.push({
          name: name.replace(/\.[^/.]+$/, ''), // Remove extension
          blob: blob,
          originalName: name,
          previewUrl: URL.createObjectURL(blob)
        });
        setPhotoProcessingProgress(((i + 1) / imageFiles.length) * 100);
      }

      // Cleanup old preview URLs if any
      processedPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));

      setProcessedPhotos(prev => [...prev, ...processed]);
      onFileChange?.(!!file, true, excelData.length, processed.length);
      toast.success(`Successfully extracted ${processed.length} photos!`);
    } catch (error) {
      console.error('Error processing ZIP file. Please check the file format.');
      setErrors(['Failed to process ZIP file. Please check the file format.']);
      toast.error('Failed to process ZIP file');
    } finally {
      setIsProcessingPhotos(false);
    }
  };


  const triggerPhotoMatching = () => {
    if (processedPhotos.length > 0 && excelData.length > 0) {
      verifyPhotosAgainstExcel(processedPhotos);
    } else {
      toast.error('Please upload both Excel data and ZIP photos first');
    }
  };

  /**
   * Check each photo's number against ALL cells in all rows of the raw Excel data.
   * If the photo number is found in any cell value, that row is a match.
   */
  const verifyPhotosAgainstExcel = (photos: ProcessedPhoto[]) => {
    const results: VerificationRow[] = [];

    for (const photo of photos) {
      const photoId = photo.name.replace(/\D/g, ''); // Extract digits from filename
      let matchedName = '';
      let matched = false;

      if (photoId) {
        // Search every row in the raw Excel data
        for (let rowIdx = 0; rowIdx < excelData.length; rowIdx++) {
          const row = excelData[rowIdx];
          for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const cellValue = String(row[colIdx] ?? '').trim();
            const cellNumbers = cellValue.replace(/\D/g, '');

            // Match if the extracted digits from the cell equal the photo ID
            if (cellNumbers && cellNumbers === photoId) {
              matched = true;
              // Try to get a name from the mapped data for this row
              if (mappedData[rowIdx]) {
                matchedName = mappedData[rowIdx].student_name || '';
              }
              break;
            }
          }
          if (matched) break;
        }
      }

      results.push({
        photoName: photo.originalName,
        photoId: photoId || '-',
        matchedName: matchedName || '-',
        matched,
        photoBlob: matched ? photo.blob : undefined,
      });
    }

    setVerificationResults(results);
    setPhotoMatchingEnabled(true);

    const matchedCount = results.filter(r => r.matched).length;
    toast.info(`Verification Complete: ${matchedCount} of ${results.length} photos matched`);
  };

  const parseExcelFile = (file: File) => {
    setIsProcessing(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setErrors(['Excel file must have at least a header row and one data row']);
          setIsProcessing(false);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        setRawHeaders(prev => prev.length === 0 ? headers : prev);
        setExcelData(prev => [...prev, ...rows]);
        useEditorStore.getState().setImportedColumns(headers);

        // Auto-detect column mapping
        const autoMapping: ColumnMapping = {};
        headers.forEach((header, index) => {
          const lowerHeader = header?.toLowerCase() || '';

          // Try to match common variations
          if (lowerHeader.includes('name') && !lowerHeader.includes('father')) {
            autoMapping[header] = 'student_name';
          } else if (lowerHeader.includes('father') || lowerHeader.includes('parent')) {
            autoMapping[header] = 'father_name';
          } else if (lowerHeader.includes('class') || lowerHeader.includes('grade')) {
            autoMapping[header] = 'class';
          } else if (lowerHeader.includes('section') || lowerHeader.includes('div')) {
            autoMapping[header] = 'section';
          } else if (lowerHeader.includes('roll') || lowerHeader.includes('reg')) {
            autoMapping[header] = 'roll_number';
          } else if (lowerHeader.includes('id') && !lowerHeader.includes('roll')) {
            autoMapping[header] = 'student_id';
          } else if (lowerHeader.includes('dob') || lowerHeader.includes('birth') || lowerHeader.includes('date')) {
            autoMapping[header] = 'date_of_birth';
          } else if (lowerHeader.includes('address') || lowerHeader.includes('addr')) {
            autoMapping[header] = 'address';
          } else if (lowerHeader.includes('gender') || lowerHeader.includes('sex')) {
            autoMapping[header] = 'gender';
          } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('contact')) {
            autoMapping[header] = 'phone_number';
          } else if (lowerHeader.includes('blood') || lowerHeader.includes('group')) {
            autoMapping[header] = 'blood_group';
          }
        });

        setColumnMapping(autoMapping);
        processMappedData(rows, autoMapping);
        toast.success(`Excel file parsed! processing complete records...`);
      } catch (error) {
      console.error('Error parsing Excel file. Please check the file format.');
        setErrors(['Failed to parse Excel file. Please check the file format.']);
        toast.error('Failed to parse Excel file');
      }
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const processMappedData = (rows: any[][], mapping: ColumnMapping) => {
    const processed: StudentData[] = [];
    const newErrors: string[] = [];

    rows.forEach((row, index) => {
      const student: StudentData = {
        student_name: '',
        class: ''
      };

      // Map data based on column mapping
      Object.entries(mapping).forEach(([excelColumn, studentField]) => {
        if (studentField === 'skip' || !studentField) return;

        const columnIndex = Object.keys(columnMapping).indexOf(excelColumn);
        const value = row[columnIndex];

        if (value !== undefined && value !== null && value !== '') {
          (student as any)[studentField] = String(value).trim();
        }
      });

      // Only include the student if both required fields (Name & Class) are present
      if (student.student_name && student.class) {
        processed.push(student);
      } else {
        // Only report an error if the row wasn't entirely empty
        const isRowEmpty = row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
        if (!isRowEmpty) {
          if (!student.student_name) newErrors.push(`Row ${index + 2}: Student name is missing`);
          if (!student.class) newErrors.push(`Row ${index + 2}: Class is required`);
        }
      }
    });

    setMappedData(processed);
    setErrors(newErrors);

    // Notify parent with the actual count of cleaned, complete records
    onFileChange?.(!!file, !!zipFile, processed.length, processedPhotos.length);
  };

  const handleMappingChange = (excelColumn: string, studentField: string) => {
    const newMapping = { ...columnMapping, [excelColumn]: studentField };
    setColumnMapping(newMapping);
    processMappedData(excelData, newMapping);
  };

  const handleUpload = async () => {
    if (!currentOrder || mappedData.length === 0) {
      toast.error('No data to upload');
      return;
    }

    if (errors.length > 0) {
      toast.error('Please fix errors before uploading');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload the Excel file itself
      if (file) {
        try {
          await uploadService.uploadExcel(file);
        } catch {
          // Non-blocking, continue with student data
        }
      }

      // 2. Map and Upload student data
      // Map frontend fields to backend model fields
      const recordsToInsert = mappedData.map(student => ({
        name: student.student_name,
        idNumber: student.student_id || student.roll_number || '',
        class: student.class,
        bloodGroup: student.blood_group || '',
        phone: student.phone_number || '',
        address: student.address || '',
        dob: student.date_of_birth || '',
        // Add other fields as needed based on Record model
        customFields: {
          father_name: student.father_name || '',
          section: student.section || ''
        }
      }));

      // Use the projectId from currentOrder (mongo _id)
      const projectId = currentOrder.projectId || currentOrder.id;
      
      const response = await recordService.bulkCreate(projectId, recordsToInsert);

      // Also update the global editor store for immediate use in the Canva Editor and Generator
      const editorStore = useEditorStore.getState();
      editorStore.setImportedRecords(recordsToInsert.map(r => {
        const { customFields, ...rest } = r;
        return {
          ...rest,
          ...customFields,
          student_name: r.name, // Ensure consistent field names for mapping
          student_id: r.idNumber
        } as unknown as Record<string, string>;
      }));

      if (response && response.count > 0) {
        toast.success(`Successfully uploaded ${response.count} students!`);
        await refreshOrder();
        // Redirect to records list using local path
        navigate('/records');
      } else {
        toast.error('Failed to create student records');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Student Name', 'Father Name', 'Class', 'Section', 'Roll Number', 'Student ID', 'Date of Birth', 'Address', 'Gender', 'Phone Number', 'Blood Group'],
      ['John Doe', 'Robert Doe', 'Class 10', 'A', '001', 'STU001', '2010-05-15', '123 Main St', 'Male', '+91 9876543210', 'A+'],
      ['Jane Smith', 'Michael Smith', 'Class 10', 'B', '002', 'STU002', '2010-08-20', '456 Oak Ave', 'Female', '+91 9876543211', 'B+']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_template.xlsx');
  };

  const content = (
    <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Upload Excel File
              </CardTitle>
              <CardDescription>
                Upload an Excel file with student data. Download the template for reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">Select Excel File</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="mt-2"
                  />
                </div>

                {file && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected File: {file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Processing Excel file...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ZIP Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-blue-600" />
                Upload Student Photos (ZIP)
              </CardTitle>
              <CardDescription>
                Upload a ZIP file containing pre-processed student photos. Photos will be matched to students based on filename.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zip-file">Select ZIP File</Label>
                  <Input
                    id="zip-file"
                    type="file"
                    accept=".zip"
                    onChange={handleZipFileSelect}
                    className="mt-2"
                  />
                </div>

                {zipFile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected ZIP: {zipFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(zipFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {isProcessingPhotos && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Extracting photos...</span>
                      <span>{photoProcessingProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${photoProcessingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {processedPhotos.length > 0 && excelData.length > 0 && !photoMatchingEnabled && (
                  <div className="flex justify-center flex-col gap-2">
                    <Button onClick={triggerPhotoMatching} className="w-full bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Checks whether image numbers exist in the Excel data.</p>
                  </div>
                )}

                {processedPhotos.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">
                        Total Photos Uploaded: {processedPhotos.length}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photo Preview Gallery */}
          {processedPhotos.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Uploaded Photos Preview
                </CardTitle>
                <CardDescription>
                  Review all extracted photos from the ZIP file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-y-auto max-h-[400px] p-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {processedPhotos.map((photo, index) => (
                      <div key={index} className="flex flex-col items-center gap-2 p-2 border rounded-lg bg-card hover:shadow-md transition-shadow">
                        <div className="w-24 h-24 rounded-md overflow-hidden bg-muted">
                          <img 
                            src={photo.previewUrl} 
                            alt={photo.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="w-full text-center">
                          <p className="text-[10px] font-medium truncate" title={photo.originalName}>
                            {photo.originalName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        {/* Dynamic Excel Preview */}
        {excelData.length > 0 && (
          <div className="mt-8 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Excel Data Preview ({excelData.length} rows)
              </h3>
              <p className="text-sm text-gray-500">
                Showing the exact data from your uploaded Excel file alongside validation status.
              </p>
            </div>
            
            <div className="rounded-xl border border-gray-200 overflow-auto bg-white max-h-[600px] shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    {rawHeaders.map((header, index) => (
                      <TableHead key={index} className="whitespace-nowrap font-semibold text-gray-700">
                        {header || `Column ${index + 1}`}
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap font-semibold text-blue-700 bg-blue-50/50">Image ID</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-blue-700 bg-blue-50/50">Verified</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.map((row, rowIndex) => {
                    // Check if any photo matched any cell in this row
                    let rowMatched = false;
                    let matchedPhotoId = '-';
                    if (verificationResults.length > 0) {
                      for (let colIdx = 0; colIdx < row.length; colIdx++) {
                        const cellNumbers = String(row[colIdx] ?? '').replace(/\D/g, '');
                        const matchedResult = cellNumbers ? verificationResults.find(r => r.matched && r.photoId === cellNumbers) : undefined;
                        if (matchedResult) {
                          rowMatched = true;
                          matchedPhotoId = matchedResult.photoId;
                          break;
                        }
                      }
                    }

                    return (
                      <TableRow key={rowIndex} className={rowMatched ? 'bg-green-100 hover:bg-green-200 transition-colors' : 'bg-red-100 hover:bg-red-200 transition-colors'}>
                        {rawHeaders.map((_, colIndex) => (
                          <TableCell key={colIndex} className="whitespace-nowrap font-medium text-gray-800">
                            {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : '-'}
                          </TableCell>
                        ))}
                        <TableCell className="font-mono text-sm font-medium">
                          {matchedPhotoId !== '-' ? (
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded-md">{matchedPhotoId}</span>
                          ) : (
                            <span className="text-red-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rowMatched ? (
                            <Badge className="bg-green-200 text-green-800 hover:bg-green-300 border-green-300 shadow-sm">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Matched
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-200 text-red-800 hover:bg-red-300 border-red-300 shadow-sm">
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Matched
                            </Badge>
                          )}
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {mappedData.length > 0 && !embedded && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : `Upload ${mappedData.length} Students`}
            </Button>
          </div>
        )}
    </>
  );

  if (embedded) {
    return (
      <div className="w-full">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/school/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            {(file || zipFile || excelData.length > 0 || processedPhotos.length > 0) && (
              <Button onClick={clearAll} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg">
                <XCircle size={14} className="mr-2" /> Clear All
              </Button>
            )}
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>
        {content}
      </main>
    </div>
  );
};

export default UploadExcel;
