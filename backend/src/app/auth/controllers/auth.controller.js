import { validateDTO } from "../../../lib/validation/validation.js";
import {
  changeEmailDTO,
  changePasswordDTO,
  codeDTO,
  deleteAccountDTO,
  emailCodeDTO,
  googleLoginDTO,
  loginDTO,
  registerDTO,
  resetPasswordDTO,
  sendOtpDTO,
  setTwoStepDTO,
  twoStepCodeDTO,
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
    // verifying signs the new user in
    const tokens = await authService.verifyAccount(email, code);
    setAuthCookies(res, tokens);
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
    const { twoStepEnabled, tokens } = await authService.login(email, password);

    // without 2-step verification the user is signed in now; with it, a code was emailed
    if (tokens) setAuthCookies(res, tokens);
    res.json({
      message: twoStepEnabled
        ? "verification code sent to your email, use it on /verify-code-to-login to log in"
        : "user login successfully",
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

export async function sendTwoStepCode(req, res, next) {
  try {
    const { enabled } = validateDTO(twoStepCodeDTO, req.body);
    await authService.sendTwoStepCode(req.user.id, enabled);
    res.json({
      message: "code sent to your email",
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function setTwoStepVerification(req, res, next) {
  try {
    const { enabled, code } = validateDTO(setTwoStepDTO, req.body);
    const data = await authService.setTwoStepVerification(req.user.id, enabled, code);
    res.json({
      message: enabled ? "2 step verification is on" : "2 step verification is off",
      success: true,
      data,
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

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = validateDTO(changePasswordDTO, req.body);
    const tokens = await authService.changePassword(req.user.id, currentPassword, newPassword);
    setAuthCookies(res, tokens);
    res.json({ message: "password changed, other devices are signed out", success: true });
  } catch (error) {
    next(error);
  }
}

export async function requestEmailChange(req, res, next) {
  try {
    const { email } = validateDTO(changeEmailDTO, req.body);
    const data = await authService.requestEmailChange(req.user.id, email);
    res.json({ message: "code sent to the new email", success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function confirmEmailChange(req, res, next) {
  try {
    const { code } = validateDTO(codeDTO, req.body);
    const { email, tokens } = await authService.confirmEmailChange(
      req.user.id,
      code,
      req.cookies.refresh_token,
    );
    setAuthCookies(res, tokens);
    res.json({ message: "email changed", success: true, data: { email } });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { password } = validateDTO(deleteAccountDTO, req.body ?? {});
    await authService.deleteAccount(req.user.id, password);
    clearAuthCookies(res);
    res.json({ message: "account deleted", success: true });
  } catch (error) {
    next(error);
  }
}
