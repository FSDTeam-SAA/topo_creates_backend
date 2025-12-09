import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true }, 
    type: {
      type: String,
      enum: ["image", "video", "file"],
      required: true,
    },
    fileName: { type: String }, 
    size: { type: Number }, 
    mimeType: { type: String }, 
  },
  { _id: false } 
);

const messageSchema = new Schema(
  {
    chatRoom: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String }, 
    attachments: [attachmentSchema], 
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);


messageSchema.index({ chatRoom: 1, createdAt: -1 }); 
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ chatRoom: 1, readBy: 1 });

export const Message = mongoose.model("Message", messageSchema);

