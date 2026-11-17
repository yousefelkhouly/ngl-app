import { Message } from "../models/message.model.js";

export const PUBLIC_USER_FIELDS = "name profilePicturePath";

export async function createMessage(content, receiver, sender, conversation) {
  return Message.create({ content, receiver, sender, conversation });
}

export async function deleteMessageById(id) {
  return Message.deleteOne({ _id: id });
}

// a note in this user's inbox (not a chat message), or null
export async function findInboxMessage(messageId, receiverId) {
  return Message.findOne({
    _id: messageId,
    receiver: receiverId,
    isDeleted: false,
    conversation: { $exists: false },
  });
}

export async function hideInboxMessage(messageId) {
  return Message.updateOne({ _id: messageId }, { isDeleted: true });
}

// every note this sender left in this receiver's inbox
export async function hideInboxMessagesFrom(senderId, receiverId) {
  return Message.updateMany(
    { sender: senderId, receiver: receiverId, conversation: { $exists: false } },
    { isDeleted: true },
  );
}

// a deleted account's inbox
export async function hideAllForReceiver(receiverId) {
  return Message.updateMany({ receiver: receiverId, conversation: { $exists: false } }, { isDeleted: true });
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
