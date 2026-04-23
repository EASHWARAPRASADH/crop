import React from 'react';
import { 
  Plus, Type, Image as ImageIcon, 
  RotateCcw, RotateCw, Download, 
  Upload, FileUp, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ToolbarProps {
  onUpload: (file: File) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onAIDetect: () => void;
  isLoaded: boolean;
}

export const Toolbar = ({ 
  onUpload, onAddText, onAddImage, 
  onUndo, onRedo, onExport, onAIDetect, isLoaded 
}: ToolbarProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} 
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700"
          >
            <FileUp size={16} /> Upload PDF Template
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1.5">
          <Button 
            disabled={!isLoaded} 
            onClick={onAddText} 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-slate-600"
          >
            <Type size={16} /> Add Text Tag
          </Button>
          <Button 
            disabled={!isLoaded} 
            onClick={onAddImage} 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-slate-600"
          >
            <ImageIcon size={16} /> Add Photo Tag
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button onClick={onUndo} variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
            <RotateCcw size={16} />
          </Button>
          <Button onClick={onRedo} variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
            <RotateCw size={16} />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button 
          disabled={!isLoaded} 
          onClick={onExport} 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Download size={16} /> Export High-Res PDF
        </Button>
        
        <Button 
          variant="outline" 
          disabled={!isLoaded}
          onClick={onAIDetect}
          className="gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
        >
          <Sparkles size={16} /> AI Auto-Detect
        </Button>
      </div>
    </div>
  );
};
