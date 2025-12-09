import mongoose, { Schema } from "mongoose";

const flaggedSchema = new Schema(
  {
    status: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    flaggedAt: { type: Date },
  },
  { _id: false }
);

const chatRoomSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    
    status: {
      type: String,
      enum: ["active", "flagged", "closed"],
      default: "active",
    },

    flagged: flaggedSchema,

    closedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

chatRoomSchema.index({ bookingId: 1 }, { unique: true });

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
