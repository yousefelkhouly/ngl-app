import { model, Schema } from "mongoose";

export const CONTENT_MAX_LENGTH = 200;

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: CONTENT_MAX_LENGTH,
      trim: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // empty for anonymous messages
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// the inbox query filters by receiver and sorts by date
messageSchema.index({ receiver: 1, createdAt: -1 });

export const Message = model("Message", messageSchema);
