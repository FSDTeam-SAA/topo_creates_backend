import mongoose, { model, Schema} from "mongoose";


const payoutSchema = new Schema(
  {
    lenderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    bookingAmount: {
      type: Number,
      required: true,
    },
    lenderPrice:{
      type:Number,
      

    },
    adminsProfit:{
      type: Number,
      required: true,

    },

    requestedAmount: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

payoutSchema.index({ lenderId: 1, status: 1 });
payoutSchema.index({ lenderId: 1, createdAt: -1 });

export default mongoose.model('Payout', payoutSchema);

