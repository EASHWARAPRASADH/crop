import React, { useRef, useState } from 'react';
import { useConfiguratorStore } from '../../../store/useConfiguratorStore';
import IdCardPreview from '../IdCardPreview';
import { Stage, Layer } from 'react-konva';
import { Download, Package2, Printer, CheckCircle2, ChevronLeft, ChevronRight, Play, Grid, Columns } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

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

  const { width, height } = React.useMemo(() => {
    switch (design.idCard.size) {
      case '100x70': return { width: 283, height: 198 };
      case '70x100': return { width: 198, height: 283 };
      case '54x86': return { width: 153, height: 244 };
      default: return { width: 244, height: 153 }; // 86x54
    }
  }, [design.idCard.size]);
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
      
      const pageW = 297, pageH = 420;
      
      const [cWStr, cHStr] = design.idCard.size.split('x');
      const cardWmm = parseFloat(cWStr) > 0 ? parseFloat(cWStr) : 86;
      const cardHmm = parseFloat(cHStr) > 0 ? parseFloat(cHStr) : 54;
      
      // Fixed grid: 5 columns × 4 rows (5 across, 4 down) — no gap between cards in a row
      const maxCols = 5;
      const maxRows = 4;
      
      // No horizontal gap — cards sit edge-to-edge; center the block on the page
      const gapX = 0;
      const totalGridW = maxCols * cardWmm;
      const marginX = (pageW - totalGridW) / 2;
      // Vertical spacing evenly distributed between rows
      const gapY = (pageH - maxRows * cardHmm) / (maxRows + 1);
      const marginY = gapY;
      
      const cardsPerPage = maxCols * maxRows; // 20 cards per page (single-side)
      
      // For dual-side grid: each pair-row = front card + back card (180° rotated) stacked
      // 5 columns × 2 pair-rows = 10 unique cards per page
      const pairRowH = cardHmm * 2; // front + back touching, no gap between them
      const dualMaxPairRows = 2; // 2 pair-rows (each = front + back) to fit A3
      const dualCardsPerPage = maxCols * dualMaxPairRows; // 10 cards per page
      const dualGapX = 0;
      const dualTotalGridW = maxCols * cardWmm;
      const dualMarginX = (pageW - dualTotalGridW) / 2;
      const dualGapY = (pageH - dualMaxPairRows * pairRowH) / (dualMaxPairRows + 1);
      const dualMarginY = dualGapY;

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
        // ===== DUAL-SIDE GRID: Front card + Back card (180° rotated) directly below =====
        for (let i = 0; i < totalRecords; i++) {
          setField('idCard.bulkWorkflow.sampleRecordIndex', i);
          await new Promise(r => setTimeout(r, 150));

          const frontDataUrl = exportStageRef.current.toDataURL({ pixelRatio: 3, quality: 1 });
          const backDataUrl = exportBackStageRef.current.toDataURL({ pixelRatio: 3, quality: 1 });
          const backRotated = await rotateImage180(backDataUrl);

          const pageIndex = i % dualCardsPerPage;
          if (pageIndex === 0 && i > 0) {
            pdf.addPage([pageW, pageH], 'p');
          }

          const col = pageIndex % maxCols;
          const logicalRow = Math.floor(pageIndex / maxCols);

          // Front card position
          const frontX = dualMarginX + col * (cardWmm + dualGapX);
          const frontY = dualMarginY + logicalRow * (pairRowH + dualGapY);

          // Back card position (directly below front, touching)
          const backX = frontX;
          const backY = frontY + cardHmm;

          pdf.addImage(frontDataUrl, 'PNG', frontX, frontY, cardWmm, cardHmm);
          drawCropMarks(frontX, frontY, cardWmm, cardHmm);

          pdf.addImage(backRotated, 'PNG', backX, backY, cardWmm, cardHmm);
          drawCropMarks(backX, backY, cardWmm, cardHmm);

          // Draw a thin dashed fold line between front and back
          pdf.setLineWidth(0.1);
          pdf.setDrawColor('#aaaaaa');
          pdf.setLineDashPattern([1, 1], 0);
          const foldY = frontY + cardHmm;
          pdf.line(frontX, foldY, frontX + cardWmm, foldY);
          pdf.setLineDashPattern([], 0);

          stepsDone += 2;
          setExportProgress(Math.round((stepsDone / totalSteps) * 100));
        }
      } else {
        // ===== SINGLE-SIDE GRID or non-grid formats =====
        for (let i = 0; i < totalRecords; i++) {
          setField('idCard.bulkWorkflow.sampleRecordIndex', i);
          await new Promise(r => setTimeout(r, 150));
          
          const frontDataUrl = exportStageRef.current.toDataURL({ pixelRatio: 3, quality: 1 });
          
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
            const x = marginX + col * (cardWmm + gapX);
            const y = marginY + row * (cardHmm + gapY);
            
            pdf.addImage(frontDataUrl, 'PNG', x, y, cardWmm, cardHmm);
            drawCropMarks(x, y, cardWmm, cardHmm);
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
            const backDataUrl = exportBackStageRef.current.toDataURL({ pixelRatio: 3, quality: 1 });

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
              <div className={`relative shadow-lg ring-1 ring-slate-200/50 rounded-2xl overflow-hidden bg-slate-50 ${dualSide && previewSide !== 'front' ? 'hidden' : ''}`} style={{ width: width, height: height }}>
                <Stage width={width} height={height} scaleX={1} scaleY={1} ref={exportStageRef}>
                  <Layer>
                    <IdCardPreview 
                      isReviewStep={true}
                      record={datasetRecords?.[sampleRecordIndex] || null}
                      mapping={mapping}
                      forceSide="front"
                    />
                  </Layer>
                </Stage>
              </div>

              {/* Back preview (only when dual-side) */}
              {dualSide && (
                <div className={`relative shadow-lg ring-1 ring-slate-200/50 rounded-2xl overflow-hidden bg-slate-50 ${previewSide !== 'back' ? 'hidden' : ''}`} style={{ width: width, height: height }}>
                  <Stage width={width} height={height} scaleX={1} scaleY={1} ref={exportBackStageRef}>
                    <Layer>
                      <IdCardPreview 
                        isReviewStep={true}
                        record={datasetRecords?.[sampleRecordIndex] || null}
                        mapping={mapping}
                        forceSide="back"
                      />
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

          <div className="flex-1 p-6 flex flex-col gap-4">
            <button 
              onClick={() => handleExportBatch('grid')}
              disabled={isExporting}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl py-5 px-6 flex items-center gap-4 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                 <Grid size={24} />
              </div>
              <div className="text-left flex-1 relative z-10">
                <div className="font-bold text-lg leading-tight">A3 PDF</div>
                <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider mt-1">{dualSide ? 'Front + Back Sheets' : 'Multi-Card A3 Grid'}</div>
              </div>
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
    </div>
  );
}
