import { userNotExist } from "../../user/errors.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import * as messageRepository from "../repositories/message.repository.js";

export async function sendMessage(content, receiver, sender) {
  const user = await userRepository.findUserById(receiver);
  if (!user) throw userNotExist;

  return messageRepository.createMessage(content, receiver, sender);
}

// an empty inbox is a normal answer ([]), not an error
export async function getAllMessages(userId) {
  return messageRepository.getMessagesForReceiver(userId);
}
