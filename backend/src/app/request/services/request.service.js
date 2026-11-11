import * as requestRepository from "../repositories/request.repository.js";
import * as conversationRepository from "../../conversation/repositories/conversation.repository.js";
import { REQUEST_STATUS } from "../models/request.model.js";
import {
  notRequestReceiver,
  requestAlreadyAnswered,
  requestNotFound,
} from "../errors.js";

// sets the status if the user is the receiver and the request is pending,
// otherwise throws the error that explains why not
async function answerRequest(requestId, userId, status) {
  const updated = await requestRepository.answerPendingRequest(
    requestId,
    userId,
    status,
  );
  if (updated) return updated;

  // the update matched nothing, find out which check failed
  const request = await requestRepository.findRequestById(requestId);
  if (!request) throw requestNotFound;
  if (request.receiverOfRequest.toString() !== userId) throw notRequestReceiver;
  throw requestAlreadyAnswered;
}

export async function declineRequest(requestId, userId) {
  return answerRequest(requestId, userId, REQUEST_STATUS.declined);
}

export async function acceptRequest(requestId, userId) {
  const request = await answerRequest(requestId, userId, REQUEST_STATUS.accepted);

  const { senderOfRequest, receiverOfRequest, messageId } = request;

  // don't make a second conversation if these two already have one
  const existing = await conversationRepository.findConversationBetween(
    senderOfRequest,
    receiverOfRequest,
  );
  if (existing) return { request, conversation: existing };

  const conversation = await conversationRepository.createConversation({
    sender: senderOfRequest,
    receiver: receiverOfRequest,
    // the message the request came from starts the conversation
    messages: messageId ? [{ msgId: messageId, sender: senderOfRequest }] : [],
  });

  return { request, conversation };
}
