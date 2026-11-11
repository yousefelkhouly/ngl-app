import { validateDTO } from "../../../lib/validation/validation.js";
import * as requestService from "../services/request.service.js";
import { requestIdDto } from "../dto/request.dto.js";

export async function acceptRequest(req, res, next) {
  try {
    const { id } = validateDTO(requestIdDto, req.params);
    const data = await requestService.acceptRequest(id, req.user.id);
    res.json({
      message: "request accepted, conversation created",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function declineRequest(req, res, next) {
  try {
    const { id } = validateDTO(requestIdDto, req.params);
    const data = await requestService.declineRequest(id, req.user.id);
    res.json({
      message: "request declined",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
