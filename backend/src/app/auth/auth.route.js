import { Router } from "express";
import * as authController from "./controllers/auth.controller.js";
import { authLimiter } from "../../lib/security/rate-limit.js";

const authRouter = Router();

authRouter.post("/register", authLimiter(), authController.register);
authRouter.patch("/verify-account", authLimiter(), authController.verifyAccount);
authRouter.post("/send-otp", authLimiter(), authController.sendOtp);
authRouter.patch("/reset-password", authLimiter(), authController.resetPassword);
authRouter.post("/login", authLimiter(), authController.login);
authRouter.post("/verify-code-to-login", authLimiter(), authController.verifyCodeToLogin);
authRouter.patch(
  "/enable-2-step-verification",
  authLimiter(),
  authController.enable2StepVerification,
);
authRouter.post("/login-with-google", authLimiter(), authController.loginWithGoogle);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

export default authRouter;
