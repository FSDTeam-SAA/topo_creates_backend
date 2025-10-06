import mongoose, { Schema } from "mongoose";

const chatRoomSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

chatRoomSchema.index({ bookingId: 1 }, { unique: true });

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
