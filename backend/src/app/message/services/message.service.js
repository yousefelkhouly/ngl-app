import { userNotExist } from "../../user/errors.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import * as messageRepository from "../repositories/message.repository.js";
import * as requestRepository from "../../request/repositories/request.repository.js";
import { REQUEST_STATUS } from "../../request/models/request.model.js";
import { cannotMessageYourself } from "../errors.js";

export async function sendMessage(content, receiver, sender) {
  if (sender && sender === receiver) throw cannotMessageYourself;

  const user = await userRepository.findUserById(receiver);
  if (!user) throw userNotExist;

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
