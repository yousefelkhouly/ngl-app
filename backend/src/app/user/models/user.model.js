import { model, Schema } from "mongoose";

export const NAME_MAX_LENGTH = 20;
export const MAX_DOCUMENTS = 10;
export const DOCUMENT_NAME_MAX_LENGTH = 120;

const documentSchema = new Schema(
  {
    // the name the user's file had, only for showing and downloading:
    // the saved file is always named by the server
    name: { type: String, required: true, maxLength: DOCUMENT_NAME_MAX_LENGTH },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false } },
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: NAME_MAX_LENGTH,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    dob: Date,
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },
    profilePicturePath: String,
    coverImagesPath: [String],
    // personal information: files the user keeps on their profile
    documents: {
      type: [documentSchema],
      default: [],
    },
    twoStepVerification: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const User = model("User", userSchema);
