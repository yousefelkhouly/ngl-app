import * as userRepository from "../repositories/user.repository.js";
import { documentNotFound, tooManyDocuments, usernameTaken, userNotExist } from "../errors.js";
import { generateUsername, isUsernameTaken } from "../utils/username.js";
import { DOCUMENT_NAME_MAX_LENGTH, MAX_DOCUMENTS } from "../models/user.model.js";
import { storage } from "../../../lib/media/init.js";
import { discardUploads } from "../../../pkg/media/storage.js";

// stores the files, then points the user's field at them. if the database update fails the
// stored files are removed again; once it succeeds the files it replaced are removed
async function replaceUserFiles(userId, field, files, toValue) {
  let urls;
  try {
    urls = await storage.save(files);
  } catch (error) {
    await discardUploads(files);
    throw error;
  }

  let before;
  try {
    before = await userRepository.replaceUserField(userId, field, toValue(urls));
  } catch (error) {
    await storage.remove(urls);
    throw error;
  }
  if (!before) {
    await storage.remove(urls);
    throw userNotExist;
  }

  const oldValue = before[field];
  await storage.remove((Array.isArray(oldValue) ? oldValue : [oldValue]).filter(Boolean));
  return toValue(urls);
}

export async function getProfile(userId) {
  let user = await userRepository.findProfileById(userId);
  if (!user) throw userNotExist;
  if (!user.username) {
    await userRepository.ensureUsername(userId, () => generateUsername(user.name));
    user = await userRepository.findProfileById(userId);
  }
  const hasPassword = Boolean(user.password);
  // toJSON drops the password itself
  const { blockedUsers, ...profile } = user.toJSON();
  return { ...profile, hasPassword, blockedCount: blockedUsers?.length ?? 0 };
}

export async function updateProfile(userId, changes) {
  // checked first for a clear answer; the unique index still decides between two at once
  if (changes.username && (await isUsernameTaken(changes.username, userId))) throw usernameTaken;
  const updated = await userRepository.updateNameAndUsername(userId, changes);
  if (updated) return { name: updated.name, username: updated.username };
  if (!(await userRepository.findUserById(userId))) throw userNotExist;
  throw usernameTaken;
}

// takes the picture off and deletes the file
export async function removeProfilePicture(userId) {
  const before = await userRepository.replaceUserField(userId, "profilePicturePath", null);
  if (!before) throw userNotExist;
  if (before.profilePicturePath) await storage.remove([before.profilePicturePath]);
  return { profilePicturePath: null };
}

export async function removeCoverImages(userId) {
  const before = await userRepository.replaceUserField(userId, "coverImagesPath", []);
  if (!before) throw userNotExist;
  await storage.remove(before.coverImagesPath ?? []);
  return { coverImagesPath: [] };
}

export async function unblockEveryone(userId) {
  await userRepository.unblockEveryone(userId);
  return { blockedCount: 0 };
}

// share links use the username; links made before usernames use the account id
export async function getPublicProfile(handle) {
  const user = /^[0-9a-f]{24}$/.test(handle)
    ? await userRepository.findPublicProfileById(handle)
    : await userRepository.findPublicProfileByUsername(handle);
  if (!user) throw userNotExist;
  return user;
}

export async function uploadProfile(userId, file) {
  const profilePicturePath = await replaceUserFiles(userId, "profilePicturePath", [file], ([url]) => url);
  return { profilePicturePath };
}

export async function uploadCoverImages(userId, files) {
  const coverImagesPath = await replaceUserFiles(userId, "coverImagesPath", files, (urls) => urls);
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
  if (files.length > MAX_DOCUMENTS) {
    await discardUploads(files);
    throw tooManyDocuments(MAX_DOCUMENTS);
  }

  let urls;
  try {
    urls = await storage.save(files);
  } catch (error) {
    await discardUploads(files);
    throw error;
  }

  const documents = files.map((file, index) => ({
    name: displayName(file),
    path: urls[index],
    mimetype: file.mimetype,
    size: file.size,
  }));

  let after;
  try {
    after = await userRepository.addDocuments(userId, documents, MAX_DOCUMENTS);
    if (!after) {
      // no match: either the user is gone, or there isn't room for these
      if (!(await userRepository.findUserById(userId))) throw userNotExist;
      throw tooManyDocuments(MAX_DOCUMENTS);
    }
  } catch (error) {
    await storage.remove(urls);
    throw error;
  }
  return { documents: after.documents };
}

export async function deleteDocument(userId, documentId) {
  const removed = await userRepository.removeDocument(userId, documentId);
  if (!removed) throw documentNotFound;
  await storage.remove([removed.path]);
}
