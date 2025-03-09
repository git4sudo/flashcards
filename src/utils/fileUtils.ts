interface ImageFile extends File {
  preview: string;
  normalizedName: string;
}

interface ImageGroup {
  name: string;
  front?: ImageFile;
  back?: ImageFile;
}

export const normalizeFileName = (filename: string): string => {
  // Remove file extension
  const baseName = filename.replace(/\.[^/.]+$/, '');
  
  // Convert to lowercase and remove special characters
  return baseName
    .toLowerCase()
    // Remove common suffixes
    .replace(/[-_](front|back|f|b)$/, '')
    // Replace special characters and spaces with underscore
    .replace(/[^a-z0-9]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
};

export const groupImagesByName = (files: ImageFile[]): Record<string, ImageGroup> => {
  const groups: Record<string, ImageGroup> = {};

  files.forEach(file => {
    const name = file.normalizedName;
    const isFront = /[-_](front|f)\.[^/.]+$/.test(file.name.toLowerCase());
    const isBack = /[-_](back|b)\.[^/.]+$/.test(file.name.toLowerCase());

    if (!groups[name]) {
      groups[name] = { name };
    }

    if (isFront && !groups[name].front) {
      groups[name].front = file;
    } else if (isBack && !groups[name].back) {
      groups[name].back = file;
    } else if (!groups[name].front) {
      groups[name].front = file;
    } else if (!groups[name].back) {
      groups[name].back = file;
    }
  });

  // Sort groups by name
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  );
};