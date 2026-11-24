import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    to: { type: String, required: true },
    subject: String,
    html: String,
    text: String,
    status: {
      type: String,
      enum: ["pending", "sending", "sent"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    nextAttempt: { type: Date, default: Date.now },
    lockedAt: Date,
    sentAt: Date,
  },
  { timestamps: true },
);
export default mongoose.model("EmailJob", schema);
