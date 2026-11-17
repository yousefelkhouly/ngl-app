import { apiRequest, type ApiEnvelope } from "./client";
import type { AcceptResult, DeclineResult, InboxMessage, SentMessage } from "./types";

// backend/src/app/message/message.route.js and request/request.route.js

// revealable: sent as the logged-in user (POST /message/public), so a request comes
// with it and the receiver can unredact them. otherwise fully anonymous (POST /message)
export async function sendMessage(input: {
  content: string;
  receiver: string;
  revealable: boolean;
}): Promise<SentMessage> {
  const response = await apiRequest<ApiEnvelope<SentMessage>>(
    input.revealable ? "/message/public" : "/message",
    {
      method: "POST",
      body: { content: input.content, receiver: input.receiver },
      auth: input.revealable,
    },
  );
  return response.data as SentMessage;
}

export async function getInbox(): Promise<InboxMessage[]> {
  const response = await apiRequest<ApiEnvelope<InboxMessage[]>>("/message/public", {
    auth: true,
  });
  return response.data ?? [];
}

export async function acceptRequest(requestId: string): Promise<AcceptResult> {
  const response = await apiRequest<ApiEnvelope<AcceptResult>>(`/request/${requestId}/accept`, {
    method: "PATCH",
    auth: true,
  });
  return response.data as AcceptResult;
}

export async function declineRequest(requestId: string): Promise<DeclineResult> {
  const response = await apiRequest<ApiEnvelope<DeclineResult>>(
    `/request/${requestId}/decline`,
    { method: "PATCH", auth: true },
  );
  return response.data as DeclineResult;
}

export type ReportReason = "harassment" | "hate" | "threat" | "spam" | "other";

// these act on notes in your own inbox, and take them out of it
export function deleteNote(messageId: string) {
  return apiRequest(`/message/${messageId}`, { method: "DELETE", auth: true });
}

// blocks whoever sent it without saying who; only for notes sent with an account
export function blockNoteSender(messageId: string) {
  return apiRequest(`/message/${messageId}/block`, { method: "POST", auth: true });
}

export function reportNote(messageId: string, reason: ReportReason) {
  return apiRequest(`/message/${messageId}/report`, { method: "POST", body: { reason }, auth: true });
}
