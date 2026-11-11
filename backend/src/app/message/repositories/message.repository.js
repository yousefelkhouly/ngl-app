import { Message } from "../models/message.model.js";

// what other users may see about a sender: not their email, files or settings
export const PUBLIC_USER_FIELDS = "name profilePicturePath";

export async function createMessage(content, receiver, sender) {
  return Message.create({ content, receiver, sender });
}

export async function getMessagesForReceiver(userId) {
  return Message.find({ receiver: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .populate({ path: "sender", select: PUBLIC_USER_FIELDS });
}
