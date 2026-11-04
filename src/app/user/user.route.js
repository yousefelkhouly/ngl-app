import { Router } from "express";
import {
  uploadMultipleFiles,
  uploadSingleFile,
} from "../../pkg/media/multer.js";
import {
  allowedFields,
  fileValidation,
  filesValidation,
} from "../../pkg/media/file.validation.js";
import * as userController from "./controllers/user.controller.js";
import { guard } from "../../lib/auth/guard.js";

const userRouter = Router();

userRouter.post(
  "/upload-profile-picture",
  guard,
  uploadSingleFile("profilePicture", allowedFields.image),
  fileValidation(allowedFields.image),
  userController.uploadProfilePicture,
);

userRouter.post(
  "/upload-cv",
  guard,
  uploadSingleFile("cv", allowedFields.document),
  fileValidation(allowedFields.document),
  userController.uploadCv,
);

userRouter.post(
  "/upload-cover-images",
  guard,
  uploadMultipleFiles("cover-images", 4, allowedFields.image),
  filesValidation(allowedFields.image),
  userController.uploadCoverImages,
);

export default userRouter;
