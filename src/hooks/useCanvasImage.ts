import { useState, useEffect } from 'react';

export const useCanvasImage = (url?: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }

    const img = new window.Image();
    // Only set crossOrigin for http(s) URLs — NOT for blob: or data: URLs
    // blob URLs are same-origin and setting crossOrigin breaks them
    if (url.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      setImage(undefined);
      if (!url.startsWith('data:image/svg+xml')) {
        console.error(`[useCanvasImage] Failed to load: ${url.substring(0, 60)}`);
      }
    };
    img.src = url;
  }, [url]);

  return image;
};
