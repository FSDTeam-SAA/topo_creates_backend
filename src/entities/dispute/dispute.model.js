import mongoose from 'mongoose';
const { Schema } = mongoose;

// File Upload Schema 
const FileSchema = new Schema({
  filename: String,
  url: String,
}, { _id: false });

// Timeline Log Schema
const TimelineEntrySchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['USER', 'LENDER', 'ADMIN'], required: true },
  timestamp: { type: Date, default: Date.now },
  message: { type: String, required: true },
  attachments: [FileSchema],
}, { _id: false });


const DisputeSchema = new Schema({
  
  // Ownership & Identity
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Core Dispute Info

  issueType: {
    type: String,
    enum: [
      "Item hasn't arrived", "Item is damaged or incorrect",
      "Return issues", "Late Return", "Wrong Item",
      "Stained/Damaged", "Others"
    ],
    required: true
  },
  description: { type: String, required: true },
  evidence: [FileSchema],

  // Status
  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Escalated', 'Resolved', 'Closed'],
    default: 'Pending',
    index: true
  },

  // Timeline of communications/updates
  timeline: [TimelineEntrySchema],

  // Escalation Info (if applicable)
  isEscalated: { type: Boolean, default: false },
  escalationReason: { type: String },
  escalationDescription: { type: String },
  escalationPriority: { type: String, enum: ['Standard', 'High'] },
  escalationEvidence: [FileSchema],
  escalationContact: { type: String },
  escalationConfirmed: { type: Boolean, default: false },
  escalationScheduleCall: { type: Boolean, default: false },
  escalatedAt: { type: Date },

  // Admin Resolution Info
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
  resolutionNote: { type: String },
  policyFlags: [String], 

  // Refund/Compensation Info
  refundTo: { type: String, enum: ['USER', 'LENDER'] },
  refundAmount: { type: Number },
  refundProcessed: { type: Boolean, default: false },
  refundDate: { type: Date },

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  }
});

// Indexes for better query performance
DisputeSchema.index({ booking: 1 });
DisputeSchema.index({ createdAt: -1 });
DisputeSchema.index({ status: 1 });
DisputeSchema.index({ isEscalated: 1 });

export const Dispute = mongoose.model('Dispute', DisputeSchema);
