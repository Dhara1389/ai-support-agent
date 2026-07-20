import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PDF_MIME_TYPE = 'application/pdf';

export const validateFileType = (mimetype: string): boolean => {
  return mimetype === PDF_MIME_TYPE;
};

export const validateFileSize = (bytes: number, maxMB: number): boolean => {
  const maxBytes = maxMB * 1024 * 1024;
  return bytes > 0 && bytes <= maxBytes;
};

export const generateUniqueFilename = (originalName: string): string => {
  const extension = path.extname(originalName).toLowerCase() || '.pdf';
  const safeExtension = extension === '.pdf' ? extension : '.pdf';

  return `${uuidv4()}${safeExtension}`;
};
