import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, ArrowRight, LayoutTemplate, Database, Image as ImageIcon, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { useConfiguratorStore } from '../../../store/useConfiguratorStore';
import { formatIfDate } from '../../../utils/dateUtils';

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions && pdfjsLib.version) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} else if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(window as any).pdfjsLib.version}/pdf.worker.min.mjs`;
}

// ---- MODULE-LEVEL image store ----
// Blob URLs are strings and survive Zustand's JSON clone, but we keep a
// module-level cache for faster lookups within the same session.
export const batchImageStore: Record<string, string> = {};

export function hydrateBatchImageStore(images: Record<string, string>) {
  const existingKeys = Object.keys(batchImageStore).length;
  let added = 0;
  for (const k of Object.keys(images)) {
    if (!batchImageStore[k]) {
      batchImageStore[k] = images[k];
      added++;
    }
  }
  if (added > 0) {
    console.log(`[BatchPhotos] Hydrated ${added} images into batchImageStore (was ${existingKeys}, now ${Object.keys(batchImageStore).length})`);
  }
}

export function getBatchImage(key: string): string | undefined {
  if (!key) return undefined;
  const trimmed = key.toString().trim();
  if (batchImageStore[trimmed]) return batchImageStore[trimmed];
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const k of Object.keys(batchImageStore)) {
    if (k.toLowerCase() === lower) return batchImageStore[k];
  }
  return undefined;
}

export function getBatchImageKeys(): string[] {
  return Object.keys(batchImageStore);
}

async function convertPdfToImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
  return canvas.toDataURL('image/png', 0.9);
}

export default function SetupMode() {
  const design = useConfiguratorStore((state) => state.design);
  const setField = useConfiguratorStore((state) => state.setField);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const activeSide = design.idCard.activeSide;
  const { datasetColumns = [], datasetRecords = [], imageMatchColumn, matchedImageCount = 0, datasetImages = {} } = design.idCard.bulkWorkflow;
  const datasetReady = datasetRecords?.length > 0;
  
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoCount, setPhotoCount] = useState(Object.keys(datasetImages).length || Object.keys(batchImageStore).length);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // On mount: sync batchImageStore from Zustand store (survives HMR invalidation)
  React.useEffect(() => {
    const storeImgs = design.idCard.bulkWorkflow.datasetImages || {};
    const storeKeys = Object.keys(storeImgs);
    if (storeKeys.length > 0 && Object.keys(batchImageStore).length === 0) {
      console.log('[BatchPhotos] Syncing', storeKeys.length, 'images from Zustand store to batchImageStore');
      for (const k of storeKeys) {
        batchImageStore[k] = storeImgs[k];
      }
      setPhotoCount(storeKeys.length);
    }
  }, []);

  const handleBatchPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    console.log('[BatchPhotos] onChange fired, files:', selectedFiles?.length);
    if (!selectedFiles || selectedFiles.length === 0) {
      console.log('[BatchPhotos] No files selected');
      return;
    }
    
    setIsProcessingPhotos(true);
    
    // Helper: convert a Blob/File to a data URL (base64 embedded)
    // Data URLs survive page reloads, HMR, serialization — unlike blob URLs
    const blobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const firstFile = selectedFiles[0];
    const isZip = firstFile.name.toLowerCase().endsWith('.zip') || 
                  firstFile.type === 'application/zip' || 
                  firstFile.type === 'application/x-zip-compressed';
    console.log('[BatchPhotos] File:', firstFile.name, 'type:', firstFile.type, 'size:', firstFile.size, 'isZip:', isZip);

    try {
      if (isZip) {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(firstFile);
        console.log('[BatchPhotos] ZIP entries:', Object.keys(zipData.files).length);
        
        const promises: Promise<void>[] = [];
        zipData.forEach((_relativePath, file) => {
          if (!file.dir && /\.(jpe?g|png|webp|svg)$/i.test(file.name)) {
            const promise = file.async('blob').then(async (blob) => {
              const basename = file.name.split('/').pop() || '';
              const extIdx = basename.lastIndexOf('.');
              const key = (extIdx > 0 ? basename.substring(0, extIdx) : basename).trim();
              if (key) {
                const dataUrl = await blobToDataUrl(blob);
                batchImageStore[key] = dataUrl;
                console.log('[BatchPhotos] ZIP extracted:', basename, '->', key, '(', Math.round(dataUrl.length / 1024), 'KB)');
              }
            });
            promises.push(promise);
          }
        });
        await Promise.all(promises);
      } else {
        // Individual image files
        for (const file of Array.from(selectedFiles)) {
          if (/\.(jpe?g|png|webp|svg)$/i.test(file.name)) {
            const extIdx = file.name.lastIndexOf('.');
            const key = (extIdx > 0 ? file.name.substring(0, extIdx) : file.name).trim();
            if (key) {
              const dataUrl = await blobToDataUrl(file);
              batchImageStore[key] = dataUrl;
              console.log('[BatchPhotos] Image:', file.name, '->', key, '(', Math.round(dataUrl.length / 1024), 'KB)');
            }
          }
        }
      }
    } catch (err) {
      console.error('[BatchPhotos] Error processing files:', err);
      alert('Error processing files. Please try again.');
    }

    // Count matches
    const allKeys = Object.keys(batchImageStore);
    const lowerKeys = new Set(allKeys.map(k => k.toLowerCase()));
    
    // Create a map of pure numbers to actual keys for robust matching
    // Make sure we only map meaningful numbers (e.g. at least 1 digit)
    const numericKeysMap = new Map<string, string>();
    for (const k of allKeys) {
      const numMatch = k.replace(/\D/g, '');
      if (numMatch.length > 0) {
        numericKeysMap.set(numMatch, k);
      }
    }
    
    let matched = 0;
    if (imageMatchColumn && datasetRecords) {
      for (const rec of datasetRecords) {
        const rawVal = rec[imageMatchColumn]?.toString()?.trim();
        if (rawVal) {
          // If Excel has "183411.JPG", we strip the extension to "183411"
          const extIdx = rawVal.lastIndexOf('.');
          const baseVal = extIdx > 0 ? rawVal.substring(0, extIdx).trim() : rawVal;
          // Extract just the numbers from Excel val (e.g. "file photo no:183411.JPG" -> "183411")
          const numOnlyVal = rawVal.replace(/\D/g, '');
          
          if (batchImageStore[rawVal] || lowerKeys.has(rawVal.toLowerCase()) || 
              batchImageStore[baseVal] || lowerKeys.has(baseVal.toLowerCase()) ||
              (numOnlyVal && numericKeysMap.has(numOnlyVal))) {
            matched++;
          }
        }
      }
    }

    console.log('[BatchPhotos] Total images:', allKeys.length, 'Matched:', matched);
    console.log('[BatchPhotos] Sample keys:', allKeys.slice(0, 5));
    if (datasetRecords.length > 0 && imageMatchColumn) {
      const sampleVal = datasetRecords[0][imageMatchColumn]?.toString()?.trim();
      console.log('[BatchPhotos] Sample dataset value:', JSON.stringify(sampleVal), 'has match:', matched > 0);
    }

    // Store data URLs in Zustand — these survive cloning, HMR, and reloads
    const storeImages: Record<string, string> = {};
    for (const k of allKeys) {
      storeImages[k] = batchImageStore[k];
    }
    
    setField('idCard.bulkWorkflow.datasetImages', storeImages);
    setField('idCard.bulkWorkflow.matchedImageCount', matched);
    setPhotoCount(allKeys.length);
    setIsProcessingPhotos(false);

    // Reset input so same file can be re-selected
    if (photoInputRef.current) photoInputRef.current.value = '';
    
    console.log('[BatchPhotos] ✅ Done! Store updated with', allKeys.length, 'data URLs');
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setIsProcessingPdf(true);
        const dataUrl = await convertPdfToImage(file);
        setField(`idCard.${side}.backgroundImage`, dataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => setField(`idCard.${side}.backgroundImage`, event.target?.result as string);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error processing template', err);
      alert('Could not upload template.');
    } finally {
      setIsProcessingPdf(false);
    }
  };


  const handleDatasetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
        const rawRecords = XLSX.utils.sheet_to_json(worksheet);
        
        // Process records to format dates and cleanup values
        const records = rawRecords.map((r: any) => {
          const cleaned: any = {};
          for (const key of headers) {
             // Use formatIfDate for every field to catch date objects or date-like strings
             cleaned[key] = r[key] !== undefined ? formatIfDate(r[key]) : '';
          }
          return cleaned;
        });
        
        if (headers && records.length > 0) {
          setField('idCard.bulkWorkflow.datasetColumns', headers);
          setField('idCard.bulkWorkflow.datasetRecords', records);
          setField('idCard.bulkWorkflow.mapping', {});
          setField('idCard.front.elements', []);
          setField('idCard.back.elements', []);
          setField('idCard.selected', null);
        }
      } catch(err) {
        console.error('Error parsing excel', err);
        alert('Could not parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const frontBgImage = design.idCard.front.backgroundImage;
  const backBgImage = design.idCard.back.backgroundImage;
  const anyBgImage = frontBgImage || backBgImage;

  // Determine photos state
  const hasPhotos = photoCount > 0 || matchedImageCount > 0;
  const photosFullyMatched = hasPhotos && matchedImageCount > 0 && matchedImageCount === datasetRecords.length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Workspace Setup</h1>
          <p className="text-slate-500 text-lg">Define your visual template and your data source to begin.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Template Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
              <LayoutTemplate size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">1. The Design Template</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Upload a base design exported from Canva or Illustrator. We support high-res PDFs and images.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Front Side</label>
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleTemplateUpload(e, 'front')} />
                  <div className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${frontBgImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600'}`}>
                    {isProcessingPdf ? (
                      <span className="font-bold text-xs flex items-center gap-2 animate-pulse">Processing...</span>
                    ) : frontBgImage ? (
                      <span className="font-bold text-xs flex items-center gap-2"><FileCheck size={16} /> Front Uploaded</span>
                    ) : (
                      <span className="font-bold text-xs flex items-center gap-2"><UploadCloud size={16} /> Select Front File</span>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Back Side (Optional)</label>
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleTemplateUpload(e, 'back')} />
                  <div className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${backBgImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600'}`}>
                    {backBgImage ? (
                      <span className="font-bold text-xs flex items-center gap-2"><FileCheck size={16} /> Back Uploaded</span>
                    ) : (
                      <span className="font-bold text-xs flex items-center gap-2"><UploadCloud size={16} /> Select Back File</span>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Dataset Card */}
          <div className={`bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden transition-all ${anyBgImage ? 'hover:shadow-lg' : 'opacity-60 grayscale'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${datasetReady ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Database size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">2. The ID Dataset</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Upload the Excel file containing the cardholder information. This will automatically generate your text fields.</p>
            
            <label className={`block ${anyBgImage ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleDatasetUpload} disabled={!anyBgImage} />
              <div className={`w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${datasetReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600'}`}>
                {datasetReady ? (
                  <span className="font-bold flex items-center gap-2"><FileCheck size={20} /> {design.idCard.bulkWorkflow.datasetRecords.length} Records Loaded</span>
                ) : (
                  <span className="font-bold flex items-center gap-2"><UploadCloud size={20} /> Upload Dataset</span>
                )}
              </div>
            </label>
            {!anyBgImage && <div className="text-sm font-bold text-slate-400 mt-5 text-center px-4 py-3 bg-slate-50 rounded-xl">Please upload a template first</div>}
          </div>

          {/* Photos Card */}
          <div className={`bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden transition-all ${hasPhotos ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200'} ${datasetReady ? 'hover:shadow-lg' : 'opacity-60 grayscale'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${hasPhotos ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
              {hasPhotos ? <CheckCircle size={28} /> : <ImageIcon size={28} />}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">3. Batch Photos</h3>
             <p className="text-slate-500 text-sm mb-4 leading-relaxed">Upload a ZIP or folder of student photos. File names MUST match the Excel IDs exactly (e.g. 1025.jpg).</p>
            
            {datasetReady && (
              <div className="mb-5">
                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Match photos with column:</label>
                 <select 
                   value={imageMatchColumn || ''}
                   onChange={(e) => setField('idCard.bulkWorkflow.imageMatchColumn', e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/50"
                 >
                   <option value="" disabled>Select a column...</option>
                   {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                 </select>
              </div>
            )}
            
            {/* Hidden file input - controlled via ref (NOT inside a label to avoid disabled/pointer-events conflicts) */}
            <input 
              ref={photoInputRef}
              type="file" 
              multiple 
              accept="image/*,.zip,application/zip,application/x-zip-compressed"
              style={{ display: 'none' }}
              onChange={handleBatchPhotos}
            />
            
            {/* Clickable button triggers file input via ref */}
            <button
              type="button"
              onClick={() => {
                if (datasetReady && imageMatchColumn && photoInputRef.current) {
                  console.log('[BatchPhotos] Opening file picker...');
                  photoInputRef.current.click();
                }
              }}
              disabled={!datasetReady || !imageMatchColumn}
              className={`w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-all font-bold ${
                !datasetReady || !imageMatchColumn
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                  : hasPhotos 
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer' 
                    : 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-600 cursor-pointer'
              }`}
            >
              {isProcessingPhotos ? (
                <span className="flex items-center gap-2 animate-pulse">Processing...</span>
              ) : hasPhotos ? (
                <span className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-500" /> 
                  {photoCount} Photos Loaded {matchedImageCount > 0 && `• ${matchedImageCount} Matched`}
                </span>
              ) : (
                <span className="flex items-center gap-2"><UploadCloud size={20} /> Select Photos or ZIP</span>
              )}
            </button>
            
            {!datasetReady && <div className="text-sm font-bold text-slate-400 mt-5 text-center px-4 py-3 bg-slate-50 rounded-xl">Load dataset first</div>}
            {datasetReady && !imageMatchColumn && <div className="text-xs font-bold text-slate-400 mt-2 text-center text-orange-500 animate-pulse">Please select a matching column above</div>}
            {hasPhotos && matchedImageCount > 0 && (
              <div className={`mt-3 text-center text-xs font-bold py-2 rounded-xl ${photosFullyMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {photosFullyMatched ? '✓ All records matched with photos!' : `${datasetRecords.length - matchedImageCount} records still missing photos`}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setField('idCard.bulkWorkflow.mode', 'design')}
            disabled={!anyBgImage || !datasetReady}
            className={`px-10 py-4 rounded-full font-black text-lg transition-all flex items-center gap-3 shadow-lg ${anyBgImage && datasetReady ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 hover:shadow-indigo-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
            Enter Design Workspace <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
