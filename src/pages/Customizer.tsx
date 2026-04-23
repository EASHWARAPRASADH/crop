import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { Save, CheckCircle2, LayoutTemplate, Database, Download, RotateCcw, Loader2 } from 'lucide-react';
import ToastContainer, { showToast } from '../components/customizer/Toast';
import SetupMode from '../components/customizer/workspace/SetupMode';
import DesignMode from '../components/customizer/workspace/DesignMode';
import ExportMode from '../components/customizer/workspace/ExportMode';
import FloatingToolbar from '../components/customizer/workspace/FloatingToolbar';

export default function Customizer() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const design = useConfiguratorStore(state => state.design);
  const setField = useConfiguratorStore(state => state.setField);
  const saveLocal = useConfiguratorStore(state => state.saveLocal);
  const loadLocal = useConfiguratorStore(state => state.loadLocal);
  const resetDesign = useConfiguratorStore(state => state.resetDesign);
  
  const [isInitialLoading, setIsInitialLoading] = useState(!!orderId);
  const processedOrderIdRef = useRef<string | null>(null);
  
  // Auto-restore saved draft on mount
  useEffect(() => {
    if (orderId && processedOrderIdRef.current !== orderId) {
      processedOrderIdRef.current = orderId;
      setIsInitialLoading(true);
      
      const doLoad = async () => {
        await loadLocal(orderId);
        setField('idCard.selected', orderId);
        setIsInitialLoading(false);
      };
      doLoad();
    } else if (!orderId) {
      setIsInitialLoading(false);
      if (design.idCard.selected) {
        loadLocal(design.idCard.selected);
      } else {
        loadLocal();
      }
    }
  }, [orderId]);
  
  const mode = design.idCard.bulkWorkflow.mode || 'setup';
  
  const stageRef = useRef<any>(null);
  const idCardStageRef = useRef<any>(null);
  const [zoom, setZoom] = useState(1);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveDraft = () => {
    saveLocal();
    setSaveMessage('Draft saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all design changes? This action cannot be undone.')) {
      resetDesign();
      showToast('All changes cleared successfully!');
    }
  };

  const steps = [
    { id: 'setup', label: 'Setup', icon: Database },
    { id: 'design', label: 'Design Workspace', icon: LayoutTemplate },
    { id: 'export', label: 'Review & Export', icon: Download },
  ];

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Restoring Workspace Design...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Header */}
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Gotek ID Pro</h1>
          <div className="w-[1px] h-6 bg-slate-200" />
          
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = mode === step.id;
              const isPast = steps.findIndex(s => s.id === mode) > idx;
              const datasetReady = design.idCard.bulkWorkflow.datasetRecords?.length > 0;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (datasetReady || step.id === 'setup') setField('idCard.bulkWorkflow.mode', step.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive ? 'bg-white shadow relative text-indigo-600' : (!datasetReady && step.id !== 'setup') ? 'text-slate-400 cursor-not-allowed hidden md:flex' : 'text-slate-600 hover:bg-slate-100'}`}
                  disabled={!datasetReady && step.id !== 'setup'}
                >
                  {isPast ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Icon size={14} />}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-[12px] font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2 whitespace-nowrap">
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw size={14} />
            Clear
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
          >
            <Save size={14} />
            Save Draft
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {mode === 'setup' && <SetupMode />}
        
        {mode === 'design' && (
          <DesignMode 
            stageRef={stageRef} 
            idCardStageRef={idCardStageRef} 
            zoom={zoom} 
            setZoom={setZoom} 
          />
        )}
        
        {mode === 'export' && (
          <ExportMode 
            stageRef={stageRef} 
            idCardStageRef={idCardStageRef} 
          />
        )}

        {/* Floating Context Toolbar renders on top of everything if in design mode */}
        {mode === 'design' && <FloatingToolbar stageRef={stageRef} />}
      </main>

      <ToastContainer />
    </div>
  );
}
