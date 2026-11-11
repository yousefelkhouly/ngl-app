import { apiRequest, type ApiEnvelope } from "./client";
import type { Conversation, SentMessage } from "./types";

// backend/src/app/conversation/conversation.route.js

// each conversation comes with only its last message, as a preview
export async function getConversations(): Promise<Conversation[]> {
  const response = await apiRequest<ApiEnvelope<Conversation[]>>("/conversation", { auth: true });
  return response.data ?? [];
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiRequest<ApiEnvelope<Conversation>>(`/conversation/${id}`, {
    auth: true,
  });
  return response.data as Conversation;
}

export async function sendConversationMessage(id: string, content: string): Promise<SentMessage> {
  const response = await apiRequest<ApiEnvelope<SentMessage>>(`/conversation/${id}/messages`, {
    method: "POST",
    body: { content },
    auth: true,
  });
  return response.data as SentMessage;
}
