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

// how many documents one upload can carry; the total is capped by MAX_DOCUMENTS
const DOCUMENTS_PER_UPLOAD = 5;

const userRouter = Router();

userRouter.get("/me", guard, userController.getMe);

userRouter.post(
  "/upload-profile-picture",
  guard,
  uploadSingleFile("profilePicture", allowedFields.image),
  fileValidation(allowedFields.image),
  userController.uploadProfilePicture,
);

userRouter.post(
  "/upload-cover-images",
  guard,
  uploadMultipleFiles("cover-images", 4, allowedFields.image),
  filesValidation(allowedFields.image),
  userController.uploadCoverImages,
);

userRouter.post(
  "/documents",
  guard,
  uploadMultipleFiles("documents", DOCUMENTS_PER_UPLOAD, allowedFields.personalDocument),
  filesValidation(allowedFields.personalDocument),
  userController.uploadDocuments,
);

userRouter.delete("/documents/:documentId", guard, userController.deleteDocument);

// last: "/:id" would otherwise also match "/me"
userRouter.get("/:id", userController.getPublicProfile);

export default userRouter;
