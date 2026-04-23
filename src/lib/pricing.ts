import {
  accessoryOptions,
  clipTypes,
  lanyardStyles,
  printingMethods,
  widths,
} from '../data/options';

export const BASE_PRICE = 25;

const priceMap = (items: { label: string; price: number }[]) => new Map(items.map((item) => [item.label, item.price]));

const printingMap = priceMap(printingMethods);
const styleMap = priceMap(lanyardStyles);
const widthMap = priceMap(widths);
const clipMap = priceMap(clipTypes);
const accessoryMap = priceMap(accessoryOptions);

export function calculatePricing(design: any) {
  const printing = printingMap.get(design.printingMethod) ?? 0;
  const style = styleMap.get(design.lanyardStyle) ?? 0;
  const width = widthMap.get(design.width) ?? 0;
  const clip = clipMap.get(design.clipType) ?? 0;
  const accessories = design.accessories.reduce(
    (sum: number, item: string) => sum + (accessoryMap.get(item) ?? 0),
    0,
  );
  const subtotalPerUnit = BASE_PRICE + printing + style + width + clip + accessories;
  
  // Bulk pricing logic
  let discountMultiplier = 1;
  const quantity = Number(design.quantity || 0);
  
  if (quantity >= 1000) discountMultiplier = 0.6; // 40% off
  else if (quantity >= 500) discountMultiplier = 0.7; // 30% off
  else if (quantity >= 100) discountMultiplier = 0.8; // 20% off
  else if (quantity >= 50) discountMultiplier = 0.9; // 10% off
  
  const pricePerUnit = Math.round(subtotalPerUnit * discountMultiplier);
  const total = pricePerUnit * quantity;

  return {
    base: BASE_PRICE,
    printing,
    style,
    width,
    clip,
    accessories,
    subtotalPerUnit,
    discountPercent: Math.round((1 - discountMultiplier) * 100),
    pricePerUnit,
    total,
  };
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
