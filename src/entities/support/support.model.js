import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, ref: "User" },
    lender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Common fields
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    message: { type: String, required: true },

    // Lender-specific fields
    subject: { type: String, trim: true },
    issueType: {
      type: String,
      enum: ["technical", "payment", "delivery", "other","booking"],
    },
    file: { type: String },

    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    responses: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      },
    ],
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
