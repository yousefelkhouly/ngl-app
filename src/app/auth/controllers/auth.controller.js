import * as authService from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    console.log("BODY:", req.body);

    const createdUser = await authService.register(req.body);

    res.status(201).json({
      message: "user created successfully",
      success: true,
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
}
