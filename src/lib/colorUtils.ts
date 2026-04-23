const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR_REGEX = /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i;

function clampChannel(value: number | string) {
  return Math.max(0, Math.min(255, Number(value)));
}

function expandShortHex(value: string) {
  return value.length === 4
    ? `#${value.slice(1).split('').map((part) => `${part}${part}`).join('')}`
    : value;
}

export function parseColorCode(input = '') {
  const value = input.trim();
  if (!value) return { valid: false, normalized: '', rgb: null, format: null };

  if (HEX_COLOR_REGEX.test(value)) {
    const normalized = expandShortHex(value).toUpperCase();
    const numeric = normalized.slice(1);
    return {
      valid: true,
      normalized,
      format: 'HEX',
      rgb: {
        r: parseInt(numeric.slice(0, 2), 16),
        g: parseInt(numeric.slice(2, 4), 16),
        b: parseInt(numeric.slice(4, 6), 16),
      },
    };
  }

  const rgbMatch = value.match(RGB_COLOR_REGEX);
  if (rgbMatch) {
    const channels = rgbMatch.slice(1).map(Number);
    if (channels.every((channel) => channel >= 0 && channel <= 255)) {
      const [r, g, b] = channels.map(clampChannel);
      return {
        valid: true,
        normalized: `rgb(${r}, ${g}, ${b})`,
        format: 'RGB',
        rgb: { r, g, b },
      };
    }
  }

  return { valid: false, normalized: '', rgb: null, format: null };
}

export function darkenColor(color: string, amount = 25) {
  const parsed = parseColorCode(color);
  if (!parsed.valid || !parsed.rgb) return color;

  const next = Object.values(parsed.rgb).map((channel) => Math.max(0, channel - amount));
  return `rgb(${next[0]}, ${next[1]}, ${next[2]})`;
}

export function toHexColor(color: string, fallback = '#2563eb') {
  const parsed = parseColorCode(color);
  if (!parsed.valid || !parsed.rgb) return fallback;

  return `#${[parsed.rgb.r, parsed.rgb.g, parsed.rgb.b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}
