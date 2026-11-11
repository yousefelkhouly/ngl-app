import * as requestRepository from "../repositories/request.repository.js";
import * as conversationRepository from "../../conversation/repositories/conversation.repository.js";
import { REQUEST_STATUS } from "../models/request.model.js";
import {
  notRequestReceiver,
  requestAlreadyAnswered,
  requestNotFound,
} from "../errors.js";

async function answerRequest(requestId, userId, status) {
  const updated = await requestRepository.answerPendingRequest(
    requestId,
    userId,
    status,
  );
  if (updated) return updated;

  const request = await requestRepository.findRequestById(requestId);
  if (!request) throw requestNotFound;
  if (request.receiverOfRequest.toString() !== userId) throw notRequestReceiver;
  throw requestAlreadyAnswered;
}

export async function declineRequest(requestId, userId) {
  const { _id, status } = await answerRequest(
    requestId,
    userId,
    REQUEST_STATUS.declined,
  );
  return { _id, status };
}

async function openConversation({ senderOfRequest, receiverOfRequest, messageId }) {
  let existing = await conversationRepository.findConversationBetween(
    senderOfRequest,
    receiverOfRequest,
  );

  if (!existing) {
    try {
      return await conversationRepository.createConversation({
        sender: senderOfRequest,
        receiver: receiverOfRequest,
        messages: messageId ? [{ msgId: messageId, sender: senderOfRequest }] : [],
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      existing = await conversationRepository.findConversationBetween(
        senderOfRequest,
        receiverOfRequest,
      );
    }
  }

  if (messageId) {
    await conversationRepository.addMessage(existing._id, messageId, senderOfRequest);
  }
  return existing;
}

export async function acceptRequest(requestId, userId) {
  const request = await answerRequest(requestId, userId, REQUEST_STATUS.accepted);

  try {
    const conversation = await openConversation(request);
    return { request, conversation };
  } catch (error) {
    await requestRepository.setRequestStatus(request._id, REQUEST_STATUS.pending);
    throw error;
  }
}
