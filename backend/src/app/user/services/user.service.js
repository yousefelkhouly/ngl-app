import fs from "fs/promises";
import path from "path";
import * as userRepository from "../repositories/user.repository.js";
import { documentNotFound, tooManyDocuments, userNotExist } from "../errors.js";
import { DOCUMENT_NAME_MAX_LENGTH, MAX_DOCUMENTS } from "../models/user.model.js";
import { UPLOADS_DIR } from "../../../pkg/media/multer.js";

const publicPath = (file) => `/uploads/${file.filename}`;

const diskPath = (savedPath) => path.join(UPLOADS_DIR, path.basename(savedPath));

async function removeFiles(paths) {
  await Promise.all(paths.map((p) => fs.rm(p, { force: true })));
}

async function replaceUserFiles(userId, field, newValue, uploadedFiles) {
  const uploadedPaths = uploadedFiles.map((file) => file.path);

  let before;
  try {
    before = await userRepository.replaceUserField(userId, field, newValue);
  } catch (error) {
    await removeFiles(uploadedPaths);
    throw error;
  }
  if (!before) {
    await removeFiles(uploadedPaths);
    throw userNotExist;
  }

  const oldValue = before[field];
  const oldPaths = Array.isArray(oldValue) ? oldValue : [oldValue];
  await removeFiles(oldPaths.filter(Boolean).map(diskPath));
}

export async function getProfile(userId) {
  const user = await userRepository.findProfileById(userId);
  if (!user) throw userNotExist;
  return user;
}

export async function getPublicProfile(userId) {
  const user = await userRepository.findPublicProfileById(userId);
  if (!user) throw userNotExist;
  return user;
}

export async function uploadProfile(userId, file) {
  const profilePicturePath = publicPath(file);
  await replaceUserFiles(userId, "profilePicturePath", profilePicturePath, [file]);
  return { profilePicturePath };
}

export async function uploadCoverImages(userId, files) {
  const coverImagesPath = files.map(publicPath);
  await replaceUserFiles(userId, "coverImagesPath", coverImagesPath, files);
  return { coverImagesPath };
}

// multer reads the file name as latin1; browsers send UTF-8, so "سيرة.pdf" would come out garbled.
// control characters are dropped: the name is shown in the page and used as the download name
function displayName(file) {
  const name = Buffer.from(file.originalname, "latin1")
    .toString("utf8")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return (name || "document").slice(0, DOCUMENT_NAME_MAX_LENGTH);
}

export async function addDocuments(userId, files) {
  const uploadedPaths = files.map((file) => file.path);
  const documents = files.map((file) => ({
    name: displayName(file),
    path: publicPath(file),
    mimetype: file.mimetype,
    size: file.size,
  }));

  let after;
  try {
    if (documents.length > MAX_DOCUMENTS) throw tooManyDocuments(MAX_DOCUMENTS);
    after = await userRepository.addDocuments(userId, documents, MAX_DOCUMENTS);
    if (!after) {
      // no match: either the user is gone, or there isn't room for these
      if (!(await userRepository.findUserById(userId))) throw userNotExist;
      throw tooManyDocuments(MAX_DOCUMENTS);
    }
  } catch (error) {
    await removeFiles(uploadedPaths);
    throw error;
  }
  return { documents: after.documents };
}

export async function deleteDocument(userId, documentId) {
  const removed = await userRepository.removeDocument(userId, documentId);
  if (!removed) throw documentNotFound;
  await removeFiles([diskPath(removed.path)]);
}
