import { Conversation } from "../models/conversation.model.js";

// the conversation between two users, whichever of them is the sender
export async function findConversationBetween(userA, userB) {
  return Conversation.findOne({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  });
}

export async function createConversation(data) {
  return Conversation.create(data);
}
