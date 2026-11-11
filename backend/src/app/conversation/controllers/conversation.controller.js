import { validateDTO } from "../../../lib/validation/validation.js";
import * as conversationService from "../services/conversation.service.js";
import {
  conversationIdDto,
  conversationMessageDto,
} from "../dto/conversation.dto.js";

export async function getConversations(req, res, next) {
  try {
    const data = await conversationService.getConversations(req.user.id);
    res.json({
      message: "done",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = validateDTO(conversationIdDto, req.params);
    const data = await conversationService.getConversation(id, req.user.id);
    res.json({
      message: "done",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { id } = validateDTO(conversationIdDto, req.params);
    const { content } = validateDTO(conversationMessageDto, req.body);
    const data = await conversationService.sendMessage(id, req.user.id, content);
    res.status(201).json({
      message: "message sent",
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
