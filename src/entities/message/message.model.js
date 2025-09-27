import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    chatRoom: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }], 
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
