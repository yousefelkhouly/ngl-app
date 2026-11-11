import { model, Schema } from "mongoose";

export const NAME_MAX_LENGTH = 20;

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
    cvPath: String,
    twoStepVerification: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // runs whenever a user is sent with res.json, so the password hash
    // can never end up in a response, even if a query forgets to exclude it
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
