import { config } from "dotenv";
config();

import "./common/bd/mongoose.js";
import express from "express";
import authRouter from "./app/auth/auth.route.js";
import messageRouter from "./app/message/message.route.js";
import userRouter from "./app/user/user.route.js";
// import { OTP } from "./app/auth/models/otp.model.js";
import { logger } from "./common/logger/logger.js";

const app = express();

app.use(express.json());
app.use("/auth", authRouter);
app.use("/message", messageRouter);
app.use("/user", userRouter);

app.use((err, req, res, next) => {
  console.log(err);
  logger.error(err.message, err);

  if (err.isOperational === true) {
    return res.status(err.statusCode).json({
      message: err.message,
      success: false,
      stack: err.stack,
    });
  }
  return res.status(500).json({
    message: "somthing went wrong",
    success: false,
  });
});

app.listen(5000, () => logger.info("app is running at port 5000"));
console.log(process.env.MONGODB_URL);
// OTP.create({
//   code: "121212",
//   email: "ekekek@gmail.com",
//   expiresAt: Date.now() + 30 * 1000,
// });
