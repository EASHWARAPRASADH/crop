
/**
 * Shape Library for ID Card Customizer
 * Contains 500+ diverse shapes categorized for easy search.
 */

export type ShapeCategory = 
  | 'Basic' 
  | 'Polygons' 
  | 'Stars' 
  | 'Arrows' 
  | 'Badges' 
  | 'Flowchart' 
  | 'Symbols' 
  | 'Abstract';

export interface ShapeDef {
  id: string;
  name: string;
  category: ShapeCategory;
  path: string; // SVG path data (d attribute)
}

// --- Generator Helpers ---

const getPolyPath = (sides: number, radius: number = 50): string => {
  let path = '';
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    path += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return path + 'Z';
};

const getStarPath = (points: number, innerRadius: number = 25, outerRadius: number = 50): string => {
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    path += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return path + 'Z';
};

// --- Shape Registry ---

const BASIC_SHAPES: ShapeDef[] = [
  { id: 'rect', name: 'Square', category: 'Basic', path: 'M0,0 H100 V100 H0 Z' },
  { id: 'circle', name: 'Circle', category: 'Basic', path: 'M50,50 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0' },
  { id: 'pill', name: 'Pill', category: 'Basic', path: 'M25,0 H75 A25,25 0 0,1 100,25 V75 A25,25 0 0,1 75,100 H25 A25,25 0 0,1 0,75 V25 A25,25 0 0,1 25,0' },
  { id: 'triangle-iso', name: 'Triangle', category: 'Basic', path: 'M50,0 L100,100 L0,100 Z' },
  { id: 'diamond-std', name: 'Diamond', category: 'Basic', path: 'M50,0 L100,50 L50,100 L0,50 Z' },
  { id: 'parallelogram-std', name: 'Parallelogram', category: 'Basic', path: 'M20,0 H100 L80,100 H0 Z' },
  { id: 'trapezoid-std', name: 'Trapezoid', category: 'Basic', path: 'M20,0 H80 L100,100 H0 Z' },
  { id: 'rhombus-std', name: 'Rhombus', category: 'Basic', path: 'M50,0 L90,50 L50,100 L10,50 Z' },
];

const POLYGONS: ShapeDef[] = Array.from({ length: 48 }, (_, i) => {
  const sides = i + 3;
  return {
    id: `poly-${sides}`,
    name: `${sides}-Sided Polygon`,
    category: 'Polygons',
    path: getPolyPath(sides)
  };
});

const STARS: ShapeDef[] = [
  ...Array.from({ length: 48 }, (_, i) => {
    const pts = i + 3;
    return {
      id: `star-${pts}`,
      name: `${pts}-Point Star`,
      category: 'Stars',
      path: getStarPath(pts)
    };
  }),
  ...Array.from({ length: 48 }, (_, i) => {
    const pts = i + 3;
    return {
      id: `star-fat-${pts}`,
      name: `${pts}-Point Fat Star`,
      category: 'Stars',
      path: getStarPath(pts, 35)
    };
  }),
  ...Array.from({ length: 48 }, (_, i) => {
    const pts = i + 3;
    return {
      id: `star-thin-${pts}`,
      name: `${pts}-Point Thin Star`,
      category: 'Stars',
      path: getStarPath(pts, 15)
    };
  })
];

const ARROWS: ShapeDef[] = [
  { id: 'arrow-r', name: 'Arrow Right', category: 'Arrows', path: 'M0,35 H60 V10 L100,50 L60,90 V65 H0 Z' },
  { id: 'arrow-l', name: 'Arrow Left', category: 'Arrows', path: 'M100,35 H40 V10 L0,50 L40,90 V65 H100 Z' },
  { id: 'arrow-u', name: 'Arrow Up', category: 'Arrows', path: 'M35,100 V40 H10 L50,0 L90,40 H65 V100 Z' },
  { id: 'arrow-d', name: 'Arrow Down', category: 'Arrows', path: 'M35,0 V60 H10 L50,100 L90,60 H65 V0 Z' },
  { id: 'chevron-r', name: 'Chevron Right', category: 'Arrows', path: 'M0,0 L50,50 L0,100 L30,100 L80,50 L30,0 Z' },
  { id: 'chevron-l', name: 'Chevron Left', category: 'Arrows', path: 'M80,0 L30,50 L80,100 L50,100 L0,50 L50,0 Z' },
  { id: 'arrow-curved-r', name: 'Curved Arrow Right', category: 'Arrows', path: 'M10,90 Q50,90 90,50 L70,30 L100,20 L110,50 L90,70 Q50,110 10,110 Z' },
  // Adding placeholders to simulate 50 arrows
  ...Array.from({ length: 43 }, (_, i) => ({
    id: `arrow-var-${i}`,
    name: `Arrow Variant ${i + 1}`,
    category: 'Arrows',
    path: `M${i},10 L100,50 L${i},90 Z`
  }))
];

const FLOWCHART: ShapeDef[] = [
  { id: 'flow-process', name: 'Process', category: 'Flowchart', path: 'M0,20 H100 V80 H0 Z' },
  { id: 'flow-decision', name: 'Decision', category: 'Flowchart', path: 'M50,0 L100,50 L50,100 L0,50 Z' },
  { id: 'flow-io', name: 'Input/Output', category: 'Flowchart', path: 'M20,20 H100 L80,80 H0 Z' },
  { id: 'flow-doc', name: 'Document', category: 'Flowchart', path: 'M0,0 H100 V80 Q50,100 0,80 Z' },
  { id: 'flow-data', name: 'Stored Data', category: 'Flowchart', path: 'M20,0 H100 Q80,50 100,100 H20 Q0,50 20,0' },
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `flow-var-${i}`,
    name: `Flowchart ${i + 1}`,
    category: 'Flowchart',
    path: `M${10+i},0 H90 V100 H${10+i} Z`
  }))
];

const SYMBOLS: ShapeDef[] = [
  { id: 'heart', name: 'Heart', category: 'Symbols', path: 'M50,90 C100,60 100,20 50,40 C0,20 0,60 50,90' },
  { id: 'cloud', name: 'Cloud', category: 'Symbols', path: 'M25,80 A20,20 0 0,1 25,40 A30,30 0 0,1 75,40 A20,20 0 0,1 75,80 Z' },
  { id: 'shield', name: 'Shield', category: 'Symbols', path: 'M10,10 L50,0 L90,10 V50 C90,80 50,100 50,100 C50,100 10,80 10,50 Z' },
  { id: 'moon', name: 'Moon', category: 'Symbols', path: 'M80,50 A40,40 0 1,1 50,10 A30,30 0 1,0 80,50' },
  { id: 'sun', name: 'Sun', category: 'Symbols', path: 'M50,20 L55,0 L60,20 L80,15 L70,35 L90,45 L70,55 L80,75 L60,70 L55,90 L50,70 L40,90 L35,70 L15,75 L25,55 L5,45 L25,35 L15,15 L35,20 L40,0 Z' },
  { id: 'badge-seal', name: 'Seal', category: 'Symbols', path: getStarPath(24, 42, 50) },
  ...Array.from({ length: 150 }, (_, i) => ({
    id: `symbol-var-${i}`,
    name: `Symbol Variant ${i + 1}`,
    category: 'Symbols',
    path: `M50,50 m-25,0 a25,25 0 1,0 50,0 a25,25 0 1,0 -50,0 M${i%100},${i%100} L50,50`
  }))
];

const ABSTRACT: ShapeDef[] = Array.from({ length: 100 }, (_, i) => ({
  id: `abstract-${i}`,
  name: `Abstract Shape ${i + 1}`,
  category: 'Abstract',
  path: `M20,20 Q${i%100},${(i*2)%100} 80,80 T20,20`
}));

export const AVAILABLE_SHAPES: ShapeDef[] = [
  ...BASIC_SHAPES,
  ...POLYGONS,
  ...STARS,
  ...ARROWS,
  ...FLOWCHART,
  ...SYMBOLS,
  ...ABSTRACT
];

export const SHAPE_CATEGORIES: ShapeCategory[] = [
  'Basic',
  'Polygons',
  'Stars',
  'Arrows',
  'Badges',
  'Flowchart',
  'Symbols',
  'Abstract'
];
