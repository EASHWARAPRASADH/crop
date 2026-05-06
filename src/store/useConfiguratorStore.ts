import { create } from 'zustand';

const LOCAL_STORAGE_KEY = 'lanyard-configurator-design';

export type DatasetRecord = Record<string, string | number | boolean | null>;

export interface Element {
  id: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'triangle' | 'rhombus' | 'qr' | 'barcode' | 'frame' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number | number[];
  content?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  fontStyle?: string;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  src?: string;
  points?: number[];
  tension?: number;
  shapeType?: string;
  lineCap?: string;
  lineJoin?: string;
  closed?: boolean;
  _debugLogged?: string | null;
  qrMode?: 'mapped' | 'dummy' | 'full_row';
  qrDummyText?: string;
  qrFullRowFormat?: 'json' | 'csv' | 'text';
  barcodeMode?: 'mapped' | 'series';
  barcodeSeriesStart?: number;
  barcodeSeriesPrefix?: string;
  barcodeSeriesSuffix?: string;
  barcodeFormat?: string; // CODE128, EAN13, etc.
}

export interface SideData {
  backgroundColor: string;
  backgroundImage?: string;
  elements: Element[];
}

export interface TemplateVariant {
  id: string;
  name: string;
  condition: {
    column: string;
    value: string;
  };
  frontImage: string | null;
  backImage: string | null;
}

export interface Design {
  printingMethod: string;
  lanyardStyle: string;
  width: string;
  lanyardColor: string;
  customColorCode: string;
  pantone: string;
  customPatternUrl: string;
  customPatternName: string;
  patternScale: number;
  patternSpacing: number;
  patternRotation: number;
  strapPattern: string | null;
  strapPatternOpacity: number;
  copyMode: 'synchronized' | 'multi-zone';
  customTextLeft: string;
  customTextCenter: string;
  customTextRight: string;
  customTextSecondary: string;
  lanyardDesignStyle: string;
  predefinedWord: string;
  patternOffset: number;
  textOffset: number;
  textOffsetLeft: number;
  textOffsetCenter: number;
  textOffsetRight: number;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  textAngle: number;
  textSpacing: number;
  textPosition: string;
  logoUrl: string;
  logoName: string;
  logoScale: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  logoOffset: number;
  logoOffsetLeft: number;
  logoOffsetCenter: number;
  logoOffsetRight: number;
  logoRepeat: boolean;
  clipType: string;
  accessories: string[];
  quantity: number;
  idCard: {
    size: string;
    activeSide: 'front' | 'back';
    selected: string | null;
    showBothSides: boolean;
    showGrid?: boolean;
    defaultFontFamily?: string;
    defaultColor?: string;
    photoUrl?: string;
    logoUrl?: string;
    defaultFontSize: number;
    defaultBold: boolean;
    defaultItalic: boolean;
    cornerRadius: number;
    showTrimLine: boolean;
    drawingTool: 'none' | 'straight' | '2point' | 'multipoint' | 'freeform' | 'custom_frame' | 'freeform_frame';
    front: SideData;
    back: SideData;
    bulkWorkflow: {
      mode: 'setup' | 'design' | 'export';
      mapping: Record<string, string>;
      datasetColumns: string[];
      datasetRecords: DatasetRecord[];
      datasetImages?: Record<string, string>;
      imageMatchColumn?: string | null;
      matchedImageCount?: number;
      sampleRecordIndex: number;
      isProcessing: boolean;
      progress: number;
      processedRecords: DatasetRecord[];
      templateVariants: TemplateVariant[];
      exportSettings: {
        dpi: number;
        pageSize: 'A4' | 'A3' | 'Legal' | 'Custom';
        customWidth?: number;
        customHeight?: number;
        bleed: number;
        marginTop: number;
        marginBottom: number;
        marginLeft: number;
        marginRight: number;
        gutterX: number;
        gutterY: number;
        showCutLines: boolean;
        showRegistrationMarks: boolean;
        mirrorBackside: boolean;
      };
    };
  };
}

const defaultDesign: Design = {
  printingMethod: 'Sublimated',
  lanyardStyle: 'Single Ended',
  width: '20mm',
  lanyardColor: '#ffffff',
  customColorCode: '#ffffff',
  pantone: 'White',
  customPatternUrl: '',
  customPatternName: '',
  patternScale: 100,
  patternSpacing: 30,
  patternRotation: 0,
  strapPattern: null,
  strapPatternOpacity: 0.85,
  copyMode: 'synchronized',
  customTextLeft: '',
  customTextCenter: '',
  customTextRight: '',
  customTextSecondary: '',
  lanyardDesignStyle: 'repeated',
  predefinedWord: 'VISITOR',
  patternOffset: 0,
  textOffset: 0,
  textOffsetLeft: 0,
  textOffsetCenter: 0,
  textOffsetRight: 0,
  fontFamily: 'Montserrat',
  fontColor: '#ffffff',
  fontSize: 18,
  textAngle: 0,
  textSpacing: 60,
  textPosition: 'Center',
  logoUrl: '',
  logoName: '',
  logoScale: 1,
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,
  logoOffset: 0,
  logoOffsetLeft: 0,
  logoOffsetCenter: 0,
  logoOffsetRight: 0,
  logoRepeat: true,

  clipType: 'Metal Hook',
  accessories: ['Badge Holder'],
  quantity: 100,
    idCard: {
    size: '54x86',
    activeSide: 'front',
    selected: null,
    showBothSides: false,
    showGrid: false,
    defaultFontFamily: 'Montserrat',
    defaultColor: '#1e293b',
    defaultFontSize: 14,
    defaultBold: false,
    defaultItalic: false,
    cornerRadius: 15,
    showTrimLine: false,
    drawingTool: 'none',
    front: {
      backgroundColor: '#ffffff',
      elements: [],
    },
    back: {
      backgroundColor: '#ffffff',
      elements: [],
    },
    bulkWorkflow: {
      mode: 'setup',
      mapping: {},
      datasetColumns: [],
      datasetRecords: [],
      datasetImages: {},
      imageMatchColumn: null,
      matchedImageCount: 0,
      sampleRecordIndex: 0,
      isProcessing: false,
      progress: 0,
      processedRecords: [],
      templateVariants: [],
      exportSettings: {
        dpi: 300,
        pageSize: 'A3',
        bleed: 0,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        gutterX: 0,
        gutterY: 0,
        showCutLines: false,
        showRegistrationMarks: true,
        mirrorBackside: true,
      },
    },
  },
};

const clone = (value: any) => JSON.parse(JSON.stringify(value));

function mergeDesignWithDefaults(partial: any = {}): Design {
  const base = clone(defaultDesign);
  return {
    ...base,
    ...partial,
    customColorCode: partial.customColorCode ?? partial.lanyardColor ?? base.customColorCode,
    idCard: {
      ...base.idCard,
      ...(partial.idCard ?? {}),
    },
  };
}

function updateAtPath(target: any, path: string, value: any) {
  const keys = path.split('.');
  const next = clone(target);
  let pointer = next;

  keys.slice(0, -1).forEach((key) => {
    pointer[key] = pointer[key] ?? {};
    pointer = pointer[key];
  });

  pointer[keys[keys.length - 1]] = value;
  return next;
}

interface ConfiguratorStore {
  design: Design;
  past: Design[];
  future: Design[];
  uploads: {
    customPatternFile: File | null;
    strapLogoFile: File | null;
    idPhotoFile: File | null;
    idLogoFile: File | null;
  };
  setField: (path: string, value: any) => void;
  toggleAccessory: (label: string) => void;
  setUploadAsset: (key: string, file: File, previewUrl: string, name?: string) => void;
  undo: () => void;
  redo: () => void;
  saveLocal: (id?: string) => void;
  loadLocal: (id?: string) => boolean;
  loadPreset: (presetData: Partial<Design>) => void;
  resetDesign: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useConfiguratorStore = create<ConfiguratorStore>((set, get) => ({
  design: clone(defaultDesign),
  past: [],
  future: [],
  uploads: {
    customPatternFile: null,
    strapLogoFile: null,
    idPhotoFile: null,
    idLogoFile: null,
  },

  setField: (path, value) => {
    set((state) => {
      // Deep clone only the design state, not the whole store
      const currentDesign = clone(state.design);
      const nextDesign = updateAtPath(currentDesign, path, value);
      
      return {
        design: nextDesign,
        past: [...state.past.slice(-20), state.design], // Cap history at 20 for memory safety
        future: [],
      };
    });
    
    // Defer saving to next tick for UI responsiveness
    setTimeout(() => {
      const { design, saveLocal } = get();
      if (design.idCard.selected) {
        saveLocal(design.idCard.selected);
      } else {
        saveLocal();
      }
    }, 0);
  },

  toggleAccessory: (label) => set((state) => {
    const current = clone(state.design);
    const accessories = current.accessories.includes(label)
      ? current.accessories.filter((item: string) => item !== label)
      : [...current.accessories, label];
    const nextDesign = { ...current, accessories };
    return {
      design: nextDesign,
      past: [...state.past, state.design],
      future: [],
    };
  }),

  setUploadAsset: (key, file, previewUrl, name = '') => {
    set((state) => ({
      uploads: {
        ...state.uploads,
        [key]: file,
      },
    }));

    if (key === 'strapLogoFile') {
      set((state) => ({
        design: { ...state.design, logoUrl: previewUrl, logoName: name },
        past: [...state.past, state.design],
        future: [],
      }));
    }

    if (key === 'customPatternFile') {
      set((state) => ({
        design: {
          ...state.design,
          customPatternUrl: previewUrl,
          customPatternName: name,
        },
        past: [...state.past, state.design],
        future: [],
      }));
    }

    if (key === 'idPhotoFile') {
      set((state) => ({
        design: {
          ...state.design,
          idCard: { ...state.design.idCard, photoUrl: previewUrl },
        },
        past: [...state.past, state.design],
        future: [],
      }));
    }

    if (key === 'idLogoFile') {
      set((state) => ({
        design: {
          ...state.design,
          idCard: { ...state.design.idCard, logoUrl: previewUrl },
        },
        past: [...state.past, state.design],
        future: [],
      }));
    }
  },

  undo: () =>
    set((state) => {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        design: previous,
        past: state.past.slice(0, -1),
        future: [state.design, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        design: next,
        past: [...state.past, state.design],
        future: state.future.slice(1),
      };
    }),

  saveLocal: (id) => {
    try {
      const snapshot = get().design;
      let dataToSave = JSON.stringify(snapshot);
      const key = id ? `${LOCAL_STORAGE_KEY}-${id}` : LOCAL_STORAGE_KEY;

      if (dataToSave.length > 1200000) {
        const stripped = { ...snapshot };
        if (stripped.logoUrl?.startsWith('data:')) stripped.logoUrl = '';
        if (stripped.customPatternUrl?.startsWith('data:')) stripped.customPatternUrl = '';
        if (stripped.idCard?.photoUrl?.startsWith('data:')) {
          stripped.idCard = { ...stripped.idCard, photoUrl: '' };
        }
        if (stripped.idCard?.logoUrl?.startsWith('data:')) {
          stripped.idCard = { ...stripped.idCard, logoUrl: '' };
        }
        // If we are still too large, we might have to strip the dataset images (blob URLs)
        // since they are invalid on refresh anyway.
        if (dataToSave.length > 2000000) {
          stripped.idCard = { 
            ...stripped.idCard, 
            bulkWorkflow: { 
              ...stripped.idCard.bulkWorkflow, 
              datasetImages: {} 
            } 
          };
        }
        dataToSave = JSON.stringify(stripped);
      }

      window.localStorage.setItem(key, dataToSave);
    } catch (e) {
      console.warn("localStorage quota exceeded, clearing old draft and trying again", e);
    }
  },

  loadLocal: (id) => {
    const key = id ? `${LOCAL_STORAGE_KEY}-${id}` : LOCAL_STORAGE_KEY;
    const saved = window.localStorage.getItem(key);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      set({ design: mergeDesignWithDefaults(parsed), past: [], future: [] });
      return true;
    } catch {
      return false;
    }
  },

  loadPreset: (presetData) => {
    set((state) => ({
      design: mergeDesignWithDefaults({ ...clone(defaultDesign), ...presetData }),
      past: [...state.past, state.design],
      future: [],
    }));
  },

  resetDesign: () => {
    // 1. Identify current project ID before resetting
    const currentDesign = get().design;
    const projectId = currentDesign.idCard.selected;
    
    // 2. Clear localStorage permanently
    try {
      if (projectId) {
        window.localStorage.removeItem(`${LOCAL_STORAGE_KEY}-${projectId}`);
      }
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn("Error clearing localStorage:", e);
    }

    // 3. Reset in-memory state
    set({
      design: clone(defaultDesign),
      past: [],
      future: [],
      uploads: {
        customPatternFile: null,
        strapLogoFile: null,
        idPhotoFile: null,
        idLogoFile: null,
      },
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
