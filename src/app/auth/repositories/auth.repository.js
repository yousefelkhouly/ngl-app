import { User } from "../../user/models/user.model.js";

export async function checkUSerByEmail(email) {
  return await User.findOne({ email: email });
}

export async function createUser(userData) {
  return await User.create(userData);
}
