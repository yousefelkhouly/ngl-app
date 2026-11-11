import { Message } from "../models/message.model.js";

export const PUBLIC_USER_FIELDS = "name profilePicturePath";

export async function createMessage(content, receiver, sender, conversation) {
  return Message.create({ content, receiver, sender, conversation });
}

export async function deleteMessageById(id) {
  return Message.deleteOne({ _id: id });
}

export async function getMessagesForReceiver(userId) {
  return Message.find({
    receiver: userId,
    isDeleted: false,
    conversation: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .populate({ path: "sender", select: PUBLIC_USER_FIELDS });
}
