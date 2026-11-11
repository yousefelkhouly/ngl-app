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
  // personal information: the document types plus plain text, Excel and PowerPoint
  personalDocument: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
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
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "video/mp4": ".mp4",
  "audio/mpeg": ".mp3",
};

// the mimetype multer checked comes from the client and can be faked,
// so this reads the file's first bytes (its signature) to find the real type.
// it must match the claimed one, because the extension was picked from the claim
async function hasAllowedType(file, allowedMimeTypes) {
  const type = await fileTypeFromFile(file.path);
  // plain text has no signature for file-type to find, so it's checked by content instead
  if (!type && file.mimetype === "text/plain") {
    return allowedMimeTypes.includes("text/plain") && (await isPlainText(file.path));
  }
  return (
    Boolean(type) &&
    type.mime === file.mimetype &&
    allowedMimeTypes.includes(type.mime)
  );
}

// valid UTF-8 with no NUL bytes: binary files nearly always have one
async function isPlainText(path) {
  const bytes = await fs.readFile(path);
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
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
