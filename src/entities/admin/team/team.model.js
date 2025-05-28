import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  permissions: [{
    type: String,
    enum: [
      "Listings Management",
      "Payments Management",
      "Disputes Management",
      "Finance Management",
      "Content Management",
      "Admin Settings",
      "All Access"
    ],
    required: true
  }],
  status: {
    type: String,
    enum: ["Active", "Suspended"],
    default: "Active"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  lastActive: {
    type: Date
  }
}, { timestamps: true });


const Team = mongoose.model("Team", teamSchema);
export default Team;
