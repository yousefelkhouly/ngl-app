import { model, Schema } from "mongoose";

export const REQUEST_STATUS = {
  pending: "pending",
  accepted: "accepted",
  declined: "decline",
};

const requestSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    senderOfRequest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverOfRequest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.pending,
    },
  },
  { timestamps: true },
);

requestSchema.index({ receiverOfRequest: 1, status: 1 });

export const Request = model("Request", requestSchema, "requestmodels");
  