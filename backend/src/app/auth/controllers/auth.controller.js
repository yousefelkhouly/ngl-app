import { validateDTO } from "../../../lib/validation/validation.js";
import {
  emailCodeDTO,
  googleLoginDTO,
  loginDTO,
  registerDTO,
  resetPasswordDTO,
  sendOtpDTO,
} from "../dto/auth.dto.js";
import * as authService from "../services/auth.service.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";

export async function register(req, res, next) {
  try {
    const data = validateDTO(registerDTO, req.body);
    const createdUser = await authService.register(data);
    res.status(201).json({
      message: "user created successfully, check your email for the verification code",
      success: true,
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyAccount(req, res, next) {
  try {
    const { email, code } = validateDTO(emailCodeDTO, req.body);
    await authService.verifyAccount(email, code);
    res.json({
      message: "account verified successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendOtp(req, res, next) {
  try {
    const { email } = validateDTO(sendOtpDTO, req.body);
    await authService.sendOtp(email);
    res.json({
      // the same answer whether or not the email has an account
      message: "if an account uses this email, a new code was sent to it",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = validateDTO(resetPasswordDTO, req.body);
    await authService.resetPassword(email, code, newPassword);
    res.json({
      message: "password reset successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = validateDTO(loginDTO, req.body);

    // login never issues tokens: it always emails a code
    const { twoStepEnabled } = await authService.login(email, password);

    res.json({
      message: twoStepEnabled
        ? "verification code sent to your email, use it on /verify-code-to-login to log in"
        : "2 step verification is not enabled, code sent to your email, use it on /enable-2-step-verification",
      success: true,
      twoStepEnabled,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyCodeToLogin(req, res, next) {
  try {
    const { email, code } = validateDTO(emailCodeDTO, req.body);
    const tokens = await authService.verifyCodeToLogin(email, code);
    setAuthCookies(res, tokens);
    res.json({
      message: "user login successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function enable2StepVerification(req, res, next) {
  try {
    const { email, code } = validateDTO(emailCodeDTO, req.body);
    const tokens = await authService.enable2StepVerification(email, code);
    setAuthCookies(res, tokens);
    res.json({
      message: "Two-step verification enabled and user logged in successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginWithGoogle(req, res, next) {
  try {
    const { idToken } = validateDTO(googleLoginDTO, req.body);
    const tokens = await authService.loginWithGoogle(idToken);
    setAuthCookies(res, tokens);
    res.json({
      message: "user login successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const tokens = await authService.refresh(req.cookies.refresh_token);
    setAuthCookies(res, tokens);
    res.json({
      message: "tokens refreshed successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.cookies.refresh_token);
    clearAuthCookies(res);
    res.json({
      message: "user logout successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}
