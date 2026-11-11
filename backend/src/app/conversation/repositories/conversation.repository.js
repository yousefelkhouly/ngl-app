import { Conversation } from "../models/conversation.model.js";
import { PUBLIC_USER_FIELDS } from "../../message/repositories/message.repository.js";

const MESSAGE_FIELDS = "content createdAt";

// matches conversations the user is part of, on either side
const participant = (userId) => ({
  $or: [{ sender: userId }, { receiver: userId }],
});

const pairKeyOf = (userA, userB) => [userA, userB].map(String).sort().join(":");

// the conversation between two users, whichever of them is the sender
export async function findConversationBetween(userA, userB) {
  return Conversation.findOne({ pairKey: pairKeyOf(userA, userB) });
}

// throws a duplicate key error (11000) if the two already have a conversation
export async function createConversation(data) {
  return Conversation.create({
    ...data,
    pairKey: pairKeyOf(data.sender, data.receiver),
  });
}

export async function findConversationForUser(conversationId, userId) {
  return Conversation.findOne({ _id: conversationId, ...participant(userId) });
}

export async function getConversationsForUser(userId) {
  return Conversation.find(participant(userId), { messages: { $slice: -1 } })
    .sort({ updatedAt: -1 })
    .populate({ path: "sender receiver", select: PUBLIC_USER_FIELDS })
    .populate({ path: "messages.msgId", select: MESSAGE_FIELDS });
}

export async function getConversationWithMessages(conversationId, userId) {
  return Conversation.findOne({ _id: conversationId, ...participant(userId) })
    .populate({ path: "sender receiver", select: PUBLIC_USER_FIELDS })
    .populate({ path: "messages.msgId", select: MESSAGE_FIELDS });
}

export async function addMessage(conversationId, msgId, sender) {
  return Conversation.updateOne(
    { _id: conversationId },
    { $push: { messages: { msgId, sender } } },
  );
}
