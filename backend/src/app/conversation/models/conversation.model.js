import { model, Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [
      {
        msgId: {
          type: Schema.Types.ObjectId,
          ref: "Message",
          required: true,
        },
        sender: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

conversationSchema.index({ sender: 1 });
conversationSchema.index({ receiver: 1 });

export const Conversation = model("Conversation", conversationSchema);
