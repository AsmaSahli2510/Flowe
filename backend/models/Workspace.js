import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    description: { type: String, maxlength: 500, default: "" },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "member", "reader"],
          default: "member",
        },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);
schema.index({ "members.user": 1 });
export default mongoose.model("Workspace", schema);
