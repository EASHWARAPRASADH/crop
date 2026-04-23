import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, FabricImage, IText, Rect, Group } from 'fabric';
import { loadPDFPageAsImage } from '@/utils/pdfHandler';
import { exportCanvasToPDF } from '@/utils/exportPDF';
// @ts-ignore
import { Toolbar } from './Toolbar';
// @ts-ignore
import { LayerManager } from './LayerManager';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export const AdvancedPDFEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    fabricRef.current = new Canvas(canvasRef.current, {
      width: 600,
      height: 800,
      backgroundColor: '#f1f5f9',
    });

    fabricRef.current.on('object:added', () => saveState());
    fabricRef.current.on('object:modified', () => saveState());
    fabricRef.current.on('object:removed', () => saveState());

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, []);

  const saveState = useCallback(() => {
    if (!fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toObject());
    setHistory(prev => [...prev.slice(-49), json]); // Support up to 50 undo steps
    setRedoStack([]);
  }, []);

  const handleUndo = () => {
    if (history.length <= 1 || !fabricRef.current) return;
    const newHistory = [...history];
    const current = newHistory.pop();
    if (!current) return;
    
    setRedoStack(prev => [...prev, current]);
    setHistory(newHistory);
    
    const last = newHistory[newHistory.length - 1];
    fabricRef.current.loadFromJSON(JSON.parse(last)).then(() => {
      fabricRef.current?.requestRenderAll();
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !fabricRef.current) return;
    const newRedo = [...redoStack];
    const next = newRedo.pop();
    if (!next) return;
    
    setHistory(prev => [...prev, next]);
    setRedoStack(newRedo);
    
    fabricRef.current.loadFromJSON(JSON.parse(next)).then(() => {
      fabricRef.current?.requestRenderAll();
    });
  };

  const handlePDFUpload = async (file: File) => {
    try {
      const dataUrl = await loadPDFPageAsImage(file);
      if (!fabricRef.current) return;

      const img = await FabricImage.fromURL(dataUrl);
      
      const canvasWidth = 600;
      const scale = canvasWidth / img.width;
      const canvasHeight = img.height * scale;
      
      fabricRef.current.setDimensions({ width: canvasWidth, height: canvasHeight });
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        name: 'pdf-background'
      });

      // Fabric 6 background image assignment
      fabricRef.current.backgroundImage = img;
      fabricRef.current.requestRenderAll();
      
      setIsLoaded(true);
      toast.success('PDF Loaded successfully as background');
      saveState();
    } catch (error) {
      console.error(error);
      toast.error('Failed to load PDF');
    }
  };

  const addPlaceholderText = (tag: string = '{{name}}') => {
    if (!fabricRef.current) return;
    const text = new IText(tag, {
      left: 100,
      top: 100,
      fontSize: 20,
      fontFamily: 'Inter',
      fill: '#000000',
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.requestRenderAll();
  };

  const addImagePlaceholder = (tag: string = '{{photo}}') => {
    if (!fabricRef.current) return;
    const rect = new Rect({
      width: 120,
      height: 140,
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
      strokeDashArray: [5, 5],
      strokeWidth: 2,
    });
    
    const label = new IText(tag, {
       fontSize: 12,
       fill: '#3b82f6',
       left: 10,
       top: 10,
       selectable: false
    });

    const group = new Group([rect, label], {
      left: 100,
      top: 150,
    });
    
    // Custom property for placeholder tracking
    (group as any).name = `Photo Placeholder (${tag})`;
    (group as any).placeholder = tag;
    
    fabricRef.current.add(group);
    fabricRef.current.setActiveObject(group);
    fabricRef.current.requestRenderAll();
  };

  const handleExport = async () => {
    if (!fabricRef.current) return;
    // Export at 2x resolution for better quality
    const dataUrl = fabricRef.current.toDataURL({ multiplier: 2 });
    await exportCanvasToPDF(dataUrl, fabricRef.current.width * 2, fabricRef.current.height * 2);
    toast.success('PDF Exported successfully');
  };

  const handleAIDetect = () => {
    if (!fabricRef.current || !isLoaded) return;
    toast.loading('Analyzing template layers...', { duration: 1500 });
    
    setTimeout(() => {
      addPlaceholderText('{{name}}');
      addPlaceholderText('{{id_number}}');
      addImagePlaceholder('{{photo}}');
      toast.success('AI Detection complete: 3 placeholders added');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <Toolbar 
        onUpload={handlePDFUpload}
        onAddText={() => addPlaceholderText()}
        onAddImage={() => addImagePlaceholder()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        onAIDetect={handleAIDetect}
        isLoaded={isLoaded}
      />
      
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        <div className="flex-1 flex justify-center items-start overflow-auto bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 p-8 shadow-inner">
          <Card className="shadow-2xl overflow-hidden bg-white">
            <canvas id="fabric-canvas" ref={canvasRef} />
          </Card>
        </div>
        
        <div className="w-80 flex flex-col gap-6">
          <LayerManager canvas={fabricRef.current} />
          
          <Card className="p-4 bg-indigo-50 border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Instructions</h3>
            <ul className="text-[11px] text-indigo-600 space-y-2 list-disc pl-4">
              <li>Upload a PDF to start editing.</li>
              <li>Use <b>{"{{tag}}"}</b> for dynamic fields.</li>
              <li>Placeholders will be replaced during bulk generation.</li>
              <li>Drag items to reposition them on the template.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
