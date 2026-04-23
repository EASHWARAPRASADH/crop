const previewableExtensions = ['png', 'svg', 'jpg', 'jpeg', 'webp'];

function createFallbackPreview(fileName = '') {
  const extension = getFileExtension(fileName).toUpperCase() || 'FILE';
  const safeLabel = extension.slice(0, 4);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dbeafe"/>
          <stop offset="100%" stop-color="#bfdbfe"/>
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="22" fill="url(#bg)"/>
      <rect x="28" y="24" width="184" height="112" rx="18" fill="#ffffff" fill-opacity="0.88"/>
      <text x="120" y="88" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#2563eb">${safeLabel}</text>
      <text x="120" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Preview unavailable</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getFileExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function canPreviewFile(file: File) {
  return file.type.startsWith('image/') || previewableExtensions.includes(getFileExtension(file.name));
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function prepareUploadAsset(file: File) {
  const previewUrl = canPreviewFile(file) ? await readFileAsDataUrl(file) : createFallbackPreview(file.name);
  return {
    file,
    name: file.name,
    type: file.type,
    previewUrl,
  };
}
