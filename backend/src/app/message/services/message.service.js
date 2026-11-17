import { userNotExist } from "../../user/errors.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import * as messageRepository from "../repositories/message.repository.js";
import * as requestRepository from "../../request/repositories/request.repository.js";
import { REQUEST_STATUS } from "../../request/models/request.model.js";
import { Report } from "../models/report.model.js";
import {
  alreadyReported,
  blockedFromMessaging,
  cannotMessageYourself,
  messageNotFound,
  noSenderToBlock,
} from "../errors.js";

export async function sendMessage(content, receiver, sender) {
  if (sender && sender === receiver) throw cannotMessageYourself;

  const user = await userRepository.findUserById(receiver);
  if (!user) throw userNotExist;
  // a note sent without an account can't be traced to anyone, so it can't be blocked
  if (sender && user.blockedUsers.some((id) => id.toString() === sender)) {
    throw blockedFromMessaging;
  }

  const message = await messageRepository.createMessage(content, receiver, sender);
  if (!sender) return message;

  try {
    await requestRepository.createRequest({
      messageId: message._id,
      senderOfRequest: sender,
      receiverOfRequest: receiver,
    });
  } catch (error) {
    await messageRepository.deleteMessageById(message._id);
    throw error;
  }
  return message;
}

export async function getAllMessages(userId) {
  const [messages, requests] = await Promise.all([
    messageRepository.getMessagesForReceiver(userId),
    requestRepository.findRequestsForReceiver(userId),
  ]);
  const requestOf = new Map(
    requests
      .filter((request) => request.messageId)
      .map((request) => [request.messageId.toString(), request]),
  );

  return messages.map((message) => {
    const { sender, ...rest } = message.toJSON();
    const request = requestOf.get(message._id.toString());
    const accepted = request?.status === REQUEST_STATUS.accepted;
    return {
      ...rest,
      sender: accepted ? sender : null,
      request: request ? { _id: request._id, status: request.status } : null,
    };
  });
}

async function inboxMessage(messageId, userId) {
  const message = await messageRepository.findInboxMessage(messageId, userId);
  if (!message) throw messageNotFound;
  return message;
}

// removes a note from the receiver's inbox. a chat it already started stays
export async function deleteMessage(messageId, userId) {
  const message = await inboxMessage(messageId, userId);
  await messageRepository.hideInboxMessage(message._id);
  await requestRepository.declinePendingForMessage(message._id);
  return { _id: message._id };
}

// blocks whoever sent the note, without telling the receiver who that is,
// and clears every note they left
export async function blockSender(messageId, userId) {
  const message = await inboxMessage(messageId, userId);
  if (!message.sender) throw noSenderToBlock;

  await userRepository.blockUser(userId, message.sender);
  await Promise.all([
    messageRepository.hideInboxMessagesFrom(message.sender, userId),
    requestRepository.declinePendingFrom(message.sender, userId),
  ]);
  return { _id: message._id };
}

// keeps a copy for review and takes the note out of the inbox
export async function reportMessage(messageId, userId, reason) {
  const message = await inboxMessage(messageId, userId);
  try {
    await Report.create({
      reporter: userId,
      message: message._id,
      sender: message.sender ?? null,
      content: message.content,
      reason,
    });
  } catch (error) {
    if (error.code === 11000) throw alreadyReported;
    throw error;
  }
  await messageRepository.hideInboxMessage(message._id);
  await requestRepository.declinePendingForMessage(message._id);
  return { _id: message._id };
}
