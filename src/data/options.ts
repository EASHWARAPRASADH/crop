export const printingMethods = [
  { label: 'Screen Printed', price: 0, description: 'A clean printed finish for simple logos and text.' },
  { label: 'Woven', price: 10, description: 'Text and shapes are woven into the strap for a stitched look.' },
  { label: 'Sublimated', price: 15, description: 'Best for colourful artwork and detailed full-strap designs.' },
];

export const lanyardStyles = [
  { label: 'Single Ended', price: 0, description: 'One connection point to the badge holder.' },
  { label: 'Double Ended', price: 5, description: 'Two connection points for extra balance and support.' },
];

export const widths = [
  { label: '12mm', price: 2, description: 'Slim and lightweight design.' },
  { label: '16mm', price: 3, description: 'A sleek, professional width.' },
  { label: '20mm', price: 5, description: 'The popular standard for clear branding.' },
  { label: '25mm', price: 7, description: 'Extra wide for maximum impact.' },
];

export const clipTypes = [
  { label: 'Metal Hook', price: 0, description: 'Classic sturdy metal clip.' },
  { label: 'Plastic Hook', price: 3, description: 'Lightweight clip with a softer finish.' },
  { label: 'Crocodile Clip', price: 4, description: 'Strong grip clip for badge holders.' },
  { label: 'Ski Reel', price: 6, description: 'Retractable reel for easy badge scanning.' },
];

export const accessoryOptions = [
  { label: 'Safety Break', price: 3, description: 'Adds a breakaway point for extra safety.' },
  { label: 'Quick Release Buckle', price: 4, description: 'Lets you detach the lower section quickly.' },
  { label: 'Badge Holder', price: 6, description: 'Includes a clear holder for the ID card.' },
];

export const quantities = [50, 100, 200, 500, 1000];

export const fonts = ['Arial', 'Montserrat', 'Roboto', 'Open Sans'];

export const presetColors = [
  { name: 'Navy', value: '#1e3a8a', pantone: 'Pantone 294 C' },
  { name: 'Royal Blue', value: '#2563eb', pantone: 'Pantone 300 C' },
  { name: 'Crimson', value: '#dc2626', pantone: 'Pantone 186 C' },
  { name: 'Emerald', value: '#059669', pantone: 'Pantone 347 C' },
  { name: 'Amber', value: '#d97706', pantone: 'Pantone 1375 C' },
  { name: 'Charcoal', value: '#334155', pantone: 'Pantone Cool Gray 11 C' },
  { name: 'Violet', value: '#7c3aed', pantone: 'Pantone 2685 C' },
  { name: 'Black', value: '#111827', pantone: 'Pantone Black C' },
];

export const gradientPresets = [
  { name: 'Sunset', value: 'linear-gradient(90deg, #ff7e5f, #feb47b)' },
  { name: 'Ocean', value: 'linear-gradient(90deg, #2193b0, #6dd5ed)' },
  { name: 'Lush', value: 'linear-gradient(90deg, #56ab2f, #a8e063)' },
  { name: 'Indigo', value: 'linear-gradient(90deg, #4b6cb7, #182848)' },
  { name: 'Purple', value: 'linear-gradient(90deg, #834d9b, #d04ed6)' },
  { name: 'Fire', value: 'linear-gradient(90deg, #f12711, #f5af19)' },
  { name: 'Cyan Glow', value: 'linear-gradient(90deg, #00C9FF, #92FE9D)' },
  { name: 'Neon Rose', value: 'linear-gradient(90deg, #F53844, #42378F)' },
  { name: 'Peach', value: 'linear-gradient(90deg, #ED4264, #FFEDBC)' },
  { name: 'Dark Void', value: 'linear-gradient(90deg, #870000, #190A05)' },
  { name: 'Cosmic', value: 'linear-gradient(90deg, #ff00cc, #333399)' },
  { name: 'Sublime', value: 'linear-gradient(90deg, #fc4a1a, #f7b733)' },
  { name: 'Creme Orange', value: 'linear-gradient(90deg, #FFC067, #e5a44a)' },
  { name: 'Blast Orange', value: 'linear-gradient(90deg, #FCA446, #e68d2f)' },
  { name: 'Scampi', value: 'linear-gradient(90deg, #F79739, #de8125)' },
  { name: 'Orangina', value: 'linear-gradient(90deg, #F28C28, #d97816)' },
  { name: 'Pure Orange', value: 'linear-gradient(90deg, #DF5D22, #c74d15)' },
  { name: 'Blood Orange', value: 'linear-gradient(90deg, #C82A26, #b01b17)' },
  { name: 'Lychee', value: 'linear-gradient(90deg, #F7A8B8, #de91a2)' },
  { name: 'Strawberry', value: 'linear-gradient(90deg, #E24866, #c93653)' },
  { name: 'Raspberry', value: 'linear-gradient(90deg, #C11B41, #a81031)' },
  { name: 'Ketchup', value: 'linear-gradient(90deg, #AC142F, #940a21)' },
  { name: 'Pink Pink', value: 'linear-gradient(90deg, #de428e, #c43179)' },
  { name: 'Baby Skin', value: 'linear-gradient(90deg, #f0d5ce, #d9bdb6)' },
  { name: 'Lavender', value: 'linear-gradient(90deg, #7c5fb3, #674b9e)' },
  { name: 'Cassis', value: 'linear-gradient(90deg, #372c47, #21192e)' },
  { name: 'Louie Lilac', value: 'linear-gradient(90deg, #2b3a7a, #162461)' },
  { name: 'Denim', value: 'linear-gradient(90deg, #7cb8d5, #64a2c2)' },
  { name: 'Olive Green', value: 'linear-gradient(90deg, #596131, #434a1f)' },
  { name: 'Flash Yellow', value: 'linear-gradient(90deg, #ffea00, #e6d300)' },
];

export const pantonePalette = presetColors.map(({ pantone, value }) => ({ pantone, value }));
