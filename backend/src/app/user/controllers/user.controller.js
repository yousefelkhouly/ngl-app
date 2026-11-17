import { validateDTO } from "../../../lib/validation/validation.js";
import * as userService from "../services/user.service.js";
import { documentIdDto, profileHandleDto, updateProfileDto } from "../dto/user.dto.js";
import { renewSession } from "../../auth/services/auth.service.js";
import { setAuthCookies } from "../../auth/utils/cookies.js";

export const getMe = async (req, res, next) => {
  try {
    const data = await userService.getProfile(req.user.id);
    res.json({ message: "done", success: true, data });
  } catch (error) {
    next(error);
  }
};

export const unblockEveryone = async (req, res, next) => {
  try {
    const data = await userService.unblockEveryone(req.user.id);
    res.json({ message: "everyone you blocked is unblocked", success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const changes = validateDTO(updateProfileDto, req.body);
    const data = await userService.updateProfile(req.user.id, changes);
    // the name travels in the session: a new one shows the change everywhere straight away
    if (changes.name !== undefined) {
      setAuthCookies(res, await renewSession(req.user.id, req.cookies.refresh_token));
    }
    res.json({ message: "profile updated", success: true, data });
  } catch (error) {
    next(error);
  }
};

export const removeProfilePicture = async (req, res, next) => {
  try {
    const data = await userService.removeProfilePicture(req.user.id);
    res.json({ message: "profile picture removed", success: true, data });
  } catch (error) {
    next(error);
  }
};

export const removeCoverImages = async (req, res, next) => {
  try {
    const data = await userService.removeCoverImages(req.user.id);
    res.json({ message: "cover images removed", success: true, data });
  } catch (error) {
    next(error);
  }
};

// what anyone with the link sees: name, picture and cover images, never email or documents
export const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = validateDTO(profileHandleDto, req.params);
    const data = await userService.getPublicProfile(id);
    res.json({ message: "done", success: true, data });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req, res, next) => {
  try {
    const data = await userService.uploadProfile(req.user.id, req.file);
    res.json({
      message: "Profile picture uploaded successfully",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCoverImages = async (req, res, next) => {
  try {
    const data = await userService.uploadCoverImages(req.user.id, req.files);
    res.json({
      message: "Cover images uploaded successfully",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocuments = async (req, res, next) => {
  try {
    const data = await userService.addDocuments(req.user.id, req.files);
    res.status(201).json({
      message: "Documents uploaded successfully",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { documentId } = validateDTO(documentIdDto, req.params);
    await userService.deleteDocument(req.user.id, documentId);
    res.json({ message: "Document deleted", success: true });
  } catch (error) {
    next(error);
  }
};
