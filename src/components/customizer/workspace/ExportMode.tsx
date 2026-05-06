import React, { useRef, useState } from 'react';
import { useConfiguratorStore } from '../../../store/useConfiguratorStore';
import IdCardPreview from '../IdCardPreview';
import { Stage, Layer, Group, Rect } from 'react-konva';
import { Download, Package2, Printer, CheckCircle2, ChevronLeft, ChevronRight, Play, Grid, Columns, Eye, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

const cardSizes: Record<string, { width: number; height: number }> = {
  '86x54': { width: 244, height: 153 },
  '100x70': { width: 283, height: 198 },
  '54x86': { width: 153, height: 244 },
  '70x100': { width: 198, height: 283 },
};

export default function ExportMode({ stageRef, idCardStageRef }: any) {
  const design = useConfiguratorStore(state => state.design);
  const setField = useConfiguratorStore(state => state.setField);
  const { datasetRecords, sampleRecordIndex, mapping } = design.idCard.bulkWorkflow;
  const totalRecords = datasetRecords?.length || 0;
  const showBothSides = design.idCard.showBothSides;
  const hasBackTemplate = !!design.idCard.back.backgroundImage || design.idCard.back.elements.length > 0;
  const dualSide = showBothSides && hasBackTemplate;

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { size } = design.idCard;
  const { width, height } = cardSizes[size] || cardSizes['86x54'];
  const exportSettings = design.idCard.bulkWorkflow.exportSettings;
  
  // Calculate mm to px ratio (based on CR80 86mm = 244px)
  const mmToPx = 244 / 86;
  const bleedPx = (exportSettings?.bleed || 0) * mmToPx;
  
  // Adjusted stage dimensions for bleed
  const stageW = width + (bleedPx * 2);
  const stageH = height + (bleedPx * 2);

  const exportStageRef = useRef<any>(null);
  const exportBackStageRef = useRef<any>(null);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setField('idCard.bulkWorkflow.sampleRecordIndex', Number(e.target.value));
  };

  const handleExportBatch = async (format: 'pdf' | 'zip' | 'grid') => {
    if (!totalRecords || !exportStageRef.current) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const zip = new JSZip();
      const exportSettings = design.idCard.bulkWorkflow.exportSettings || {
        dpi: 300, pageSize: 'A3', bleed: 0, marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10, gutterX: 0, gutterY: 0, showCutLines: false, showRegistrationMarks: true, mirrorBackside: true
      };
      
      let pageW = 297, pageH = 420;
      if (exportSettings.pageSize === 'A4') { pageW = 210; pageH = 297; }
      else if (exportSettings.pageSize === 'Legal') { pageW = 216; pageH = 356; }
      else if (exportSettings.pageSize === 'Custom') { pageW = exportSettings.customWidth || 210; pageH = exportSettings.customHeight || 297; }
      
      const [cWStr, cHStr] = design.idCard.size.split('x');
      const bleed = exportSettings.bleed || 0;
      const originalWmm = (parseFloat(cWStr) > 0 ? parseFloat(cWStr) : 86);
      const originalHmm = (parseFloat(cHStr) > 0 ? parseFloat(cHStr) : 54);
      const cardWmm = originalWmm + (bleed * 2);
      const cardHmm = originalHmm + (bleed * 2);
      
      const availW = pageW - exportSettings.marginLeft - exportSettings.marginRight;
      const availH = pageH - exportSettings.marginTop - exportSettings.marginBottom;
      
      const maxCols = Math.max(1, Math.floor((availW + exportSettings.gutterX) / (cardWmm + exportSettings.gutterX)));
      const maxRows = Math.max(1, Math.floor((availH + exportSettings.gutterY) / (cardHmm + exportSettings.gutterY)));
      
      const gapX = exportSettings.gutterX;
      const gapY = exportSettings.gutterY;
      const totalGridW = maxCols * cardWmm + (maxCols - 1) * gapX;
      // Center the grid in the available area
      const marginX = exportSettings.marginLeft + Math.max(0, (availW - totalGridW) / 2);
      const marginY = exportSettings.marginTop;
      
      const cardsPerPage = maxCols * maxRows;
      
      // Dual-side logic: Front on one page, Back on the NEXT page (Mirrored)
      // This is the standard for Duplex printing.
      const dualCardsPerPage = maxCols * maxRows;

      // Helper: rotate an image data URL by 180 degrees
      const rotateImage180 = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            resolve(canvas.toDataURL('image/png', 1));
          };
          img.src = dataUrl;
        });
      };

      // Helper: draw crop marks around a card position
      const drawCropMarks = (x: number, y: number, w: number, h: number) => {
        pdf.setLineWidth(0.2);
        pdf.setDrawColor('#00ffff');
        const L = 2;
        pdf.line(x - L, y, x, y);
        pdf.line(x, y - L, x, y);
        pdf.line(x + w, y, x + w + L, y);
        pdf.line(x + w, y - L, x + w, y);
        pdf.line(x - L, y + h, x, y + h);
        pdf.line(x, y + h, x, y + h + L);
        pdf.line(x + w, y + h, x + w + L, y + h);
        pdf.line(x + w, y + h, x + w, y + h + L);
      };

      // Helper: draw vector cut-lines for die-cutting (Magenta)
      const drawCutLines = (x: number, y: number, w: number, h: number) => {
        pdf.setLineWidth(0.3); // Thin vector line
        pdf.setDrawColor('#FF00FF'); // 100% Magenta
        // Assuming standard 3mm corner radius, but plotters will read the vector path regardless
        pdf.roundedRect(x, y, w, h, 3, 3, 'S'); 
      };

      let pdfFormat: [number, number] | string = [width + 20, height + 20];
      if (format === 'grid') pdfFormat = [pageW, pageH];

      const pdf = new jsPDF({
        orientation: (format === 'grid') ? 'p' : (width > height ? 'l' : 'p'),
        unit: (format === 'grid') ? 'mm' : 'px',
        format: pdfFormat 
      });

      const totalSteps = dualSide ? totalRecords * 2 : totalRecords;
      let stepsDone = 0;

      if (format === 'grid' && dualSide && exportBackStageRef.current) {
        // ===== DUAL-SIDE GRID: Front on Page 1, Back on Page 2 (Mirrored) =====
        let currentPageFrontIndex = 0;
        let frontCardsBuffer: {dataUrl: string, i: number}[] = [];
        let backCardsBuffer: {dataUrl: string, i: number}[] = [];

        const flushPagePair = () => {
           if (frontCardsBuffer.length === 0) return;
           
           // Render Front Page
           if (currentPageFrontIndex > 0) pdf.addPage([pageW, pageH], 'p');
           
           frontCardsBuffer.forEach((item, idx) => {
               const col = idx % maxCols;
               const row = Math.floor(idx / maxCols);
               const x = marginX + col * (originalWmm + gapX + (bleed * 2));
               const y = marginY + row * (originalHmm + gapY + (bleed * 2));
               
               // In PDF, we place the image (which includes bleed)
               pdf.addImage(item.dataUrl, 'PNG', x, y, cardWmm, cardHmm);
               
               // We draw marks relative to the actual card (inside the bleed)
               if (exportSettings.showRegistrationMarks) drawCropMarks(x + bleed, y + bleed, originalWmm, originalHmm);
               if (exportSettings.showCutLines) drawCutLines(x + bleed, y + bleed, originalWmm, originalHmm);
           });

           // Render Back Page
           pdf.addPage([pageW, pageH], 'p');
           backCardsBuffer.forEach((item, idx) => {
              // For duplex, the back needs to be horizontally mirrored relative to the grid
               const col = idx % maxCols;
               const row = Math.floor(idx / maxCols);
               
               let renderCol = col;
               if (exportSettings.mirrorBackside) {
                  renderCol = (maxCols - 1) - col;
               }
               
               const x = marginX + renderCol * (originalWmm + gapX + (bleed * 2));
               const y = marginY + row * (originalHmm + gapY + (bleed * 2));
               
               pdf.addImage(item.dataUrl, 'PNG', x, y, cardWmm, cardHmm);
               if (exportSettings.showRegistrationMarks) drawCropMarks(x + bleed, y + bleed, originalWmm, originalHmm);
               if (exportSettings.showCutLines) drawCutLines(x + bleed, y + bleed, originalWmm, originalHmm);
           });

           currentPageFrontIndex++;
           frontCardsBuffer = [];
           backCardsBuffer = [];
        };

        for (let i = 0; i < totalRecords; i++) {
          setField('idCard.bulkWorkflow.sampleRecordIndex', i);
          await new Promise(r => setTimeout(r, 150));

          const frontDataUrl = exportStageRef.current.toDataURL({ pixelRatio: 4.2, quality: 1 });
          const backDataUrl = exportBackStageRef.current.toDataURL({ pixelRatio: 4.2, quality: 1 });
          
          frontCardsBuffer.push({ dataUrl: frontDataUrl, i });
          backCardsBuffer.push({ dataUrl: backDataUrl, i });

          if (frontCardsBuffer.length === dualCardsPerPage) {
             flushPagePair();
          }

          stepsDone += 2;
          setExportProgress(Math.round((stepsDone / totalSteps) * 100));
        }
        
        flushPagePair(); // flush any remaining
      } else {
        // ===== SINGLE-SIDE GRID or non-grid formats =====
        for (let i = 0; i < totalRecords; i++) {
          setField('idCard.bulkWorkflow.sampleRecordIndex', i);
          await new Promise(r => setTimeout(r, 150));
          
          const frontDataUrl = exportStageRef.current.toDataURL({ pixelRatio: 4.2, quality: 1 });
          
          const record = datasetRecords[i];
          const nameKey = Object.keys(mapping).find(k => mapping[k]?.toLowerCase().includes('name')) || Object.keys(mapping)[0];
          
          let fileName = `Card_${i + 1}`;
          if (nameKey && record[mapping[nameKey]]) {
            fileName = record[mapping[nameKey]].toString().replace(/[^a-z0-9\s]/gi, '').trim() || fileName;
          }

          if (format === 'zip') {
            const imgData = frontDataUrl.split('base64,')[1];
            zip.file(`${fileName}${dualSide ? '_front' : ''}.png`, imgData, { base64: true });
          } else if (format === 'grid') {
            const pageIndex = i % cardsPerPage;
            if (pageIndex === 0 && i > 0) {
              pdf.addPage([pageW, pageH], 'p');
            }
            
            const col = pageIndex % maxCols;
            const row = Math.floor(pageIndex / maxCols);
            const x = marginX + col * (originalWmm + gapX + (bleed * 2));
            const y = marginY + row * (originalHmm + gapY + (bleed * 2));
            
            pdf.addImage(frontDataUrl, 'PNG', x, y, cardWmm, cardHmm);
            if (exportSettings.showRegistrationMarks) drawCropMarks(x + bleed, y + bleed, originalWmm, originalHmm);
            if (exportSettings.showCutLines) drawCutLines(x + bleed, y + bleed, originalWmm, originalHmm);
          } else {
            if (i > 0) pdf.addPage([width + 20, height + 20]);
            pdf.addImage(frontDataUrl, 'PNG', 10, 10, width, height);
            pdf.setLineWidth(1);
            pdf.setDrawColor('#00ffff');
            pdf.line(5, 10, 5, 20);
            pdf.line(10, 5, 20, 5);
            pdf.line(width + 15, 10, width + 15, 20);
            pdf.line(width, 5, width + 10, 5);
          }

          stepsDone++;
          setExportProgress(Math.round((stepsDone / totalSteps) * 100));

          // --- BACK SIDE for non-grid formats ---
          if (dualSide && exportBackStageRef.current && format !== 'grid') {
            await new Promise(r => setTimeout(r, 100));
            const backDataUrl = exportBackStageRef.current.toDataURL({ pixelRatio: 4.2, quality: 1 });

            if (format === 'zip') {
              const backImgData = backDataUrl.split('base64,')[1];
              zip.file(`${fileName}_back.png`, backImgData, { base64: true });
            } else if (format === 'pdf') {
              pdf.addPage([width + 20, height + 20]);
              pdf.addImage(backDataUrl, 'PNG', 10, 10, width, height);
              pdf.setLineWidth(1);
              pdf.setDrawColor('#00ffff');
              pdf.line(5, 10, 5, 20);
              pdf.line(10, 5, 20, 5);
              pdf.line(width + 15, 10, width + 15, 20);
              pdf.line(width, 5, width + 10, 5);
            }
            stepsDone++;
            setExportProgress(Math.round((stepsDone / totalSteps) * 100));
          }
        }
      }

      if (format === 'zip') {
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'id_cards_batch.zip');
      } else if (format === 'grid') {
        pdf.save('id_cards_A3_press_sheet.pdf');
      } else {
        pdf.save('id_cards_print_ready.pdf');
      }

      try {
        const historyData = JSON.parse(localStorage.getItem('gotek-export-history') || '[]');
        const newRecord = {
            id: Date.now(),
            name: `Project Batch (${format.toUpperCase()}${dualSide ? ' - 2-Sided' : ''})`,
            format: format.toUpperCase(),
            size: format === 'zip' ? 'ZIP Archive' : 'Ready to Print',
            cards: totalRecords,
            status: 'completed',
            createdAt: new Date().toISOString().split('T')[0],
            time: 'Just now'
        };
        historyData.unshift(newRecord);
        localStorage.setItem('gotek-export-history', JSON.stringify(historyData.slice(0, 50)));
      } catch (e) {
        console.error("Could not save history to localStorage", e);
      }
      
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export. Check your templates.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      <div className="flex-1 flex overflow-hidden">
        {/* Review Area */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 flex flex-col items-center">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Final Review</h3>
            <p className="text-slate-500 text-sm font-medium mb-6 text-center max-w-sm">Use the Data Scrubber to preview the generated ID cards before exporting.</p>
            
            {/* Side Toggle for Preview (when dual-side) */}
            {dualSide && (
              <div className="flex items-center gap-2 mb-6 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  onClick={() => setPreviewSide('front')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${previewSide === 'front' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Front Side
                </button>
                <button
                  onClick={() => setPreviewSide('back')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${previewSide === 'back' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Back Side
                </button>
              </div>
            )}

            <div className="flex gap-6 items-start">
              {/* Front preview */}
              <div className={`relative shadow-lg ring-1 ring-slate-200/50 rounded-2xl overflow-hidden bg-slate-50 ${dualSide && previewSide !== 'front' ? 'hidden' : ''}`} style={{ width: stageW, height: stageH }}>
                <Stage width={stageW} height={stageH} scaleX={1} scaleY={1} ref={exportStageRef}>
                  <Layer>
                    <Group x={bleedPx} y={bleedPx}>
                      <IdCardPreview 
                        isReviewStep={true}
                        record={datasetRecords?.[sampleRecordIndex] || null}
                        mapping={mapping}
                        forceSide="front"
                      />
                    </Group>
                    {exportSettings?.showCutLines && (
                      <Rect 
                        x={bleedPx} 
                        y={bleedPx} 
                        width={width} 
                        height={height} 
                        stroke="#FF00FF" 
                        strokeWidth={1} 
                        cornerRadius={design.idCard.cornerRadius || 0}
                        listening={false}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>

              {/* Back preview (only when dual-side) */}
              {dualSide && (
                <div className={`relative shadow-lg ring-1 ring-slate-200/50 rounded-2xl overflow-hidden bg-slate-50 ${previewSide !== 'back' ? 'hidden' : ''}`} style={{ width: stageW, height: stageH }}>
                  <Stage width={stageW} height={stageH} scaleX={1} scaleY={1} ref={exportBackStageRef}>
                    <Layer>
                      <Group x={bleedPx} y={bleedPx}>
                        <IdCardPreview 
                          isReviewStep={true}
                          record={datasetRecords?.[sampleRecordIndex] || null}
                          mapping={mapping}
                          forceSide="back"
                        />
                      </Group>
                      {exportSettings?.showCutLines && (
                        <Rect 
                          x={bleedPx} 
                          y={bleedPx} 
                          width={width} 
                          height={height} 
                          stroke="#FF00FF" 
                          strokeWidth={1} 
                          cornerRadius={design.idCard.cornerRadius || 0}
                          listening={false}
                        />
                      )}
                    </Layer>
                  </Stage>
                </div>
              )}
            </div>

            {dualSide && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                <Columns size={14} />
                <span>2-Sided Printing Enabled</span>
              </div>
            )}
            
            {/* Scrubber Tool */}
            <div className="mt-8 w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Record {sampleRecordIndex + 1} of {totalRecords}</span>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest flex items-center gap-1"><Play size={10}/> Zero-Latency Scrubbing</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setField('idCard.bulkWorkflow.sampleRecordIndex', Math.max(0, sampleRecordIndex - 1))}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 shadow-sm"
                >
                  <ChevronLeft size={18}/>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max={Math.max(0, totalRecords - 1)} 
                  value={sampleRecordIndex} 
                  onChange={handleSlider}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-indigo-600"
                />
                <button 
                  onClick={() => setField('idCard.bulkWorkflow.sampleRecordIndex', Math.min(totalRecords - 1, sampleRecordIndex + 1))}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 shadow-sm"
                >
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export Panel */}
        <div className="w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col relative z-20">
          <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2"><CheckCircle2 size={24} className="text-emerald-500"/> Ready to Export</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Your design has been mapped to {totalRecords} records{dualSide ? ' (Front + Back)' : ''} flawlessly.</p>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="text-[11px] font-black uppercase text-slate-400">Layout Settings</div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500">Sheet Size</label>
                <select 
                  value={design.idCard.bulkWorkflow.exportSettings?.pageSize || 'A3'}
                  onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.pageSize', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="A3">A3 (297 x 420 mm)</option>
                  <option value="Legal">Legal (216 x 356 mm)</option>
                  <option value="Custom">Custom Sheet</option>
                </select>
              </div>

              {design.idCard.bulkWorkflow.exportSettings?.pageSize === 'Custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Width (mm)</label>
                    <input type="number" value={design.idCard.bulkWorkflow.exportSettings?.customWidth || 210} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.customWidth', Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Height (mm)</label>
                    <input type="number" value={design.idCard.bulkWorkflow.exportSettings?.customHeight || 297} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.customHeight', Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Gutter X (mm)</label>
                  <input type="number" min="0" value={design.idCard.bulkWorkflow.exportSettings?.gutterX || 0} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.gutterX', Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Gutter Y (mm)</label>
                  <input type="number" min="0" value={design.idCard.bulkWorkflow.exportSettings?.gutterY || 0} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.gutterY', Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(design.idCard.bulkWorkflow.exportSettings?.bleed || 0) > 0} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.bleed', e.target.checked ? 3 : 0)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Include 3mm Bleed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={design.idCard.bulkWorkflow.exportSettings?.showRegistrationMarks ?? true} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.showRegistrationMarks', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Crop Marks (Crosshairs)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={design.idCard.bulkWorkflow.exportSettings?.showCutLines || false} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.showCutLines', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Vector Cut-Lines (Magenta)</span>
                </label>
                {dualSide && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={design.idCard.bulkWorkflow.exportSettings?.mirrorBackside ?? true} onChange={(e) => setField('idCard.bulkWorkflow.exportSettings.mirrorBackside', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">Mirror Backside (Duplex)</span>
                  </label>
                )}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
              <button 
                onClick={() => setShowPreviewModal(true)}
                className="w-full bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl py-3 px-5 flex items-center justify-center gap-2 hover:bg-slate-200 hover:text-slate-900 transition-all font-bold text-sm"
              >
                <Eye size={16} /> Advanced Print Preview
              </button>
              <button 
                onClick={() => handleExportBatch('grid')}
                disabled={isExporting}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl py-4 px-5 flex items-center gap-4 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                 <Grid size={24} />
              </div>
              <div className="text-left flex-1 relative z-10">
                <div className="font-bold text-lg leading-tight">Print PDF</div>
                <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider mt-0.5">{dualSide ? 'Front + Back Sheets' : 'Multi-Card Grid'}</div>
              </div>
            </button>
            <button 
              onClick={() => handleExportBatch('zip')}
              disabled={isExporting}
              className="w-full bg-white border border-slate-200 text-slate-700 rounded-2xl py-3 px-5 flex items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
            >
              <Package2 size={16} /> Image Archive (ZIP)
            </button>
        </div>
      </div>
    </div>

    {isExporting && (
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in">
        <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-inner">
             <Download size={32}/>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Generating...</h3>
          <p className="text-slate-500 font-medium mb-8">Processing {totalRecords} high-resolution cards{dualSide ? ' (Front + Back)' : ''}.</p>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
            <div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${exportProgress}%` }} />
          </div>
          <p className="mt-4 font-black text-indigo-600 tracking-tight">{exportProgress}% Complete</p>
        </div>
      </div>
    )}

    {/* Advanced Layout Preview Modal */}
    {showPreviewModal && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in p-4 md:p-8">
        <div className="bg-slate-100 rounded-[32px] w-full max-w-5xl h-full flex flex-col overflow-hidden shadow-2xl border border-white/20">
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xl font-black text-slate-800">Print Layout Preview</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{design.idCard.bulkWorkflow.exportSettings?.pageSize || 'A3'} Sheet • {dualSide ? 'Duplex Printing' : 'Single-Sided'}</p>
            </div>
            <button onClick={() => setShowPreviewModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center custom-scrollbar">
            {(() => {
              // Calculate Layout Math visually
              const exportSettings = design.idCard.bulkWorkflow.exportSettings || { 
                pageSize: 'A3', 
                bleed: 0, 
                marginTop: 10, 
                marginBottom: 10, 
                marginLeft: 10, 
                marginRight: 10, 
                gutterX: 0, 
                gutterY: 0,
                showRegistrationMarks: true,
                showCutLines: false,
                mirrorBackside: true
              };
              let pageW = 297, pageH = 420;
              if (exportSettings.pageSize === 'A4') { pageW = 210; pageH = 297; }
              else if (exportSettings.pageSize === 'Legal') { pageW = 216; pageH = 356; }
              else if (exportSettings.pageSize === 'Custom') { pageW = exportSettings.customWidth || 210; pageH = exportSettings.customHeight || 297; }
              
              const [cWStr, cHStr] = design.idCard.size.split('x');
              const bleed = exportSettings.bleed || 0;
              const cardWmm = (parseFloat(cWStr) > 0 ? parseFloat(cWStr) : 86) + (bleed * 2);
              const cardHmm = (parseFloat(cHStr) > 0 ? parseFloat(cHStr) : 54) + (bleed * 2);
              
              const availW = pageW - exportSettings.marginLeft - exportSettings.marginRight;
              const availH = pageH - exportSettings.marginTop - exportSettings.marginBottom;
              
              const maxCols = Math.max(1, Math.floor((availW + exportSettings.gutterX) / (cardWmm + exportSettings.gutterX)));
              const maxRows = Math.max(1, Math.floor((availH + exportSettings.gutterY) / (cardHmm + exportSettings.gutterY)));
              const cardsPerPage = maxCols * maxRows;
              
              // Scale down for preview (approximate scale)
              const scale = Math.min(800 / pageW, 600 / pageH);
              
              return (
                <div className="flex flex-col items-center gap-6">
                  {/* Front Sheet */}
                  <div>
                    <div className="text-center font-bold text-slate-500 mb-3 text-sm uppercase tracking-widest">Front Sheet (First Page)</div>
                    <div className="bg-white shadow-xl relative" style={{ width: pageW * scale, height: pageH * scale }}>
                      {/* Grid representation */}
                      {Array.from({ length: Math.min(totalRecords, cardsPerPage) }).map((_, i) => {
                         const row = Math.floor(i / maxCols);
                         const col = i % maxCols;
                         const totalGridW = maxCols * cardWmm + (maxCols - 1) * exportSettings.gutterX;
                         const marginX = exportSettings.marginLeft + Math.max(0, (availW - totalGridW) / 2);
                         const x = marginX + col * (cardWmm + exportSettings.gutterX);
                         const y = exportSettings.marginTop + row * (cardHmm + exportSettings.gutterY);
                         return (
                           <div key={`front-${i}`} className="absolute flex items-center justify-center"
                             style={{ left: x * scale, top: y * scale, width: cardWmm * scale, height: cardHmm * scale }}
                           >
                             <div className={`absolute inset-0 ${bleed > 0 ? 'bg-indigo-100/50' : 'bg-indigo-50/50'} ${exportSettings?.showCutLines ? '' : 'border border-indigo-200'}`}></div>
                             
                             {exportSettings?.showCutLines && (
                               <div className="absolute border border-[#FF00FF] z-10"
                                 style={{ width: (cardWmm - bleed * 2) * scale, height: (cardHmm - bleed * 2) * scale, borderRadius: 2 }}
                               ></div>
                             )}

                             {exportSettings?.showRegistrationMarks && (
                               <>
                                 <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-slate-900"></div>
                                 <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-slate-900"></div>
                                 <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-slate-900"></div>
                                 <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-slate-900"></div>
                               </>
                             )}

                             <div className="z-0">
                               {i === 0 ? (
                                 <span className="text-[7px] font-black text-indigo-400 opacity-60 uppercase whitespace-nowrap">Rec 1</span>
                               ) : (
                                 <span className="text-[6px] font-bold text-slate-300">R{i+1}</span>
                               )}
                             </div>
                           </div>
                         )
                      })}
                    </div>
                  </div>
                  
                  {/* Back Sheet (if dual-sided) */}
                  {dualSide && (
                    <div className="mt-8">
                      <div className="text-center font-bold text-slate-500 mb-3 text-sm uppercase tracking-widest">Back Sheet (Mirrored for Duplex)</div>
                      <div className="bg-white shadow-xl relative" style={{ width: pageW * scale, height: pageH * scale }}>
                        {Array.from({ length: Math.min(totalRecords, cardsPerPage) }).map((_, i) => {
                           const row = Math.floor(i / maxCols);
                           // Mirrored logic for duplex: column is inverted
                           const isMirrored = exportSettings.mirrorBackside ?? true;
                           const col = isMirrored ? (maxCols - 1 - (i % maxCols)) : (i % maxCols);
                           const totalGridW = maxCols * cardWmm + (maxCols - 1) * exportSettings.gutterX;
                           const marginX = exportSettings.marginLeft + Math.max(0, (availW - totalGridW) / 2);
                           const x = marginX + col * (cardWmm + exportSettings.gutterX);
                           const y = exportSettings.marginTop + row * (cardHmm + exportSettings.gutterY);
                           return (
                             <div key={`back-${i}`} className="absolute flex items-center justify-center"
                               style={{ left: x * scale, top: y * scale, width: cardWmm * scale, height: cardHmm * scale }}
                             >
                               <div className={`absolute inset-0 ${bleed > 0 ? 'bg-emerald-100/50' : 'bg-emerald-50/50'} ${exportSettings?.showCutLines ? '' : 'border border-emerald-200'}`}></div>
                               
                               {exportSettings?.showCutLines && (
                                 <div className="absolute border border-[#FF00FF] z-10"
                                   style={{ width: (cardWmm - bleed * 2) * scale, height: (cardHmm - bleed * 2) * scale, borderRadius: 2 }}
                                 ></div>
                               )}

                               {exportSettings?.showRegistrationMarks && (
                                 <>
                                   <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-slate-900"></div>
                                   <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-slate-900"></div>
                                   <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-slate-900"></div>
                                   <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-slate-900"></div>
                                 </>
                               )}

                               <div className="z-0">
                                 {i === 0 ? (
                                   <span className="text-[7px] font-black text-emerald-400 opacity-60 uppercase whitespace-nowrap">Rec 1</span>
                                 ) : (
                                   <span className="text-[6px] font-bold text-slate-300">R{i+1}</span>
                                 )}
                               </div>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
             <button onClick={() => {setShowPreviewModal(false); handleExportBatch('grid');}} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
               Looks Good, Print PDF <ChevronRight size={16}/>
             </button>
          </div>
        </div>
      </div>
    )}
    </div>
  </div>
);
}
