import React, { useState, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { CreditCard } from 'lucide-react';
import { IdCardCustomizer } from './IdCardCustomizer';
import { IdCardPreview } from './IdCardPreview';
import { useConfiguratorStore } from '@/store/useConfiguratorStore';
import { prepareUploadAsset } from '@/lib/fileReaders';
import './styles.css';

export const IdCardCustomizerApp = () => {
  const design = useConfiguratorStore((state) => state.design);
  const setField = useConfiguratorStore((state) => state.setField);
  const setUploadAsset = useConfiguratorStore((state) => state.setUploadAsset);
  const stageRef = useRef<any>(null);

  const handleUpload = async (file: File | null, key: string) => {
    if (!file) return;
    try {
      const asset = await prepareUploadAsset(file);
      setUploadAsset(key, asset.file, asset.previewUrl, asset.name);
    } catch (error) {
      console.error('Error uploading asset:', error);
    }
  };

  const handleSelectElement = (elementId: string | null, side: 'front' | 'back' | null = null) => {
    if (side) {
      setField('idCard.activeSide', side);
    }
    setField('idCard.selected', elementId);
  };

  const handleUpdateElement = (elementId: string, updates: any, side: 'front' | 'back') => {
    const elements = design.idCard[side].elements;
    const updatedElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    setField(`idCard.${side}.elements`, updatedElements);
  };

  const handleDblClickElement = (elementId: string, side: 'front' | 'back', _event: any) => {
    const element = design.idCard[side].elements.find(el => el.id === elementId);
    if (element?.type === 'text') {
      const newContent = prompt('Edit text:', element.content);
      if (newContent !== null) {
        handleUpdateElement(elementId, { content: newContent }, side);
      }
    } else if (element?.type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          handleUpload(file, 'idPhotoFile');
        }
      };
      input.click();
    }
  };

  const getStageSize = () => {
    const { size } = design.idCard;
    const baseSize = size === '54x86' || size === '86x54' ? { width: 153, height: 244 } : { width: 283, height: 198 };
    
    if (design.idCard.showBothSides) {
      const isHorizontal = baseSize.width > baseSize.height;
      return {
        width: isHorizontal ? baseSize.width : (baseSize.width * 2 + 40),
        height: isHorizontal ? (baseSize.height * 2 + 40) : baseSize.height
      };
    }
    
    return baseSize;
  };

  const stageSize = getStageSize();

  return (
    <div className="id-card-customizer-app bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
      <div className="customizer-header bg-slate-900 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          ID Card Designer
        </h1>
        <div className="header-actions flex gap-2">
          <button 
            onClick={() => useConfiguratorStore.getState().resetDesign()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Reset Design
          </button>
          <button 
            onClick={() => useConfiguratorStore.getState().saveLocal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            Save Design
          </button>
        </div>
      </div>
      
      <div className="customizer-layout flex h-[800px]">
        <div className="customizer-sidebar w-96 border-r border-gray-100 overflow-y-auto p-6 bg-slate-50/50">
          <IdCardCustomizer />
          
          {/* File Upload Section */}
          <div className="upload-section mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Upload Assets</h3>
            
            <div className="space-y-4">
              <div className="upload-item">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Student Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files ? e.target.files[0] : null, 'idPhotoFile')}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              
              <div className="upload-item">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">School Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files ? e.target.files[0] : null, 'idLogoFile')}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="customizer-preview flex-1 bg-slate-100 flex flex-col">
          <div className="preview-container flex-1 relative flex items-center justify-center p-8 overflow-auto">
            <div className="bg-white p-12 rounded-2xl shadow-2xl border border-white">
              <Stage
                width={stageSize.width}
                height={stageSize.height}
                ref={stageRef}
                className="id-card-stage"
              >
                <Layer>
                  <IdCardPreview
                    onSelectElement={handleSelectElement}
                    onUpdateElement={handleUpdateElement}
                    onDblClickElement={handleDblClickElement}
                    isReviewStep={false}
                  />
                </Layer>
              </Stage>
            </div>
          </div>
          
          <div className="preview-info bg-white border-t border-gray-100 p-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Double-click to edit</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Drag to reposition</span>
            </div>
            <div className="flex items-center gap-4">
              <span>SIZE: <span className="text-slate-700 font-bold">{design.idCard.size}</span></span>
              <span>SIDE: <span className="text-slate-700 font-bold">{design.idCard.activeSide.toUpperCase()}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
