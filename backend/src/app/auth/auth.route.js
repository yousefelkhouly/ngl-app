import { Router } from "express";
import * as authController from "./controllers/auth.controller.js";
import { authLimiter } from "../../lib/security/rate-limit.js";
import { guard } from "../../lib/auth/guard.js";

const authRouter = Router();

authRouter.post("/register", authLimiter(), authController.register);
authRouter.patch("/verify-account", authLimiter(), authController.verifyAccount);
authRouter.post("/send-otp", authLimiter(), authController.sendOtp);
authRouter.patch("/reset-password", authLimiter(), authController.resetPassword);
authRouter.post("/login", authLimiter(), authController.login);
authRouter.post("/verify-code-to-login", authLimiter(), authController.verifyCodeToLogin);
// turning 2-step verification on or off: ask for a code, then confirm with it
authRouter.post("/two-step/code", guard, authLimiter(), authController.sendTwoStepCode);
authRouter.patch("/two-step", guard, authLimiter(), authController.setTwoStepVerification);
authRouter.post("/login-with-google", authLimiter(), authController.loginWithGoogle);
// account settings. under /auth so the refresh cookie (path /api/auth) comes along:
// these swap the session for a new one
authRouter.patch("/password", guard, authLimiter(), authController.changePassword);
authRouter.post("/email/code", guard, authLimiter(), authController.requestEmailChange);
authRouter.patch("/email", guard, authLimiter(), authController.confirmEmailChange);
authRouter.delete("/account", guard, authLimiter(), authController.deleteAccount);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

export default authRouter;
