import { validateDTO } from "../../../lib/validation/validation.js";
import * as messageService from "../services/message.service.js";
import { sendMessageDto } from "../dto/message.dto.js";

export async function sendMessage(req, res, next) {
  try {
    const { content, receiver } = validateDTO(sendMessageDto, req.body);
    // undefined on the anonymous route, which has no guard
    const sender = req.user?.id;
    const createdMessage = await messageService.sendMessage(
      content,
      receiver,
      sender,
    );
    res.status(201).json({
      message: "your message is created successfully",
      success: true,
      data: createdMessage,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllMessages(req, res, next) {
  try {
    const messages = await messageService.getAllMessages(req.user.id);
    res.json({
      message: "done",
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}
