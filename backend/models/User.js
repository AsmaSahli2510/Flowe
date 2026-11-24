import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    passwordHash: { type: String, select: false },
    identities: [
      {
        provider: { type: String, enum: ["google", "outlook"] },
        subject: String,
        _id: false,
      },
    ],
    welcomeSentAt: Date,
    resetHash: { type: String, select: false },
    resetExpires: Date,
  },
  { timestamps: true },
);
schema.index({ "identities.provider": 1, "identities.subject": 1 });
export default mongoose.model("User", schema);
