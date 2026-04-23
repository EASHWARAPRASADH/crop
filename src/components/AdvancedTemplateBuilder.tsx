import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Upload, 
  Undo, 
  Redo, 
  Settings, 
  Layers, 
  Palette,
  Move,
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  FileArchive
} from 'lucide-react';
import { KonvaCanvas } from './templateBuilder/KonvaCanvas';
import { FabricCanvas } from './templateBuilder/FabricCanvas';
import { LayerPanel } from './templateBuilder/LayerPanel';
import { PropertiesPanel } from './templateBuilder/PropertiesPanel';
import { ImportPanel } from './templateBuilder/ImportPanel';
import { ExportPanel } from './templateBuilder/ExportPanel';
import { ToolsPanel } from './templateBuilder/ToolsPanel';
import { AIAssistant } from './templateBuilder/AIAssistant';
import { DataMappingPanel } from './templateBuilder/DataMappingPanel';
import { TemplateData, ExportOptions } from '@/utils/templateExporter';
import { useAuth } from '@/hooks/useAuth';
import { templateService } from '@/services/dataService';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';

export interface TemplateElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'group' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  name: string;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Shape properties
  fillColor?: string;
  strokeColor?: string;
  cornerRadius?: number;
  // Image properties
  src?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  lineHeight?: number;
  // Group properties
  children?: TemplateElement[];
  expanded?: boolean;
}

interface AdvancedTemplateBuilderProps {
  templateId?: string;
  onSave?: (templateData: TemplateData) => void;
  onClose?: () => void;
}

export const AdvancedTemplateBuilder: React.FC<AdvancedTemplateBuilderProps> = ({
  templateId: propTemplateId,
  onSave,
  onClose,
}) => {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const templateId = propTemplateId || routeId;
  const { user } = useAuth();
  const [canvasType, setCanvasType] = useState<'konva' | 'fabric'>('konva');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [sides, setSides] = useState<{ front: TemplateElement[]; back: TemplateElement[] }>({
    front: [],
    back: [],
  });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 220 });
  const [background, setBackground] = useState<Record<string, { color?: string; image?: string }>>({
    front: { color: '#ffffff' },
    back: { color: '#ffffff' },
  });
  const [templateName, setTemplateName] = useState('Corporate ID Card Template');
  const [templateDescription, setTemplateDescription] = useState('Professional corporate ID card with front and back sides.');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas controls
  const [canvasZoom, setCanvasZoom] = useState(1.5); // Zoomed in for better visibility of CR80
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [selectedTool, setSelectedTool] = useState('select');

  // History for undo/redo
  const [history, setHistory] = useState<TemplateElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Layer panel state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});



  // Helper to get current elements
  const elements = sides[activeSide] || [];

  // Helper to update current side elements
  const setElements = useCallback((newElements: TemplateElement[] | ((prev: TemplateElement[]) => TemplateElement[])) => {
    setSides(prev => ({
      ...prev,
      [activeSide]: typeof newElements === 'function' ? newElements(prev[activeSide]) : newElements,
    }));
  }, [activeSide]);

  // Save history state
  const saveHistory = useCallback((newElements: TemplateElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]); // This only tracks current side history for now
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Load template from database or local storage
  const loadTemplate = async (id: string) => {
    setIsLoading(true);

    if (id.startsWith('uploaded-')) {
      try {
        const stored = localStorage.getItem('gotek_uploaded_templates');
        if (stored) {
          const templates = JSON.parse(stored);
          const tmpl = templates.find((t: any) => t.id === id);
          if (tmpl) {
            setTemplateName(tmpl.name);
            setTemplateDescription(`Uploaded file: ${tmpl.fileName}`);

            // Set uploaded image as background
            if (tmpl.thumbnail && tmpl.fileType.startsWith('image/')) {
              setBackground({
                front: { image: tmpl.thumbnail, color: '#ffffff' },
                back: { color: '#ffffff' }
              });
              setSides({ front: [], back: [] });
            } else {
              setSides({ front: [], back: [] });
              toast.info('Template file loaded via reference. You can start designing.');
            }
            saveHistory([]);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error loading uploaded template:', e);
      }
      toast.error('Could not load uploaded template');
      setIsLoading(false);
      return;
    }

    if (id === 'tmpl-ref-1') {
      setIsLoading(false);
      return;
    }

    try {
      const data = await templateService.getById(id);

      if (data) {
        setTemplateName(data.name);
        setTemplateDescription(data.description || '');
        setCanvasSize({
          width: data.designData?.canvas?.width || 350,
          height: data.designData?.canvas?.height || 220,
        });

        const designData = data.designData;
        if (designData?.sides) {
          setSides(designData.sides);
          setBackground(designData.background || { front: { color: '#ffffff' }, back: { color: '#ffffff' } });
        } else {
          setSides({
            front: designData?.elements || [],
            back: [],
          });
          setBackground({
            front: designData?.background || { color: '#ffffff' },
            back: { color: '#ffffff' },
          });
        }

        setCanvasType(data.canvasType || 'konva');
        saveHistory(designData?.sides?.[activeSide] || designData?.elements || []);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  // Save template to database
  const saveTemplate = async () => {
    if (!user) {
      toast.error('You must be logged in to save templates');
      return;
    }

    setIsSaving(true);
    try {
      const templateDataToSave = {
        name: templateName,
        description: templateDescription,
        designData: {
          canvas: canvasSize,
          background,
          sides,
        },
        canvasType,
        cardSize: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
        isPublic: false,
      };

      if (templateId && templateId !== 'tmpl-ref-1') {
        await templateService.update(templateId, templateDataToSave);
        toast.success('Template updated successfully');
      } else {
        await templateService.create(templateDataToSave);
        toast.success('Template created successfully');
      }

      onSave?.(templateDataToSave as any);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to load default corporate template
  const loadDefaultCorporateTemplate = useCallback(() => {
    const frontElements: TemplateElement[] = [
      { id: 'hd-bg', type: 'rect', x: 0, y: 0, width: 350, height: 60, rotation: 0, opacity: 1, visible: true, locked: true, zIndex: 0, name: 'Header BG', fillColor: '#1e40af' },
      { id: 'logo', type: 'circle', x: 30, y: 30, width: 30, height: 30, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 1, name: 'Logo', fillColor: '#ffffff' },
      { id: 'co-name', type: 'text', x: 55, y: 15, width: 250, height: 20, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 2, name: 'Company Name', text: 'GOTEK', fontSize: 18, fontWeight: 'bold', fill: '#ffffff', fontFamily: 'Inter' },
      { id: 'co-tag', type: 'text', x: 55, y: 35, width: 250, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 3, name: 'Tagline', text: 'Securing Your Identity', fontSize: 10, fill: '#bfdbfe', fontFamily: 'Inter' },
      { id: 'photo-bg', type: 'circle', x: 70, y: 130, width: 80, height: 80, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 4, name: 'Profile Frame', fillColor: '#f3f4f6', strokeColor: '#1e40af', strokeWidth: 2 },
      { id: 'photo', type: 'text', x: 35, y: 120, width: 70, height: 20, rotation: 0, opacity: 0.5, visible: true, locked: false, zIndex: 5, name: 'Photo Label', text: 'PHOTO', fontSize: 10, textAlign: 'center', fill: '#9ca3af' },
      { id: 'name', type: 'text', x: 130, y: 80, width: 200, height: 25, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 6, name: 'Full Name', text: '{{student_name}}', fontSize: 20, fontWeight: 'bold', fill: '#111827', fontFamily: 'Inter' },
      { id: 'desig', type: 'text', x: 130, y: 105, width: 200, height: 20, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 7, name: 'Designation', text: '{{class}} {{section}}', fontSize: 14, fill: '#3b82f6', fontWeight: '600', fontFamily: 'Inter' },
      { id: 'id-lbl', type: 'text', x: 130, y: 135, width: 60, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 8, name: 'ID Label', text: 'ID No:', fontSize: 10, fontWeight: 'bold', fill: '#6b7280' },
      { id: 'id-val', type: 'text', x: 180, y: 135, width: 100, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 9, name: 'ID Value', text: '{{roll_number}}', fontSize: 10, fill: '#111827' },
      { id: 'dept-lbl', type: 'text', x: 130, y: 150, width: 60, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 10, name: 'Dept Label', text: 'Dept:', fontSize: 10, fontWeight: 'bold', fill: '#6b7280' },
      { id: 'dept-val', type: 'text', x: 180, y: 150, width: 100, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 11, name: 'Dept Value', text: '{{school_name}}', fontSize: 10, fill: '#111827' },
      { id: 'barcode-bg', type: 'rect', x: 130, y: 175, width: 200, height: 35, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 12, name: 'Barcode Area', fillColor: '#f9fafb', strokeColor: '#e5e7eb', strokeWidth: 1 },
      { id: 'barcode', type: 'text', x: 180, y: 185, width: 100, height: 15, rotation: 0, opacity: 0.4, visible: true, locked: false, zIndex: 13, name: 'Barcode Text', text: '|||||||||||||||||||||||', fontSize: 14, textAlign: 'center', fill: '#000000' },
    ];

    const backElements: TemplateElement[] = [
      { id: 'tc-hdr', type: 'text', x: 20, y: 20, width: 200, height: 20, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 0, name: 'TC Header', text: 'TERMS & CONDITIONS', fontSize: 12, fontWeight: 'bold', fill: '#1e40af' },
      { id: 'tc-txt', type: 'text', x: 20, y: 45, width: 310, height: 60, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 1, name: 'TC Text', text: '1. This card is non-transferable.\n2. In case of loss, report to HR immediately.\n3. Found cards should be returned to company office.', fontSize: 9, fill: '#4b5563', lineHeight: 1.4 },
      { id: 'emp-lbl', type: 'text', x: 20, y: 110, width: 100, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 2, name: 'Emp Label', text: 'Employee ID:', fontSize: 10, fontWeight: 'bold', fill: '#6b7280' },
      { id: 'emp-val', type: 'text', x: 100, y: 110, width: 100, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 3, name: 'Emp Value', text: '{{roll_number}}', fontSize: 10, fill: '#111827' },
      { id: 'join-lbl', type: 'text', x: 20, y: 125, width: 100, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 4, name: 'Join Label', text: 'Join Date:', fontSize: 10, fontWeight: 'bold', fill: '#6b7280' },
      { id: 'join-val', type: 'text', x: 100, y: 125, width: 100, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 5, name: 'Join Value', text: '{{issue_date}}', fontSize: 10, fill: '#111827' },
      { id: 'sig-line', type: 'rect', x: 200, y: 160, width: 130, height: 1, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 6, name: 'Sig Line', fillColor: '#374151' },
      { id: 'sig-lbl', type: 'text', x: 200, y: 165, width: 130, height: 15, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 7, name: 'Sig Label', text: 'Authorized Signature', fontSize: 9, textAlign: 'center', fill: '#6b7280' },
      { id: 'btm-bg', type: 'rect', x: 0, y: 200, width: 350, height: 20, rotation: 0, opacity: 1, visible: true, locked: true, zIndex: 8, name: 'Bottom BG', fillColor: '#1e40af' },
    ];

    setSides({ front: frontElements, back: backElements });
    setBackground({ front: { color: '#ffffff' }, back: { color: '#ffffff' } });
    saveHistory(frontElements);
  }, [saveHistory]);

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId) {
      if (templateId === 'tmpl-ref-1') {
        loadDefaultCorporateTemplate();
      } else {
        loadTemplate(templateId);
      }
    } else {
      loadDefaultCorporateTemplate();
    }
  }, [templateId, loadDefaultCorporateTemplate]);

  // Handle element selection
  const handleElementSelect = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
  }, []);

  // Handle element update
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<TemplateElement>) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      );
      saveHistory(newElements);
      return newElements;
    });
  }, [setElements, saveHistory]);

  // Handle element delete
  const handleElementDelete = useCallback((elementId: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== elementId);
      saveHistory(newElements);
      return newElements;
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, setElements, saveHistory]);

  // Handle element add
  const handleElementAdd = useCallback((element: Omit<TemplateElement, 'id'>) => {
    const newElement: TemplateElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setElements(prev => {
      const newElements = [...prev, newElement];
      saveHistory(newElements);
      return newElements;
    });
  }, [setElements, saveHistory]);

  // Handle element duplicate
  const handleElementDuplicate = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const duplicatedElement: TemplateElement = {
        ...element,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: element.x + 20,
        y: element.y + 20,
        name: `${element.name} Copy`,
      };
      setElements(prev => {
        const newElements = [...prev, duplicatedElement];
        saveHistory(newElements);
        return newElements;
      });
    }
  }, [elements, setElements, saveHistory]);

  // Handle element lock
  const handleElementLock = useCallback((elementId: string, locked: boolean) => {
    handleElementUpdate(elementId, { locked });
  }, [handleElementUpdate]);

  // Handle element visibility
  const handleElementVisibility = useCallback((elementId: string, visible: boolean) => {
    handleElementUpdate(elementId, { visible });
  }, [handleElementUpdate]);

  // Handle element reorder
  const handleElementReorder = useCallback((elementId: string, newZIndex: number) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === elementId ? { ...el, zIndex: newZIndex } : el
      );
      saveHistory(newElements);
      return newElements;
    });
  }, [setElements, saveHistory]);

  // Handle element rename
  const handleElementRename = useCallback((elementId: string, newName: string) => {
    handleElementUpdate(elementId, { name: newName });
  }, [handleElementUpdate]);

  // Handle element group
  const handleElementGroup = useCallback((elementIds: string[]) => {
    toast.info('Grouping functionality coming soon');
  }, []);

  // Handle element ungroup
  const handleElementUngroup = useCallback((elementId: string) => {
    toast.info('Ungrouping functionality coming soon');
  }, []);

  // Handle layout alignment relative to canvas
  const handleAlignElements = useCallback((alignment: string) => {
    if (!selectedElementId) return;
    setElements(prev => {
      const newElements = prev.map(el => {
        if (el.id !== selectedElementId) return el;
        const newEl = { ...el };
        switch (alignment) {
          case 'left':
            newEl.x = 0;
            break;
          case 'center':
            newEl.x = (canvasSize.width - el.width) / 2;
            break;
          case 'right':
            newEl.x = canvasSize.width - el.width;
            break;
          case 'justify': // We use justify button to mean "Center Both H&V"
            newEl.x = (canvasSize.width - el.width) / 2;
            newEl.y = (canvasSize.height - el.height) / 2;
            break;
        }
        return newEl;
      });
      saveHistory(newElements);
      return newElements;
    });
  }, [selectedElementId, canvasSize, setElements, saveHistory]);

  const handleDistributeElements = useCallback((distribution: string) => {
    if (!selectedElementId) return;
    setElements(prev => {
      const newElements = prev.map(el => {
        if (el.id !== selectedElementId) return el;
        const newEl = { ...el };
        if (distribution === 'horizontal') {
          newEl.x = (canvasSize.width - el.width) / 2;
        } else if (distribution === 'vertical') {
          newEl.y = (canvasSize.height - el.height) / 2;
        }
        return newEl;
      });
      saveHistory(newElements);
      return newElements;
    });
  }, [selectedElementId, canvasSize, setElements, saveHistory]);

  const handleBringToFront = useCallback(() => {
    if (!selectedElementId) return;
    setElements(prev => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map(el => el.zIndex)) : 0;
      const newElements = prev.map(el =>
        el.id === selectedElementId ? { ...el, zIndex: maxZ + 1 } : el
      );
      saveHistory(newElements);
      return newElements;
    });
  }, [selectedElementId, setElements, saveHistory]);

  const handleSendToBack = useCallback(() => {
    if (!selectedElementId) return;
    setElements(prev => {
      const minZ = prev.length > 0 ? Math.min(...prev.map(el => el.zIndex)) : 0;
      const newElements = prev.map(el =>
        el.id === selectedElementId ? { ...el, zIndex: minZ - 1 } : el
      );
      saveHistory(newElements);
      return newElements;
    });
  }, [selectedElementId, setElements, saveHistory]);

  const handleBringForward = useCallback(() => {
    if (!selectedElementId) return;
    setElements(prev => {
      const target = prev.find(el => el.id === selectedElementId);
      if (!target) return prev;
      const targetZ = target.zIndex;
      const nextAbove = prev.filter(el => el.zIndex > targetZ).sort((a,b) => a.zIndex - b.zIndex)[0];
      if (!nextAbove) return prev;

      const newElements = prev.map(el => {
        if (el.id === selectedElementId) return { ...el, zIndex: nextAbove.zIndex };
        if (el.id === nextAbove.id) return { ...el, zIndex: targetZ };
        return el;
      });
      saveHistory(newElements);
      return newElements;
    });
  }, [selectedElementId, setElements, saveHistory]);

  const handleSendBackward = useCallback(() => {
    if (!selectedElementId) return;
    setElements(prev => {
      const target = prev.find(el => el.id === selectedElementId);
      if (!target) return prev;
      const targetZ = target.zIndex;
      const nextBelow = prev.filter(el => el.zIndex < targetZ).sort((a,b) => b.zIndex - a.zIndex)[0];
      if (!nextBelow) return prev;

      const newElements = prev.map(el => {
        if (el.id === selectedElementId) return { ...el, zIndex: nextBelow.zIndex };
        if (el.id === nextBelow.id) return { ...el, zIndex: targetZ };
        return el;
      });
      saveHistory(newElements);
      return newElements;
    });
  }, [selectedElementId, setElements, saveHistory]);

  const handleApplyAITheme = useCallback((theme: { primary: string; secondary: string; accent: string; text: string }) => {
    setElements(prev => {
      const newElements = prev.map(el => {
        const newEl = { ...el };
        // Apply theme colors to relevant elements
        if (el.type === 'rect' || el.type === 'circle') {
          if (el.fillColor?.toLowerCase() === '#1e40af' || el.name.toLowerCase().includes('header') || el.name.toLowerCase().includes('bg')) {
            newEl.fillColor = theme.primary;
          } else if (el.name.toLowerCase().includes('accent')) {
            newEl.fillColor = theme.accent;
          }
        } else if (el.type === 'text') {
          if (el.fill?.toLowerCase() === '#ffffff') {
            newEl.fill = '#ffffff'; // Keep white on dark
          } else if (el.name.toLowerCase().includes('accent') || el.fill?.toLowerCase() === '#3b82f6') {
            newEl.fill = theme.secondary;
          } else {
            newEl.fill = theme.text;
          }
        }
        return newEl;
      });
      saveHistory(newElements);
      return newElements;
    });

    // Update background color if default
    setBackground(prev => ({
      ...prev,
      [activeSide]: { ...prev[activeSide], color: prev[activeSide].color === '#ffffff' ? '#ffffff' : theme.accent }
    }));

    toast.success(`Applied ${theme.primary} theme via AI`);
  }, [activeSide, setElements, saveHistory]);

  const handleMappingChange = useCallback((elementId: string, fieldId: string | null) => {
    setMappedFields(prev => {
      const next = { ...prev };
      if (fieldId) {
        next[elementId] = fieldId;
      } else {
        delete next[elementId];
      }
      return next;
    });
  }, []);

  // Handle import complete
  const handleImportComplete = useCallback((importedElements: any[], canvas: { width: number; height: number }, bg?: { color?: string; image?: string }) => {
    const newSides = {
      front: importedElements,
      back: [],
    };
    setSides(newSides);
    setCanvasSize(canvas);
    if (bg) {
      setBackground({
        front: bg,
        back: { color: '#ffffff' },
      });
    }
    saveHistory(importedElements);
    toast.success('Template imported successfully');
  }, [saveHistory]);

  // Handle import error
  const handleImportError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex, setElements]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex, setElements]);

  // Get selected element
  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) : null;

  // Convert elements to layer format
  const layerElements = elements.map(el => ({
    id: el.id,
    name: el.name,
    type: el.type,
    visible: el.visible,
    locked: el.locked,
    opacity: el.opacity,
    zIndex: el.zIndex,
    children: el.children,
    expanded: el.expanded,
  }));

  // Create template data for export
  const templateData: TemplateData = {
    metadata: {
      id: templateId || `template_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      version: 1,
      canvasType,
      orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
      width: canvasSize.width,
      height: canvasSize.height,
      tags: [],
      createdBy: (user as any)?._id || (user as any)?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    elements, // For backward compatibility
    background: background[activeSide], // For backward compatibility
    backgrounds: background,
    sides,
    canvas: canvasSize,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Template Builder</h1>
              <div className="flex items-center gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-64"
                  placeholder="Template name"
                />
                <Badge variant="outline">{elements.length} elements</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button
                onClick={saveTemplate}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-muted rounded-lg shadow-sm border border-muted-foreground/10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mr-2">Switch Side:</span>
            <Button
                variant={activeSide === 'front' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSide('front')}
                className="font-medium"
            >
                Front Side
            </Button>
            <Button
                variant={activeSide === 'back' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSide('back')}
                className="font-medium"
            >
                Back Side
            </Button>
            <div className="ml-auto flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                    Editing: <span className="font-bold ml-1 uppercase">{activeSide}</span>
                </Badge>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)] mt-4">
          {/* Left sidebar - Tools and Layers */}
          <div className="col-span-3 space-y-4">
            <Tabs defaultValue="tools" className="h-full">
              <TabsList className="grid w-full grid-cols-5 text-[10px]">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="mapping">Mapping</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="import">Import</TabsTrigger>
              </TabsList>

              <TabsContent value="tools" className="h-full">
                <ToolsPanel
                  selectedTool={selectedTool}
                  onToolSelect={setSelectedTool}
                  canvasZoom={canvasZoom}
                  onZoomChange={setCanvasZoom}
                  showGrid={showGrid}
                  onGridToggle={setShowGrid}
                  snapToGrid={snapToGrid}
                  onSnapToGridToggle={setSnapToGrid}
                  gridSize={gridSize}
                  onGridSizeChange={setGridSize}
                  onAddElement={handleElementAdd as any}
                  onAlignElements={handleAlignElements}
                  onDistributeElements={handleDistributeElements}
                  onGroupElements={handleElementGroup as any}
                  onUngroupElements={handleElementUngroup as any}
                  onBringToFront={handleBringToFront}
                  onSendToBack={handleSendToBack}
                  onBringForward={handleBringForward}
                  onSendBackward={handleSendBackward}
                />
              </TabsContent>

              <TabsContent value="ai" className="h-full">
                <AIAssistant
                  selectedElement={selectedElement}
                  onUpdateElement={handleElementUpdate as any}
                  onApplyTheme={handleApplyAITheme}
                />
              </TabsContent>

              <TabsContent value="mapping" className="h-full">
                <DataMappingPanel
                  selectedElement={selectedElement}
                  onUpdateElement={handleElementUpdate as any}
                  mappedFields={mappedFields}
                  onMappingChange={handleMappingChange}
                />
              </TabsContent>

              <TabsContent value="layers" className="h-full overflow-hidden">
                <LayerPanel
                  elements={layerElements}
                  selectedElementId={selectedElementId}
                  onElementSelect={handleElementSelect}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={handleElementDelete}
                  onElementDuplicate={handleElementDuplicate}
                  onElementLock={handleElementLock}
                  onElementVisibility={handleElementVisibility}
                  onElementReorder={handleElementReorder}
                  onElementRename={handleElementRename}
                  onElementGroup={handleElementGroup}
                  onElementUngroup={handleElementUngroup}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                />
              </TabsContent>

              <TabsContent value="import" className="h-full">
                <ImportPanel
                  onImportComplete={handleImportComplete}
                  onImportError={handleImportError}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Canvas */}
          <div className="col-span-6 overflow-hidden flex flex-col">
            <Tabs defaultValue="konva" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="konva">Konva.js (Performance)</TabsTrigger>
                <TabsTrigger value="fabric">Fabric.js (Vector)</TabsTrigger>
              </TabsList>

              <TabsContent value="konva" className="flex-1 overflow-auto bg-gray-100/50 rounded-b-lg p-8 flex items-center justify-center">
                <div style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}>
                  <KonvaCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    elements={elements as any}
                    selectedElementId={selectedElementId}
                    onElementSelect={handleElementSelect}
                    onElementUpdate={handleElementUpdate as any}
                    onElementDelete={handleElementDelete}
                    onElementAdd={handleElementAdd as any}
                    onElementDuplicate={handleElementDuplicate}
                    onElementLock={handleElementLock}
                    onElementVisibility={handleElementVisibility}
                    onElementReorder={handleElementReorder}
                    background={background[activeSide]}
                    gridSize={gridSize}
                    showGrid={showGrid}
                    snapToGrid={snapToGrid}
                  />
                </div>
              </TabsContent>

              <TabsContent value="fabric" className="flex-1 overflow-auto bg-gray-100/50 rounded-b-lg p-8 flex items-center justify-center">
               <div style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}>
                <FabricCanvas
                  width={canvasSize.width}
                  height={canvasSize.height}
                  elements={elements as any}
                  selectedElementId={selectedElementId}
                  onElementSelect={handleElementSelect}
                  onElementUpdate={handleElementUpdate as any}
                  onElementDelete={handleElementDelete}
                  onElementAdd={handleElementAdd as any}
                  onElementDuplicate={handleElementDuplicate}
                  onElementLock={handleElementLock}
                  onElementVisibility={handleElementVisibility}
                  onElementReorder={handleElementReorder}
                  background={background[activeSide]}
                  gridSize={gridSize}
                  showGrid={showGrid}
                  snapToGrid={snapToGrid}
                />
               </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar - Properties and Export */}
          <div className="col-span-3 space-y-4">
            <Tabs defaultValue="properties" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="h-full">
                <PropertiesPanel
                  selectedElement={selectedElement as any}
                  onElementUpdate={(updates) => selectedElementId && handleElementUpdate(selectedElementId, updates as any)}
                  onElementDelete={() => selectedElementId && handleElementDelete(selectedElementId)}
                  onElementDuplicate={() => selectedElementId && handleElementDuplicate(selectedElementId)}
                  onElementLock={(locked) => selectedElementId && handleElementLock(selectedElementId, locked)}
                  onElementVisibility={(visible) => selectedElementId && handleElementVisibility(selectedElementId, visible)}
                  onElementReorder={(newZIndex) => selectedElementId && handleElementReorder(selectedElementId, newZIndex)}
                  canvasBackground={background[activeSide]}
                  onCanvasBackgroundChange={(bg) => {
                    setBackground(prev => ({ ...prev, [activeSide]: { ...prev[activeSide], ...bg } }));
                  }}
                />
              </TabsContent>
              
              <TabsContent value="export" className="h-full">
                <ExportPanel
                  templateData={templateData}
                  mappedFields={mappedFields}
                  onExportStart={() => setIsLoading(true)}
                  onExportComplete={() => setIsLoading(false)}
                  onExportError={(error) => {
                    setIsLoading(false);
                    toast.error(error);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTemplateBuilder;
