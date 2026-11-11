import multer, { diskStorage } from "multer";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "../../lib/errors/appError.js";
import { allowedFields, EXTENSIONS, MAX_FILE_SIZE } from "./file.validation.js";

// backend/uploads, resolved from this file rather than the cwd
export const UPLOADS_DIR = fileURLToPath(new URL("../../../uploads", import.meta.url));
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
        // nothing from the client's file name: "../../x" would write outside uploads/,
        // and its extension decides how the file is served. fileFilter already
        // limited the mimetype to one that has an extension
        cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`);
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
