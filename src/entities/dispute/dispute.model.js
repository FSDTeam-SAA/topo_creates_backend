import mongoose from 'mongoose';
const { Schema } = mongoose;


const FileSchema = new Schema({
  filename: String,
  url: String,
}, { _id: false });


const TimelineEntrySchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['USER', 'LENDER', 'ADMIN'], required: true },
  timestamp: { type: Date, default: Date.now },
  message: { type: String, required: true },
  attachments: [FileSchema],
  
  type: {
    type: String,
    enum: ['submission', 'response', 'update', 'resolution', 'escalation'],
    required: true
  }
}, { _id: false });


const DisputeSchema = new Schema({
  
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Core Dispute Info

  issueType: {
    type: String,
    enum: [
      "Item hasn't arrived", "Item is damaged or incorrect",
      "Return issues", "Late Return", "Wrong Item", 
      "Not Returned", "Damaged Dress",
      "Stained/Damaged", "Others"
    ],
    required: true
  },
  description: { type: String, required: true },
  evidence: [FileSchema],

  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Escalated', 'Resolved', 'Closed', 'In Progress'],
    default: 'Pending',
    index: true
  },

  timeline: [TimelineEntrySchema],

  lastActionBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastActionAt: { type: Date },

  // Escalation Info 
  isEscalated: { type: Boolean, default: false },
  escalationReason: { type: String },
  escalationDescription: { type: String },
  escalationPriority: { type: String, enum: ['Low', 'Medium', 'High'] },
  escalationEvidence: [FileSchema],
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


DisputeSchema.index({ booking: 1 });
DisputeSchema.index({ createdAt: -1 });
DisputeSchema.index({ status: 1 });
DisputeSchema.index({ isEscalated: 1 });

export const Dispute = mongoose.model('Dispute', DisputeSchema);
