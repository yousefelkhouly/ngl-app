import * as conversationRepository from "../repositories/conversation.repository.js";
import * as messageRepository from "../../message/repositories/message.repository.js";
import { conversationNotFound } from "../errors.js";

export async function getConversations(userId) {
  return conversationRepository.getConversationsForUser(userId);
}

export async function getConversation(conversationId, userId) {
  const conversation = await conversationRepository.getConversationWithMessages(
    conversationId,
    userId,
  );
  if (!conversation) throw conversationNotFound;
  return conversation;
}

export async function sendMessage(conversationId, userId, content) {
  const conversation = await conversationRepository.findConversationForUser(
    conversationId,
    userId,
  );
  if (!conversation) throw conversationNotFound;

  const receiver =
    conversation.sender.toString() === userId
      ? conversation.receiver
      : conversation.sender;

  const message = await messageRepository.createMessage(
    content,
    receiver,
    userId,
    conversation._id,
  );
  await conversationRepository.addMessage(conversation._id, message._id, userId);

  return message;
}
