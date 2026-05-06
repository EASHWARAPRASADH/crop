import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, ArrowRight, LayoutTemplate, Database, Image as ImageIcon, CheckCircle, Plus, X, GitBranch, AlertCircle, RotateCcw } from 'lucide-react';
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

import { hydrateBatchImageStore, getBatchImageKeys, batchImageStore } from '../../../utils/batchImageStore';

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

  const handleVariantTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantId: string, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let dataUrl = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        dataUrl = await convertPdfToImage(file);
      } else {
        const reader = new FileReader();
        dataUrl = await new Promise((resolve) => {
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      }
      
      const updatedVariants = [...(design.idCard.bulkWorkflow.templateVariants || [])];
      const variantIndex = updatedVariants.findIndex(v => v.id === variantId);
      if (variantIndex >= 0) {
        if (side === 'front') updatedVariants[variantIndex].frontImage = dataUrl;
        if (side === 'back') updatedVariants[variantIndex].backImage = dataUrl;
        setField('idCard.bulkWorkflow.templateVariants', updatedVariants);
      }
    } catch (err) {
      console.error('Error processing variant template', err);
      alert('Could not upload variant template.');
    }
  };

  const addTemplateVariant = () => {
    const newVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${(design.idCard.bulkWorkflow.templateVariants || []).length + 1}`,
      condition: { column: datasetColumns[0] || '', value: '' },
      frontImage: null,
      backImage: null
    };
    setField('idCard.bulkWorkflow.templateVariants', [...(design.idCard.bulkWorkflow.templateVariants || []), newVariant]);
  };

  const updateVariantCondition = (id: string, key: 'column' | 'value', val: string) => {
    const updated = (design.idCard.bulkWorkflow.templateVariants || []).map(v => 
      v.id === id ? { ...v, condition: { ...v.condition, [key]: val } } : v
    );
    setField('idCard.bulkWorkflow.templateVariants', updated);
  };

  const removeVariant = (id: string) => {
    const updated = (design.idCard.bulkWorkflow.templateVariants || []).filter(v => v.id !== id);
    setField('idCard.bulkWorkflow.templateVariants', updated);
  };

  const resetWorkspace = () => {
    if (confirm('Are you sure you want to clear EVERYTHING? This will delete all your design elements, dataset, and templates.')) {
      setField('idCard.bulkWorkflow.datasetRecords', []);
      setField('idCard.bulkWorkflow.datasetColumns', []);
      setField('idCard.bulkWorkflow.templateVariants', []);
      setField('idCard.bulkWorkflow.datasetImages', {});
      setField('idCard.front.backgroundImage', null);
      setField('idCard.back.backgroundImage', null);
      setField('idCard.front.elements', []);
      setField('idCard.back.elements', []);
      setField('idCard.bulkWorkflow.mode', 'setup');
    }
  };

  const getMatchCount = (variant: any) => {
    if (!datasetRecords || !variant.condition.column || !variant.condition.value) return 0;
    return datasetRecords.filter((r: any) => 
      r[variant.condition.column]?.toString().trim().toLowerCase() === variant.condition.value.trim().toLowerCase()
    ).length;
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
        <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Workspace Setup</h1>
              <p className="text-slate-500 font-medium mt-1">Define your visual template and your data source to begin.</p>
            </div>
            <button 
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors border border-transparent hover:border-red-100"
            >
              <RotateCcw size={16} /> Reset Workspace
            </button>
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

        {/* Template Intelligence Section */}
        {datasetReady && anyBgImage && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-10 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <GitBranch size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Template Intelligence</h3>
                  <p className="text-slate-500 text-sm">Automatically swap templates based on dataset values (e.g. branch, department).</p>
                </div>
              </div>
              <button 
                onClick={addTemplateVariant}
                disabled={(design.idCard.bulkWorkflow.templateVariants || []).length >= 4}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Add Variant
              </button>
            </div>

            {(design.idCard.bulkWorkflow.templateVariants || []).length > 0 ? (
              <div className="space-y-4">
                {(design.idCard.bulkWorkflow.templateVariants || []).map((variant, idx) => (
                  <div key={variant.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-start gap-6 relative">
                    <button onClick={() => removeVariant(variant.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-black text-purple-600 uppercase tracking-widest text-[10px] px-2 py-0.5 bg-purple-50 rounded border border-purple-100">
                            {variant.condition.value ? `Variant: ${variant.condition.value}` : `Rule ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                             <Database size={12}/>
                             {getMatchCount(variant)} Records Match
                          </div>
                        </div>
                        {(!variant.frontImage && !variant.backImage) && (
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded animate-pulse">
                            <AlertCircle size={10}/> No artwork uploaded
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-500">IF</span>
                          <select 
                            value={variant.condition.column}
                            onChange={(e) => updateVariantCondition(variant.id, 'column', e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none flex-1 max-w-[200px]"
                          >
                            {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                          </select>
                          <span className="text-sm font-bold text-slate-500">EQUALS</span>
                          <input 
                            type="text"
                            placeholder="Value (e.g. North)"
                            value={variant.condition.value}
                            onChange={(e) => updateVariantCondition(variant.id, 'value', e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <label className="cursor-pointer flex-1">
                          <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleVariantTemplateUpload(e, variant.id, 'front')} />
                          <div className={`w-full py-3 rounded-xl border border-dashed flex items-center justify-center transition-colors text-xs font-bold ${variant.frontImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'}`}>
                            {variant.frontImage ? <><FileCheck size={14} className="mr-2"/> Front Uploaded</> : <><UploadCloud size={14} className="mr-2"/> Upload Specific Front</>}
                          </div>
                        </label>
                        <label className="cursor-pointer flex-1">
                          <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleVariantTemplateUpload(e, variant.id, 'back')} />
                          <div className={`w-full py-3 rounded-xl border border-dashed flex items-center justify-center transition-colors text-xs font-bold ${variant.backImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'}`}>
                            {variant.backImage ? <><FileCheck size={14} className="mr-2"/> Back Uploaded</> : <><UploadCloud size={14} className="mr-2"/> Upload Specific Back</>}
                          </div>
                        </label>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="py-6 px-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-center text-slate-500 text-sm font-medium">
                No variants configured. All records will use the default templates above.
              </div>
            )}
          </div>
        )}

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
