import { fileTypeFromFile } from "file-type";
import fs from "fs/promises";
import { AppError } from "../../lib/errors/appError.js";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const allowedFields = {
  image: ["image/jpeg", "image/png"],
  // .docx, not the old .doc: file-type reports .doc as application/x-cfb, a container
  // shared with .xls, .ppt and .msi installers, so it can't prove the file is a document
  document: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  video: ["video/mp4"],
  // file-type reports mp3 files as audio/mpeg
  audio: ["audio/mpeg"],
};

// the extension a saved file gets. never taken from the client's file name:
// a real png named x.html would be served as a web page and run its scripts
export const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "video/mp4": ".mp4",
  "audio/mpeg": ".mp3",
};

// the mimetype multer checked comes from the client and can be faked,
// so this reads the file's first bytes (its signature) to find the real type.
// it must match the claimed one, because the extension was picked from the claim
async function hasAllowedType(file, allowedMimeTypes) {
  const type = await fileTypeFromFile(file.path);
  return (
    Boolean(type) &&
    type.mime === file.mimetype &&
    allowedMimeTypes.includes(type.mime)
  );
}

async function removeFiles(files) {
  await Promise.all(files.map((f) => fs.rm(f.path, { force: true })));
}

// for uploadSingleFile (req.file)
export const fileValidation =
  (allowedMimeTypes = allowedFields.image) =>
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError("No file uploaded", 400);

      if (!(await hasAllowedType(req.file, allowedMimeTypes))) {
        await removeFiles([req.file]);
        throw new AppError("Invalid file type", 400);
      }
      next();
    } catch (error) {
      next(error);
    }
  };

// for uploadMultipleFiles (req.files)
export const filesValidation =
  (allowedMimeTypes = allowedFields.image) =>
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        throw new AppError("No files uploaded", 400);
      }
      for (const file of req.files) {
        if (!(await hasAllowedType(file, allowedMimeTypes))) {
          // one bad file rejects the whole upload
          await removeFiles(req.files);
          throw new AppError("Invalid file type", 400);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
