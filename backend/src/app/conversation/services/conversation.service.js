import * as conversationRepository from "../repositories/conversation.repository.js";
import * as messageRepository from "../../message/repositories/message.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import { blockedFromMessaging } from "../../message/errors.js";
import { userNotExist } from "../../user/errors.js";
import { accountDeleted, conversationNotFound } from "../errors.js";

const otherIdOf = (conversation, userId) => {
  const sender = (conversation.sender._id ?? conversation.sender).toString();
  const receiver = (conversation.receiver._id ?? conversation.receiver).toString();
  return sender === userId ? receiver : sender;
};

// ids of the people this user blocked, as strings
async function blockedBy(userId) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw userNotExist;
  return new Set(user.blockedUsers.map(String));
}

// chats with people you blocked are hidden from you
export async function getConversations(userId) {
  const [conversations, blocked] = await Promise.all([
    conversationRepository.getConversationsForUser(userId),
    blockedBy(userId),
  ]);
  return conversations.filter((conversation) => !blocked.has(otherIdOf(conversation, userId)));
}

export async function getConversation(conversationId, userId) {
  const [conversation, blocked] = await Promise.all([
    conversationRepository.getConversationWithMessages(conversationId, userId),
    blockedBy(userId),
  ]);
  if (!conversation || blocked.has(otherIdOf(conversation, userId))) throw conversationNotFound;
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

  if (!(await userRepository.findUserById(receiver))) throw accountDeleted;
  if (await userRepository.isBlockedBetween(userId, receiver)) throw blockedFromMessaging;

  const message = await messageRepository.createMessage(
    content,
    receiver,
    userId,
    conversation._id,
  );
  await conversationRepository.addMessage(conversation._id, message._id, userId);

  return message;
}

// the other person can't message you any more, and the chat leaves your list
export async function blockParticipant(conversationId, userId) {
  const conversation = await conversationRepository.findConversationForUser(
    conversationId,
    userId,
  );
  if (!conversation) throw conversationNotFound;

  await userRepository.blockUser(userId, otherIdOf(conversation, userId));
  return { _id: conversation._id };
}
