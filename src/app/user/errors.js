import { AppError } from "../../common/errors/appError.js";

export const userNotExist = new AppError("user does not exist", 404);
export const userAlreadyVerified = new AppError("user already verified", 400);
export const userAlreadyExist = new AppError("user already exists", 409);
export const userNotVerified = new AppError("user already verified", 403);

// class User {
//   userName;
//   email;
//   password;

//   constructor(userName, email, password) {
//     this.userName = userName;
//     this.email = email;
//     this.password = password;
//   }
// }

// const user1 = new User("ka3bora", "ka3bora@gmail.com", "123456789");
// const user2 = new User("joo", "joo@gmail.com", "12345");

// // console.log(user1);
// // console.log(user2);

// class Customer extends User {
//   phone;
//   age;
//   address;
//   isDeleted;
//   isVerified;

//   constructor(userName, email, password, phone, age, address) {
//     super(userName, email, password);
//     this.phone = phone;
//     this.age = age;
//     this.address = address;
//     this.isDeleted = false;
//     this.isVerified = false;
//   }
// }

// const cutomer1 = new Customer(
//   "joo",
//   "joo@g,com",
//   "123123",
//   "01241563782",
//   32,
//   "tanta",
// );

// console.log(cutomer1);
