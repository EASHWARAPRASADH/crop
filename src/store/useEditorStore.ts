import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TemplateItem {
  id: string;
  name: string;
  thumbnail: string;
  canvasJSON: string;
  createdAt: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  dataUrl: string;
  type: string;
}

export interface FieldMapping {
  elementId: string;
  fieldName: string;
}

interface EditorState {
  // Canvas
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor: string;
  orientation: 'horizontal' | 'vertical';

  // Selection
  selectedObjectId: string | null;

  // History
  undoStack: string[];
  redoStack: string[];

  // Templates
  templates: TemplateItem[];
  activeTemplateId: string | null;
  templateName: string;

  // Uploads
  uploads: UploadedFile[];

  // Fonts
  recentFonts: string[];

  // Data mapping
  fieldMappings: FieldMapping[];
  importedRecords: Record<string, string>[];
  importedColumns: string[];

  // Dark mode
  darkMode: boolean;

  // Auto-save
  lastSavedAt: string | null;

  // Actions
  setZoom: (z: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnap: () => void;
  setCanvasSize: (w: number, h: number) => void;
  setCanvasBgColor: (c: string) => void;
  setSelectedObjectId: (id: string | null) => void;
  setOrientation: (o: 'horizontal' | 'vertical') => void;

  pushUndo: (json: string) => void;
  popUndo: () => string | undefined;
  pushRedo: (json: string) => void;
  popRedo: () => string | undefined;
  clearRedo: () => void;

  addTemplate: (t: TemplateItem) => void;
  updateTemplate: (id: string, updates: Partial<TemplateItem>) => void;
  deleteTemplate: (id: string) => void;
  setActiveTemplateId: (id: string | null) => void;
  setTemplateName: (name: string) => void;

  addUpload: (f: UploadedFile) => void;
  removeUpload: (id: string) => void;

  addRecentFont: (font: string) => void;

  setFieldMappings: (m: FieldMapping[]) => void;
  setImportedRecords: (r: Record<string, string>[]) => void;
  setImportedColumns: (c: string[]) => void;

  toggleDarkMode: () => void;
  setLastSavedAt: (t: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      zoom: 1,
      showGrid: false,
      showRulers: true,
      snapToGrid: true,
      canvasWidth: 1014,
      canvasHeight: 642,
      canvasBgColor: '#ffffff',
      selectedObjectId: null,
      orientation: 'horizontal',
      undoStack: [],
      redoStack: [],
      templates: [],
      activeTemplateId: null,
      templateName: 'Untitled Card',
      uploads: [],
      recentFonts: [],
      fieldMappings: [],
      importedRecords: [],
      importedColumns: [],
      darkMode: false,
      lastSavedAt: null,

      setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(3, z)) }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
      toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
      setCanvasBgColor: (c) => set({ canvasBgColor: c }),
      setSelectedObjectId: (id) => set({ selectedObjectId: id }),
      setOrientation: (o) => {
        const w = o === 'horizontal' ? 1014 : 642;
        const h = o === 'horizontal' ? 642 : 1014;
        set({ orientation: o, canvasWidth: w, canvasHeight: h });
      },

      pushUndo: (json) => set((s) => ({ undoStack: [...s.undoStack.slice(-49), json] })),
      popUndo: () => {
        const stack = [...get().undoStack];
        const item = stack.pop();
        set({ undoStack: stack });
        return item;
      },
      pushRedo: (json) => set((s) => ({ redoStack: [...s.redoStack, json] })),
      popRedo: () => {
        const stack = [...get().redoStack];
        const item = stack.pop();
        set({ redoStack: stack });
        return item;
      },
      clearRedo: () => set({ redoStack: [] }),

      addTemplate: (t) => set((s) => ({ templates: [...s.templates, t] })),
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTemplate: (id) =>
        set((s) => ({
          templates: s.templates.filter((t) => t.id !== id),
          activeTemplateId: s.activeTemplateId === id ? null : s.activeTemplateId,
        })),
      setActiveTemplateId: (id) => set({ activeTemplateId: id }),
      setTemplateName: (name) => set({ templateName: name }),

      addUpload: (f) => set((s) => ({ uploads: [...s.uploads, f] })),
      removeUpload: (id) => set((s) => ({ uploads: s.uploads.filter((f) => f.id !== id) })),

      addRecentFont: (font) =>
        set((s) => ({
          recentFonts: [font, ...s.recentFonts.filter((f) => f !== font)].slice(0, 5),
        })),

      setFieldMappings: (m) => set({ fieldMappings: m }),
      setImportedRecords: (r) => set({ importedRecords: r }),
      setImportedColumns: (c) => set({ importedColumns: c }),

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setLastSavedAt: (t) => set({ lastSavedAt: t }),
    }),
    {
      name: 'gotek-editor-store',
      partialize: (state) => ({
        templates: state.templates,
        uploads: state.uploads,
        recentFonts: state.recentFonts,
        darkMode: state.darkMode,
        templateName: state.templateName,
        showGrid: state.showGrid,
        showRulers: state.showRulers,
        snapToGrid: state.snapToGrid,
      }),
    }
  )
);
