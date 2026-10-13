import bcrypt from "bcrypt";
import argon2 from "argon2";

// export async function hashPassword(password) {
//   return bcrypt.hash(password, 10);
// }
// export async function comparePassword(password, hashPassword) {
//   return bcrypt.compare(password, hashPassword);
// }
export async function hashPassword(password) {
  return argon2.hash(password);
}
export async function comparePassword(password, hashPassword) {
  return argon2.verify(hashPassword, password);
}
