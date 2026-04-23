import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { recordService, uploadService } from "@/services/dataService";
import { Upload, CheckCircle, XCircle, FileSpreadsheet, Download, User, AlertTriangle, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useEditorStore } from "@/store/useEditorStore";
import { PhotoMatch } from "@/types/validation";

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
}

interface ColumnMapping {
  [key: string]: string;
}

export interface DataMapperProps {
  currentOrder: any;
  students?: any[];
  photoMatches?: PhotoMatch[];
  setPhotoMatches?: React.Dispatch<React.SetStateAction<PhotoMatch[]>>;
  onStatsUpdate?: (stats: { total: number; valid: number; errors: number; warnings: number }) => void;
  onDataLoaded?: (data: any[], headers: string[], mapped: any[]) => void;
  onUploadComplete?: () => void;
  // Parent state for persistence
  excelData?: any[];
  setExcelData?: React.Dispatch<React.SetStateAction<any[]>>;
  rawHeaders?: string[];
  setRawHeaders?: React.Dispatch<React.SetStateAction<string[]>>;
  columnMapping?: Record<string, string>;
  setColumnMapping?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  mappedData?: any[];
  setMappedData?: React.Dispatch<React.SetStateAction<any[]>>;
  zipFile?: File | null;
  setZipFile?: React.Dispatch<React.SetStateAction<File | null>>;
  isDataProcessing?: boolean;
  setIsDataProcessing?: React.Dispatch<React.SetStateAction<boolean>>;
  isExtractingZip?: boolean;
  setIsExtractingZip?: React.Dispatch<React.SetStateAction<boolean>>;
  isDataUploading?: boolean;
  setIsDataUploading?: React.Dispatch<React.SetStateAction<boolean>>;
  isMatched?: boolean;
  setIsMatched?: React.Dispatch<React.SetStateAction<boolean>>;
  dataErrors?: string[];
  setDataErrors?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function DataMapper({ 
  currentOrder, 
  students = [], 
  photoMatches = [], 
  setPhotoMatches,
  onStatsUpdate,
  onDataLoaded, 
  onUploadComplete,
  // Parent state for persistence
  excelData = [],
  setExcelData,
  rawHeaders = [],
  setRawHeaders,
  columnMapping = {},
  setColumnMapping,
  mappedData = [],
  setMappedData,
  zipFile,
  setZipFile,
  isDataProcessing = false,
  setIsDataProcessing,
  isExtractingZip = false,
  setIsExtractingZip,
  isDataUploading = false,
  setIsDataUploading,
  isMatched = false,
  setIsMatched,
  dataErrors = [],
  setDataErrors
}: DataMapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const requiredFields = ['student_name', 'class'];
  const optionalFields = ['father_name', 'section', 'roll_number', 'student_id', 'date_of_birth', 'address', 'gender', 'phone_number', 'blood_group'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error('Please upload an Excel or CSV file');
        return;
      }
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    setIsDataProcessing?.(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error('File must have a header and data rows');
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => h?.trim() || '');
        const rows = jsonData.slice(1) as any[][];

        setRawHeaders?.(prev => prev.length === 0 ? headers : prev);
        setExcelData?.(prev => [...prev, ...rows]);
        
        // Auto mapping
        const autoMap: ColumnMapping = {};
        headers.forEach(h => {
          const l = h.toLowerCase();
          if (l.includes('name') && !l.includes('father')) autoMap[h] = 'student_name';
          else if (l.includes('father')) autoMap[h] = 'father_name';
          else if (l.includes('class') || l.includes('grade')) autoMap[h] = 'class';
          else if (l.includes('id') || l.includes('roll')) autoMap[h] = 'student_id';
        });
        
        setColumnMapping?.(autoMap);
        processMappedData(rows, autoMap, headers);
        toast.success('Excel parsed successfully');
      } catch {
        toast.error('Failed to parse file');
      } finally {
        setIsDataProcessing?.(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processMappedData = (rows: any[][], mapping: ColumnMapping, headers: string[]) => {
    const processed: StudentData[] = [];
    const newErrors: string[] = [];

    rows.forEach((row, i) => {
      if (row.every(c => !c)) return;
      const student: any = {};
      Object.entries(mapping).forEach(([col, field]) => {
        if (field === 'skip') return;
        const idx = headers.indexOf(col);
        if (row[idx] !== undefined) student[field] = String(row[idx]).trim();
      });

      if (student.student_name && student.class) {
        processed.push(student as StudentData);
      } else {
        newErrors.push(`Row ${i+2}: Missing required fields`);
      }
    });

    setMappedData?.(processed);
    setDataErrors?.(newErrors);
    
    // Reset matching state when data changes
    setIsMatched?.(false);
    
    onDataLoaded?.(rows, headers, processed);
  };

  const formatCellValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '-';
    // Excel numeric date detection (range for 1982 to 2064 approximately)
    if (typeof val === 'number' && val > 30000 && val < 60000) {
      try {
        const date = XLSX.SSF.parse_date_code(val);
        const d = date.d < 10 ? `0${date.d}` : date.d;
        const m = date.m < 10 ? `0${date.m}` : date.m;
        return `${d}-${m}-${date.y}`;
      } catch (e) {
        return String(val);
      }
    }
    return String(val);
  };

  const isRobustMatch = (studentId: string, studentName: string, filename: string) => {
    const fn = filename.toLowerCase();
    const fnNums = fn.replace(/\D/g, '');
    const sId = studentId ? String(studentId).toLowerCase() : '';
    const sIdNums = sId.replace(/\D/g, '');
    const sName = studentName ? String(studentName).toLowerCase().trim() : '';

    if (sIdNums && fnNums && parseInt(fnNums, 10) === parseInt(sIdNums, 10)) return true;
    if (sId && sId !== 'undefined' && fn.includes(sId.replace(/\s+/g, ''))) return true;

    if (sName && sName.length > 2) {
      const normalizedFn = fn.replace(/[^a-z0-9]/g, '');
      const normalizedName = sName.replace(/[^a-z0-9]/g, '');
      if (normalizedFn.includes(normalizedName)) return true;
      const parts = sName.split(/\s+/);
      if (parts[0].length > 2 && normalizedFn.includes(parts[0].replace(/[^a-z0-9]/g, ''))) return true;
    }
    return false;
  };

  const getMatchInfo = (record: any) => {
    if (!isMatched) return { matched: false, imageId: "Waiting..." };

    const studentName = String(record[rawHeaders.findIndex(h => columnMapping[h] === 'student_name')] || '').toLowerCase();
    const studentId = String(record[rawHeaders.findIndex(h => columnMapping[h] === 'student_id' || columnMapping[h] === 'roll_number')] || '');
    
    // Check session photos
    const sessionMatchIdx = photoMatches.findIndex(p => {
      // First check if it's strictly matched and bound to this name
      if (p.matched && p.studentName && p.studentName.toLowerCase() === studentName) return true;
      return isRobustMatch(studentId, studentName, p.filename);
    });

    if (sessionMatchIdx !== -1) {
      return { matched: true, imageId: `IMG-${sessionMatchIdx + 1}` };
    }

    return { matched: false, imageId: "-" };
  };

  const unmatchedPhotos = photoMatches.filter(p => !p.matched);

  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (!selectedFile.name.match(/\.zip$/i)) {
            toast.error('Please upload a ZIP file');
            return;
        }
        setZipFile?.(selectedFile);
        await processZipFile(selectedFile);
    }
  };

  const processZipFile = async (file: File) => {
    setIsExtractingZip?.(true);
    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        const newMatches: PhotoMatch[] = [];

        for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
            if (!zipEntry.dir && filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
                const blob = await zipEntry.async('blob');
                newMatches.push({
                    filename: filename.split('/').pop() || filename,
                    processedBlob: blob,
                    matched: false,
                    originalFile: new File([blob], filename),
                    processedUrl: URL.createObjectURL(blob),
                    originalUrl: URL.createObjectURL(blob) // Since it's from ZIP, original and processed start same
                });
            }
        }

        if (newMatches.length === 0) {
            toast.error('No valid images found in ZIP');
            return;
        }

        setPhotoMatches?.(prev => [...prev, ...newMatches]);
        toast.success(`Extracted ${newMatches.length} photos from ZIP`);
    } catch (err) {
        toast.error('Failed to extract ZIP');
    } finally {
        setIsExtractingZip?.(false);
    }
  };

  const handleProcess = async () => {
    if (!currentOrder || mappedData.length === 0) return;
    setIsDataUploading?.(true);
    
    const projectId = currentOrder.projectId || currentOrder._id;
    
    const recordsToInsert = mappedData.map(s => ({
      name: s.student_name,
      idNumber: s.student_id || s.roll_number || '',
      class: s.class,
      bloodGroup: s.blood_group || '',
      phone: s.phone_number || '',
      address: s.address || '',
      dob: s.date_of_birth || '',
      customFields: { father_name: s.father_name || '', section: s.section || '' }
    }));

    // ===== STEP 1: Client-side matching (always works, no API needed) =====
    if (setPhotoMatches && photoMatches.length > 0) {
      const updatedMatches = [...photoMatches];

      updatedMatches.forEach(p => {
        if (p.matched) return;
        
        // Match against the locally parsed Excel data (mappedData)
        const match = mappedData.find(s => {
          const sId = s.student_id || s.roll_number || '';
          const sName = s.student_name || '';
          return isRobustMatch(sId, sName, p.filename);
        });
        
        if (match) {
          p.matched = true;
          p.studentName = match.student_name;
        }
      });

      setPhotoMatches(updatedMatches);
      
      // Calculate finalized stats
      const matchedCount = updatedMatches.filter(p => p.matched).length;
      onStatsUpdate?.({
          total: mappedData.length,
          valid: matchedCount,
          errors: updatedMatches.length - matchedCount,
          warnings: Math.max(0, mappedData.length - matchedCount)
      });
    } else {
      // No photos uploaded - just update stats for records only
      onStatsUpdate?.({
          total: mappedData.length,
          valid: 0,
          errors: 0,
          warnings: mappedData.length
      });
    }
    
    // Mark as matched NOW so the UI updates immediately
    setIsMatched(true);
    
    // Update local store
    useEditorStore.getState().setImportedRecords(recordsToInsert.map(r => ({...r, ...r.customFields, student_name: r.name, student_id: r.idNumber} as any)));

    // ===== STEP 2: Try API calls (optional, won't block matching) =====
    try {
      if (file) await uploadService.uploadExcel(file);
      await recordService.bulkCreate(projectId, recordsToInsert);
      
      // Try to upload matched photos to the DB
      if (setPhotoMatches) {
        const matchedPhotos = photoMatches.filter(p => p.matched && p.processedBlob);
        if (matchedPhotos.length > 0) {
          try {
            const allStudents = await recordService.getAll(projectId);
            // Re-link with DB IDs
            matchedPhotos.forEach(p => {
              const dbRecord = allStudents.find((s: any) => {
                const sId = (s.idNumber || s.roll_number || s.student_id);
                const sName = (s.name || s.student_name);
                return isRobustMatch(sId, sName, p.filename);
              });
              if (dbRecord) {
                p.studentId = dbRecord.id || dbRecord._id;
              }
            });

            const photosWithIds = matchedPhotos.filter(p => p.studentId);
            if (photosWithIds.length > 0) {
              toast.loading(`Syncing ${photosWithIds.length} photos to DB...`, { id: 'upload-zip' });
              const results = await Promise.all(photosWithIds.map(async (m) => {
                try {
                  const photoFile = new File([m.processedBlob], `${m.filename.replace(/\.[^/.]+$/, "")}.png`, { type: 'image/png' });
                  const res = await uploadService.uploadPhoto(photoFile);
                  return { studentId: m.studentId, photoUrl: res.url };
                } catch (e) { return null; }
              }));
              const validResults = results.filter(r => r !== null);
              await Promise.all(validResults.map(r => recordService.update(r!.studentId!, { photoUrl: r!.photoUrl })));
              toast.dismiss('upload-zip');
            }
          } catch (dbErr) {
            console.warn('Photo DB sync skipped:', dbErr);
          }
        }
      }
      
      toast.success('Project dataset processed & synced successfully');
      onUploadComplete?.();
    } catch (err) {
      console.warn('API sync failed (matching still applied locally):', err);
      toast.success('Photos matched locally! (DB sync unavailable)');
    } finally {
        setIsDataUploading?.(false);
    }
  };

  const handleClearData = () => {
    // Revoke all cached URLs to avoid memory leaks
    photoMatches.forEach(p => {
      if (p.originalUrl) URL.revokeObjectURL(p.originalUrl);
      if (p.processedUrl) URL.revokeObjectURL(p.processedUrl);
    });
    setFile(null);
    setExcelData?.([]);
    setRawHeaders?.([]);
    setColumnMapping?.({});
    setMappedData?.([]);
    setDataErrors?.([]);
    setIsMatched?.(false);
    onStatsUpdate?.({ total: 0, valid: 0, errors: 0, warnings: 0 });
    toast.success('Excel data cleared.');
  };

  const displayData = !isMatched 
    ? excelData 
    : [...excelData].sort((a, b) => {
        const matchA = getMatchInfo(a).matched;
        const matchB = getMatchInfo(b).matched;
        if (matchA === matchB) return 0;
        return matchA ? -1 : 1;
      });

  return (
    <div className="space-y-6">
      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/20 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Excel Data Source
            </CardTitle>
            {excelData.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearData} className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <XCircle size={14} className="mr-2" /> Clear All 
              </Button>
            )}
          </div>
          <CardDescription>Upload your student roster to begin the validation process.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-indigo-100 rounded-2xl p-8 bg-indigo-50/5 text-center relative hover:bg-indigo-50/20 transition-all group">
                    <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-4 group-hover:translate-y-[-4px] transition-transform" />
                    <div className="font-bold text-indigo-900">Upload Excel or CSV</div>
                    <p className="text-xs text-indigo-600/60 mt-2">Maximum file size: 500MB</p>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} ref={fileInputRef} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                <div className="border-2 border-dashed border-blue-100 rounded-2xl p-8 bg-blue-50/5 text-center relative hover:bg-blue-50/20 transition-all group">
                    {isExtractingZip ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                            <div className="font-bold text-blue-900 animate-pulse">Extracting ZIP...</div>
                        </div>
                    ) : (
                        <>
                            <Download className="w-10 h-10 text-blue-400 mx-auto mb-4 group-hover:translate-y-[-4px] transition-transform" />
                            <div className="font-bold text-blue-900">Upload Processed Photos (ZIP)</div>
                            <p className="text-xs text-blue-600/60 mt-2">Extract images and match automatically</p>
                        </>
                    )}
                    <input type="file" accept=".zip" onChange={handleZipSelect} ref={zipInputRef} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
            </div>

            {excelData.length > 0 && (
                <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-center">
                        <Button onClick={handleProcess} disabled={isDataUploading || mappedData.length === 0} className="max-w-sm w-full bg-indigo-600 hover:bg-indigo-700 h-16 rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl ring-offset-2 hover:ring-4 ring-indigo-500 transition-all transform hover:scale-[1.02]">
                            <CheckCircle size={24} className="mr-3" />
                            {isDataUploading ? 'Processing...' : 'Run Process & Match'}
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
      {excelData.length > 0 && (
        <Card className="border-gray-200 shadow-sm overflow-hidden">
           <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-sm font-black uppercase text-gray-500 tracking-widest">Data Preview</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
              <div className="overflow-x-auto">
                 <Table>
                    <TableHeader className="bg-white">
                        <TableRow>
                           {rawHeaders.map((h, i) => (
                             <TableHead key={i} className="text-[10px] font-black uppercase text-gray-400 px-4 bg-gray-50/50 sticky top-0">
                                {h}
                             </TableHead>
                           ))}
                           <TableHead className="text-[10px] font-black uppercase text-blue-600 px-4 bg-gray-50/50 sticky top-0">Image ID</TableHead>
                           <TableHead className="text-[10px] font-black uppercase text-blue-600 px-4 bg-gray-50/50 sticky top-0">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                     <TableBody>
                        {displayData.map((row, i) => {
                          const matchInfo = getMatchInfo(row);
                          return (
                            <TableRow key={i}>
                               {rawHeaders.map((_, j) => (
                                 <TableCell key={j} className="text-xs text-gray-600 whitespace-nowrap px-4">
                                    {formatCellValue(row[j])}
                                 </TableCell>
                               ))}
                               <TableCell className="text-[10px] font-bold text-blue-600 px-4">{matchInfo.imageId}</TableCell>
                               <TableCell className="px-4">
                                  {matchInfo.matched ? 
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[9px]">Matched</Badge> : 
                                    <Badge className="bg-gray-100 text-gray-400 hover:bg-gray-100 text-[9px]">Not Matched</Badge>
                                  }
                               </TableCell>
                            </TableRow>
                          );
                        })}
                     </TableBody>
                  </Table>
              </div>
           </CardContent>
        </Card>
      )}

      {isMatched && unmatchedPhotos.length > 0 && (
        <Card className="border-amber-100 bg-amber-50/20 overflow-hidden">
           <CardHeader className="bg-amber-100/30 border-b border-amber-100 py-3">
              <CardTitle className="text-sm font-black uppercase text-amber-700 tracking-widest flex items-center gap-2">
                 <AlertTriangle size={14} /> Unmatched Photos Warning
              </CardTitle>
           </CardHeader>
           <CardContent className="p-4">
              <div className="text-[10px] text-amber-600 mb-4 font-medium">The following uploaded photos were not matched to any student in the imported dataset:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {photoMatches.map((p, i) => (
                   !p.matched && (
                     <div key={i} className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-700 shadow-inner">IMG-{i+1}</div>
                           <div className="text-[9px] font-bold text-gray-500 truncate flex-1 uppercase tracking-tighter" title={p.filename}>{p.filename}</div>
                        </div>
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                           <img src={p.processedUrl || URL.createObjectURL(p.processedBlob)} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                     </div>
                   )
                 ))}
              </div>
           </CardContent>
        </Card>
      )}
    </div>
  );
}
