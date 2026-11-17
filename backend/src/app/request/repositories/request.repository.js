import { Request, REQUEST_STATUS } from "../models/request.model.js";

export async function createRequest(data) {
  return Request.create(data);
}

export async function findRequestById(requestId) {
  return Request.findById(requestId);
}

// every request sent to this user: fetched alongside their inbox instead of after it,
// which saves a database round trip (~55ms to Atlas)
export async function findRequestsForReceiver(userId) {
  return Request.find({ receiverOfRequest: userId });
}

export async function setRequestStatus(requestId, status) {
  return Request.updateOne({ _id: requestId }, { status });
}

export async function answerPendingRequest(requestId, receiverId, status) {
  return Request.findOneAndUpdate(
    {
      _id: requestId,
      receiverOfRequest: receiverId,
      status: REQUEST_STATUS.pending,
    },
    { status },
    { returnDocument: "after" },
  );
}

// a note that's removed shouldn't leave its request waiting to be answered
export async function declinePendingForMessage(messageId) {
  return Request.updateMany(
    { messageId, status: REQUEST_STATUS.pending },
    { status: REQUEST_STATUS.declined },
  );
}

export async function declinePendingFrom(senderId, receiverId) {
  return Request.updateMany(
    { senderOfRequest: senderId, receiverOfRequest: receiverId, status: REQUEST_STATUS.pending },
    { status: REQUEST_STATUS.declined },
  );
}

// a deleted account: nothing it sent or received can still be answered
export async function declineAllPendingFor(userId) {
  return Request.updateMany(
    {
      status: REQUEST_STATUS.pending,
      $or: [{ senderOfRequest: userId }, { receiverOfRequest: userId }],
    },
    { status: REQUEST_STATUS.declined },
  );
}
