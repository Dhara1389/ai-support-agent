import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { generateUniqueFilename, validateFileType } from '../shared/utils/file.utils';
import { AppError } from '../shared/middleware/errorHandler';

const getUploadDir = (): string => {
  return process.env.UPLOAD_DIR || 'uploads';
};

const getMaxFileSizeMB = (): number => {
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
  return Number.isNaN(maxFileSize) ? 10 : maxFileSize;
};

const ensureUploadDirExists = (uploadDir: string): void => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const uploadDir = getUploadDir();
console.log("upload directory (relative) =", uploadDir);
console.log("upload directory (absolute, resolved) =", path.resolve(uploadDir));
ensureUploadDirExists(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    console.log("call catch");
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
   const generatedName = generateUniqueFilename(file.originalname);
  console.log("Generated filename:", generatedName);
  callback(null, generatedName);
  
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  if (!validateFileType(file.mimetype)) {
    callback(new AppError('Only PDF files are allowed', 400));
    return;
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: getMaxFileSizeMB() * 1024 * 1024,
    files: 1,
  },
});

export const uploadDirectory = path.resolve(uploadDir);
