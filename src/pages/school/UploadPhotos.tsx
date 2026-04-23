import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { uploadService, studentService } from "@/services/dataService";
import { useOrder } from "@/hooks/useOrder";
import { ArrowLeft, Upload, CheckCircle, XCircle, Image as ImageIcon, User, Sparkles, Download, Loader2, Clock, AlertCircle } from "lucide-react";
import { AIImageProcessor, PHOTO_SIZE_PRESETS, type PhotoSize } from "@/services/aiImageProcessor";
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker safely to avoid module load crash
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions && pdfjsLib.version) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} else if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(window as any).pdfjsLib.version}/pdf.worker.min.mjs`;
}

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp', 'svg', 'pdf'];
const ALLOWED_ACCEPT = '.jpeg,.jpg,.png,.webp,.svg,.pdf,image/jpeg,image/png,image/webp,image/svg+xml,application/pdf';

type FileProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

interface FileStatus {
  filename: string;
  status: FileProcessingStatus;
  error?: string;
}

/** Convert a single PDF page to an image File */
async function pdfPageToImage(pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, pdfName: string): Promise<File> {
  const page = await pdfDoc.getPage(pageNum);
  const scale = 3; // high-res
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const baseName = pdfName.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_page${pageNum}.png`;
      resolve(new File([blob!], fileName, { type: 'image/png' }));
    }, 'image/png');
  });
}

/** Expand files: convert PDFs to image files, pass others through */
async function expandFiles(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const imgFile = await pdfPageToImage(pdfDoc, i, file.name);
          result.push(imgFile);
        }
      } catch {
        toast.error('Failed to parse PDF file');
      }
    } else {
      result.push(file);
    }
  }
  return result;
}

const MM_PER_INCH = 25.4;

interface PhotoMatch {
  filename: string;
  studentId?: string;
  studentName?: string;
  matched: boolean;
  originalFile: File;
  processedBlob: Blob;
}

const UploadPhotos = () => {
  const navigate = useNavigate();
  const { currentOrder, refreshOrder } = useOrder();
  const isOrderLocked = currentOrder ? ['validated', 'approved', 'generating', 'generated', 'exported', 'archived'].includes(currentOrder.status) : false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [addFormalCoat, setAddFormalCoat] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Photo size state
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customWidthMm, setCustomWidthMm] = useState(35);
  const [customHeightMm, setCustomHeightMm] = useState(45);
  const [useCustom, setUseCustom] = useState(false);
  const [unit, setUnit] = useState<"mm" | "inch">("mm");

  // Fetch students for matching
  useEffect(() => {
    const fetchStudents = async () => {
      if (!currentOrder || isOrderLocked) return;

      try {
        const data = await studentService.getAll(currentOrder.id || currentOrder._id || '');
        const list = Array.isArray(data) ? data : (data?.students || []);
        setStudents(list);
      } catch {
        // Silent fail - students list will remain empty
      }
    };

    fetchStudents();
  }, [currentOrder, isOrderLocked]);

  if (isOrderLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SchoolHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Order is locked. You cannot upload photos after submission.
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

  const getPhotoSize = (): PhotoSize => {
    if (useCustom) {
      return {
        label: "Custom",
        widthMm: customWidthMm,
        heightMm: customHeightMm,
        widthInch: parseFloat((customWidthMm / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((customHeightMm / MM_PER_INCH).toFixed(2)),
      };
    }
    return PHOTO_SIZE_PRESETS[selectedPresetIdx];
  };

  // Step 1: Just select and validate files (no processing yet)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const rawFiles = Array.from(selectedFiles);

    // Validate extensions
    const invalidFiles = rawFiles.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return !ALLOWED_EXTENSIONS.includes(ext);
    });
    if (invalidFiles.length > 0) {
      toast.error(`Unsupported file(s): ${invalidFiles.map(f => f.name).join(', ')}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Expand PDFs into individual page images, then store
    try {
      const filesArray = await expandFiles(rawFiles);
      setPendingFiles(prev => [...prev, ...filesArray]);
      toast.success(`${filesArray.length} file(s) added to queue.`);
    } catch {
      toast.error('Failed to read selected files.');
    }

    // Reset input so user can re-select
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 2: Process the pending files when user clicks Process
  const handleProcessFiles = async () => {
    if (pendingFiles.length === 0) {
      toast.error('Please select photos first.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setPhotoMatches([]);

    // Initialize file statuses by appending new pending ones
    const initialStatuses: FileStatus[] = pendingFiles.map(f => ({
      filename: f.name,
      status: 'pending' as FileProcessingStatus,
    }));
    setFileStatuses(prev => [...prev.filter(s => s.status !== 'pending'), ...initialStatuses]);

    try {
      const processor = new AIImageProcessor();
      await processor.initialize();
      const photoSize = getPhotoSize();

      const newMatches: PhotoMatch[] = [];

      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];

        // Update status to processing
        setFileStatuses(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'processing' } : s
        ));

        try {
          const processedBlob = await processor.processImage(file, photoSize, { addFormalCoat });

          const match: PhotoMatch = {
            filename: file.name,
            originalFile: file,
            processedBlob: processedBlob,
            matched: false,
          };

          const matchResult = matchPhotoToStudent(file.name);
          if (matchResult) {
            match.matched = true;
            match.studentId = matchResult.id;
            match.studentName = matchResult.student_name;
          }

          newMatches.push(match);

          // Update status to done
          setFileStatuses(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'done' } : s
          ));
        } catch {
          // Update status to error
          setFileStatuses(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error' } : s
          ));
        }

        setProgress(((i + 1) / pendingFiles.length) * 100);
      }

      setPhotoMatches((prev) => [...prev, ...newMatches]);
      setPendingFiles([]); // Clear pending after processing
      toast.success(`Processed ${newMatches.length} photos successfully!`);
    } catch {
      toast.error('Failed to process photos with AI');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setPhotoMatches([]);
    setPendingFiles([]);
    setFileStatuses([]);
    setProgress(0);
    toast.success("Cleared all photos");
  };

  const matchPhotoToStudent = (filename: string) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase();

    for (const student of students) {
      if (student.roll_number && nameWithoutExt.includes(student.roll_number.toLowerCase())) {
        return student;
      }
    }

    for (const student of students) {
      if (student.student_id && nameWithoutExt.includes(student.student_id.toLowerCase())) {
        return student;
      }
    }

    for (const student of students) {
      const studentName = student.student_name.toLowerCase();
      const nameParts = studentName.split(' ');

      for (const part of nameParts) {
        if (part.length > 2 && nameWithoutExt.includes(part)) {
          return student;
        }
      }
    }

    return null;
  };

  const handleManualMatch = (photoIndex: number, studentId: string) => {
    const updatedMatches = [...photoMatches];
    const student = students.find(s => s.id === studentId);

    if (student) {
      updatedMatches[photoIndex].matched = true;
      updatedMatches[photoIndex].studentId = student.id;
      updatedMatches[photoIndex].studentName = student.student_name;
    }

    setPhotoMatches(updatedMatches);
  };

  const handleUpload = async () => {
    if (!currentOrder || photoMatches.length === 0) {
      toast.error('No photos to upload');
      return;
    }

    const matchedPhotos = photoMatches.filter(p => p.matched);
    if (matchedPhotos.length === 0) {
      toast.error('Please match at least one photo to a student');
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = matchedPhotos.map(async (photoMatch) => {
        if (!photoMatch.processedBlob || !photoMatch.studentId) return;

        // Create a File from the blob for upload
        const file = new File(
          [photoMatch.processedBlob],
          `${photoMatch.filename.replace(/\.[^/.]+$/, "")}.png`,
          { type: 'image/png' }
        );

        try {
          const result = await uploadService.uploadPhoto(file);
          return {
            studentId: photoMatch.studentId,
            photoUrl: result.url
          };
        } catch {
          return null;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(Boolean);

      // Update student records with photo URLs
      const updatePromises = successfulUploads.map(async (result) => {
        if (!result) return;
        try {
          await studentService.update(result.studentId, { photoUrl: result.photoUrl });
        } catch {
          // Silent fail for individual student update
        }
      });

      await Promise.all(updatePromises);

      toast.success(`Successfully uploaded ${successfulUploads.length} processed photos!`);
      await refreshOrder();
      navigate('/records');
    } catch {
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (photoMatches.length === 0) {
      toast.error('No photos to download');
      return;
    }

    try {
      const zip = new JSZip();
      
      // Add all processed photos to the ZIP
      photoMatches.forEach((photo) => {
        // Keep original filename but enforce .png as requested (same format)
        const baseName = photo.filename.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.png`;
        
        zip.file(fileName, photo.processedBlob);
      });

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `processed_photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${photoMatches.length} processed photos!`);
    } catch {
      toast.error('Failed to create ZIP file');
    }
  };

  const matchedCount = photoMatches.filter(p => p.matched).length;
  const unmatchedCount = photoMatches.length - matchedCount;

  const displayW = (size: PhotoSize) => unit === "mm" ? `${size.widthMm}mm` : `${size.widthInch}"`;
  const displayH = (size: PhotoSize) => unit === "mm" ? `${size.heightMm}mm` : `${size.heightInch}"`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Main Work Area */}
          <div className="space-y-6">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-blue-50/50 rounded-t-xl pb-4 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      AI Process & Upload Photos
                    </div>
                    {(photoMatches.length > 0 || pendingFiles.length > 0) && (
                      <Button onClick={clearAll} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg">
                        <XCircle size={14} className="mr-2" /> Clear All
                      </Button>
                    )}
                  </div>
                <CardDescription>
                  Select photos to automatically remove backgrounds, correct lighting, resize, and match to students.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {/* ── STEP 1: Photo Size Selector ── */}
                <div className="border rounded-lg p-4 bg-muted/30 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">1</div>
                    <h4 className="text-sm font-semibold">Target Box Size</h4>
                    <div className="ml-auto flex items-center border rounded-md overflow-hidden text-xs">
                      <button
                        onClick={() => setUnit("mm")}
                        className={`px-3 py-1 font-medium transition-colors ${unit === "mm" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                      >mm</button>
                      <button
                        onClick={() => setUnit("inch")}
                        className={`px-3 py-1 font-medium transition-colors ${unit === "inch" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                      >inch</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PHOTO_SIZE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedPresetIdx(idx); setUseCustom(false); }}
                        className={`p-2 rounded-md border text-center text-xs transition-all
                            ${!useCustom && selectedPresetIdx === idx
                            ? "border-primary bg-primary/10 ring-1 ring-primary font-semibold"
                            : "hover:bg-muted bg-background"}`}
                      >
                        <span className="block font-medium">{preset.label}</span>
                        <span className="text-muted-foreground">{displayW(preset)} × {displayH(preset)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 mt-3 border-t">
                    <button
                      onClick={() => setUseCustom(true)}
                      className={`text-xs font-medium mb-2 ${useCustom ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      ✏️ Custom Size
                    </button>
                    {useCustom && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1 block">Width ({unit})</label>
                          <input
                            type="number"
                            min={10}
                            value={unit === "mm" ? customWidthMm : parseFloat((customWidthMm / MM_PER_INCH).toFixed(2))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 10;
                              setCustomWidthMm(unit === "mm" ? v : Math.round(v * MM_PER_INCH));
                            }}
                            className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <span className="text-muted-foreground mt-6 text-sm">×</span>
                        <div className="flex-1">
                          <label className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1 block">Height ({unit})</label>
                          <input
                            type="number"
                            min={10}
                            value={unit === "mm" ? customHeightMm : parseFloat((customHeightMm / MM_PER_INCH).toFixed(2))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 10;
                              setCustomHeightMm(unit === "mm" ? v : Math.round(v * MM_PER_INCH));
                            }}
                            className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── STEP 2: Formal Coat Checkbox ── */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">2</div>
                    <label
                      htmlFor="formal-coat-toggle"
                      className="flex items-center gap-3 cursor-pointer select-none flex-1"
                    >
                      <div className="relative">
                        <input
                          id="formal-coat-toggle"
                          type="checkbox"
                          checked={addFormalCoat}
                          onChange={(e) => setAddFormalCoat(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary transition-colors duration-200" />
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 peer-checked:translate-x-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">Formal Black Coat</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Add professional black blazer/coat overlay to photos</p>
                      </div>
                    </label>
                    {addFormalCoat && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
                        ON
                      </Badge>
                    )}
                  </div>
                </div>

                {/* ── STEP 3: Select Photos ── */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">3</div>
                    <h4 className="text-sm font-semibold">Select Photos</h4>
                  </div>
                  <Label htmlFor="photo-files" className="cursor-pointer block">
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50/30 hover:bg-blue-50/80 transition-colors">
                      <Upload className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                      <p className="font-semibold text-blue-700">Click to select photos</p>
                      <p className="text-sm text-blue-600/70 mt-1">Upload multiple .jpg, .jpeg, .png, .webp, .svg, .pdf</p>
                    </div>
                    <Input
                      id="photo-files"
                      type="file"
                      multiple
                      accept={ALLOWED_ACCEPT}
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </Label>

                  {/* Show selected files count + Process button */}
                  {pendingFiles.length > 0 && !isProcessing && (
                    <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {pendingFiles.length} photo{pendingFiles.length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <Button
                        onClick={handleProcessFiles}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Process {pendingFiles.length} Image{pendingFiles.length > 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </div>

                {/* ── Live Processing Status ── */}
                {(isProcessing || fileStatuses.length > 0) && (
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg border">
                    {/* Overall progress bar */}
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2">
                        {isProcessing && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {isProcessing ? 'AI processing photos...' : 'Processing complete'}
                      </span>
                      <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    {/* Per-file status list */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 mt-2">
                      {fileStatuses.map((fs, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                            fs.status === 'processing'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : fs.status === 'done'
                              ? 'bg-green-50 text-green-700'
                              : fs.status === 'error'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50 text-gray-500'
                          }`}
                        >
                          {fs.status === 'pending' && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                          {fs.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                          {fs.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                          {fs.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                          <span className="truncate flex-1" title={fs.filename}>{fs.filename}</span>
                          <span className="text-[10px] uppercase tracking-wider opacity-70">
                            {fs.status === 'pending' && 'Waiting'}
                            {fs.status === 'processing' && 'Processing...'}
                            {fs.status === 'done' && 'Done'}
                            {fs.status === 'error' && 'Failed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Photo Matching Grid */}
            {photoMatches.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <div>
                    <CardTitle className="text-lg">Processed & Matched</CardTitle>
                    <CardDescription>
                      Review before uploading to database.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {photoMatches.length > 0 && (
                      <Button
                        onClick={handleDownloadZip}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP
                      </Button>
                    )}
                    {matchedCount > 0 && (
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Uploading...' : `Upload ${matchedCount} to Database`}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-4 bg-muted/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {photoMatches.map((photo, index) => (
                        <div key={index} className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden group">

                          {/* Top Status Bar */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 max-w-[60%]">
                              <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs font-mono text-muted-foreground truncate" title={photo.filename}>
                                {photo.filename}
                              </span>
                            </div>
                            <div>
                              {photo.matched ? (
                                <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Matched
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  No Match
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Images (Before/After) */}
                          <div className="flex gap-4 mb-4 h-32">
                            <div className="flex-1 relative bg-gray-50 rounded-lg border border-gray-100 overflow-hidden group-hover:border-gray-300 transition-colors flex items-center justify-center">
                              <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider backdrop-blur-sm z-10">Raw</span>
                              <img
                                src={URL.createObjectURL(photo.originalFile)}
                                alt="Original"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 relative bg-[url('https://cdn.img.ly/assets/transparent_pattern.png')] bg-repeat rounded-lg border-2 border-blue-200 shadow-inner overflow-hidden flex items-center justify-center">
                              <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider shadow-sm z-10 hidden group-hover:inline-block">Processed</span>
                              <img
                                src={URL.createObjectURL(photo.processedBlob)}
                                alt="Processed"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          {/* Student Selection */}
                          <div className="bg-gray-50 -mx-4 -mb-4 px-4 py-3 border-t">
                            {photo.matched ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-medium text-sm text-gray-900">
                                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <User className="w-3 h-3 text-green-700" />
                                  </div>
                                  <span className="truncate">{photo.studentName}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-muted-foreground hover:text-red-600"
                                  onClick={() => {
                                    const updated = [...photoMatches];
                                    updated[index].matched = false;
                                    updated[index].studentId = undefined;
                                    updated[index].studentName = undefined;
                                    setPhotoMatches(updated);
                                  }}
                                >
                                  Unlink
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <Select
                                  value={photo.studentId || ""}
                                  onValueChange={(value) => handleManualMatch(index, value)}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue placeholder="Manual match..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {students.map((student) => (
                                      <SelectItem key={student.id} value={student.id} className="text-xs flex justify-between">
                                        <span>{student.student_name}</span>
                                        {student.roll_number && <span className="text-muted-foreground ml-2">({student.roll_number})</span>}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar (Instructions & Summary) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {photoMatches.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                      <span>Total Processed</span>
                      <span className="bg-blue-100 px-2 py-0.5 rounded-full">{photoMatches.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
                      <span>Matched to Data</span>
                      <span className="bg-green-100 px-2 py-0.5 rounded-full">{matchedCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 text-yellow-700 rounded-lg font-medium text-sm">
                      <span>Unmatched</span>
                      <span className="bg-yellow-100 px-2 py-0.5 rounded-full">{unmatchedCount}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No photos processed yet.
                  </p>
                )}
                {students.length === 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      No students found. Import Excel data first.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b mb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Auto-Match Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>In order to automatically attach photos to students, the filename must match one of:</p>
                  <ul className="list-disc list-inside space-y-1.5 ml-1">
                    <li><span className="font-medium text-foreground">Roll No :</span> <code>001.jpg</code></li>
                    <li><span className="font-medium text-foreground">Student ID :</span> <code>S1001.jpg</code></li>
                    <li><span className="font-medium text-foreground">Full Name :</span> <code>john_doe.png</code></li>
                    <li><span className="font-medium text-foreground">First Name :</span> <code>john.jpg</code> (partial match)</li>
                  </ul>
                  <p className="mt-3 leading-relaxed border-t pt-3">
                    Unmatched photos appear with a dropdown box allowing you to manually assign them to any unmatched student.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

export default UploadPhotos;
