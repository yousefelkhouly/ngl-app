import multer, { diskStorage } from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { AppError } from "../../lib/errors/appError.js";
import { allowedFields, MAX_FILE_SIZE } from "./file.validation.js";

export const UPLOADS_DIR = "uploads";
// multer doesn't create the folder: without this, every upload on a fresh clone fails
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function multerFile(allowedMimeTypes = allowedFields.image) {
  return multer({
    // multer stops reading the upload once it passes this size,
    // instead of saving a huge file to disk and rejecting it afterwards
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new AppError("Invalid file type", 400), false);
      }
      cb(null, true);
    },
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (req, file, cb) => {
        // never use the client's file name in the path: a name like "../../x"
        // would write outside uploads/. only the extension is kept
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
        cb(null, `${crypto.randomUUID()}${ext}`);
      },
    }),
  });
}

export function uploadSingleFile(
  fieldName,
  allowedMimeTypes = allowedFields.image,
) {
  return multerFile(allowedMimeTypes).single(fieldName);
}
export function uploadMultipleFiles(
  fieldName,
  maxCount = 4,
  allowedMimeTypes = allowedFields.document,
) {
  return multerFile(allowedMimeTypes).array(fieldName, maxCount);
}
export function uploadFields(fields, allowedMimeTypes = allowedFields.image) {
  return multerFile(allowedMimeTypes).fields(fields);
}
