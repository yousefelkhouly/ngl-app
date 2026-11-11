import * as userService from "../services/user.service.js";

export const uploadProfilePicture = async (req, res, next) => {
  try {
    await userService.uploadProfile(req.user.id, req.file);
    res.json({
      message: "Profile picture uploaded successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCv = async (req, res, next) => {
  try {
    await userService.uploadCv(req.user.id, req.file);
    res.json({
      message: "CV uploaded successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCoverImages = async (req, res, next) => {
  try {
    await userService.uploadCoverImages(req.user.id, req.files);
    res.json({
      message: "Cover images uploaded successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
