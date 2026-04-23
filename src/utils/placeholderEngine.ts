import Papa from 'papaparse';

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const replacePlaceholders = (text: string, data: Record<string, string>): string => {
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
  });
};

export const getPlaceholderKeys = (text: string): string[] => {
  const matches = text.matchAll(/\{\{(.*?)\}\}/g);
  return Array.from(matches).map(m => m[1].trim());
};
