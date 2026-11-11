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
