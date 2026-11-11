import { User } from "../models/user.model.js";

export async function findUserByEmail(email) {
  return User.findOne({ email, isDeleted: false });
}

export async function findUserById(id) {
  return User.findOne({ _id: id, isDeleted: false }, { password: 0 });
}

export async function createUser(userData) {
  return User.create(userData);
}

export async function deleteUserById(id) {
  return User.deleteOne({ _id: id });
}

export async function updateUserByEmail(email, updatedData) {
  return User.findOneAndUpdate({ email }, updatedData, {
    returnDocument: "after",
    runValidators: true,
  });
}

export async function replaceUserField(id, field, value) {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { [field]: value },
    { returnDocument: "before", runValidators: true, projection: { [field]: 1 } },
  );
}

export async function updateUserById(id, updatedData) {
  return User.findByIdAndUpdate(id, updatedData, {
    returnDocument: "after",
    runValidators: true,
  });
}

const PROFILE_FIELDS = { name: 1, email: 1, profilePicturePath: 1, coverImagesPath: 1, documents: 1 };
const PUBLIC_PROFILE_FIELDS = { name: 1, profilePicturePath: 1, coverImagesPath: 1 };

export async function findProfileById(id) {
  return User.findOne({ _id: id, isDeleted: false }, PROFILE_FIELDS);
}

export async function findPublicProfileById(id) {
  return User.findOne({ _id: id, isDeleted: false }, PUBLIC_PROFILE_FIELDS);
}

// one atomic update: the filter only matches while there's room for all of them,
// so two uploads at once can't go past `max`
export async function addDocuments(id, documents, max) {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false, [`documents.${max - documents.length}`]: { $exists: false } },
    { $push: { documents: { $each: documents } } },
    { returnDocument: "after", runValidators: true, projection: { documents: 1 } },
  );
}

// returns the removed document, or null if this user has none with that id
export async function removeDocument(id, documentId) {
  const before = await User.findOneAndUpdate(
    { _id: id, isDeleted: false, "documents._id": documentId },
    { $pull: { documents: { _id: documentId } } },
    { returnDocument: "before", projection: { "documents.$": 1 } },
  );
  return before?.documents[0] ?? null;
}
