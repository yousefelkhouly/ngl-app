import { Request, REQUEST_STATUS } from "../models/request.model.js";

export async function findRequestById(requestId) {
  return Request.findById(requestId);
}

// only updates when the user is the receiver and the request is still pending,
// in one atomic step, so two accepts at the same time can't both succeed
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
