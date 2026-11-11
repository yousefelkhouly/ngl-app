import fs from "fs/promises";
import path from "path";
import * as userRepository from "../repositories/user.repository.js";
import { userNotExist } from "../errors.js";
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

export async function uploadProfile(userId, file) {
  await replaceUserFiles(userId, "profilePicturePath", publicPath(file), [file]);
}

export async function uploadCv(userId, file) {
  await replaceUserFiles(userId, "cvPath", publicPath(file), [file]);
}

export async function uploadCoverImages(userId, files) {
  await replaceUserFiles(userId, "coverImagesPath", files.map(publicPath), files);
}
