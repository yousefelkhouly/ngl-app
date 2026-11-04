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

// finding the conversation between two users
conversationSchema.index({ sender: 1, receiver: 1 });

export const Conversation = model("Conversation", conversationSchema);
