import { config } from "dotenv";
config();

import "./common/bd/mongoose.js";
import express from "express";
import authRouter from "./app/auth/auth.route.js";
import messageRouter from "./app/message/message.route.js";
import userRouter from "./app/user/user.route.js";
import { OTP } from "./app/auth/models/otp.model.js";

const app = express();

app.use(express.json());
app.use("/auth", authRouter);
app.use("/message", messageRouter);
app.use("/user", userRouter);

app.listen(5000, () => console.log("app is running at port 5000"));
console.log(process.env.MONGODB_URL);
// OTP.create({
//   code: "121212",
//   email: "ekekek@gmail.com",
//   expiresAt: Date.now() + 30 * 1000,
// });
