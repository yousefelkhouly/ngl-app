import { model, Schema } from "mongoose";

export const REPORT_REASONS = ["harassment", "hate", "threat", "spam", "other"];

// a note someone reported. there's no moderation screen yet: these are kept for whoever
// reviews them in the database. the content is copied so a report outlives the note
const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    // null for notes sent without an account
    sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
  },
  { timestamps: true },
);

// one report per person per note
reportSchema.index({ reporter: 1, message: 1 }, { unique: true });

export const Report = model("Report", reportSchema);
