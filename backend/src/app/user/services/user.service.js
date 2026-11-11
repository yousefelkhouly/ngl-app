import fs from "fs/promises";
import * as userRepository from "../repositories/user.repository.js";
import { userNotExist } from "../errors.js";

// deletes files without failing when one is already gone
async function removeFiles(paths) {
  await Promise.all(paths.map((path) => fs.rm(path, { force: true })));
}

// saves the new path(s) first, then deletes the old file(s),
// so a failed update never leaves the user with no file at all
async function replaceUserFiles(userId, field, newValue, uploadedPaths) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    // nobody to attach the upload to, don't keep it on disk
    await removeFiles(uploadedPaths);
    throw userNotExist;
  }

  const oldValue = user[field];
  await userRepository.updateUserById(userId, { [field]: newValue });

  const oldPaths = Array.isArray(oldValue) ? oldValue : [oldValue];
  await removeFiles(oldPaths.filter(Boolean));
}

export async function uploadProfile(userId, file) {
  await replaceUserFiles(userId, "profilePicturePath", file.path, [file.path]);
}

export async function uploadCv(userId, file) {
  await replaceUserFiles(userId, "cvPath", file.path, [file.path]);
}

export async function uploadCoverImages(userId, files) {
  const paths = files.map((file) => file.path);
  await replaceUserFiles(userId, "coverImagesPath", paths, paths);
}
