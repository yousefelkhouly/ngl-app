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
