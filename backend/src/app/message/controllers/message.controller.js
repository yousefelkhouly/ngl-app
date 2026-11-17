import { validateDTO } from "../../../lib/validation/validation.js";
import * as messageService from "../services/message.service.js";
import { messageIdDto, reportDto, sendMessageDto } from "../dto/message.dto.js";

export async function sendMessage(req, res, next) {
  try {
    const { content, receiver } = validateDTO(sendMessageDto, req.body);
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

export async function deleteMessage(req, res, next) {
  try {
    const { id } = validateDTO(messageIdDto, req.params);
    const data = await messageService.deleteMessage(id, req.user.id);
    res.json({ message: "note deleted", success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function blockSender(req, res, next) {
  try {
    const { id } = validateDTO(messageIdDto, req.params);
    const data = await messageService.blockSender(id, req.user.id);
    res.json({ message: "sender blocked", success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reportMessage(req, res, next) {
  try {
    const { id } = validateDTO(messageIdDto, req.params);
    const { reason } = validateDTO(reportDto, req.body ?? {});
    const data = await messageService.reportMessage(id, req.user.id, reason);
    res.status(201).json({ message: "note reported", success: true, data });
  } catch (error) {
    next(error);
  }
}
