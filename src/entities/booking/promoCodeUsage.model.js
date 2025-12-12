import mongoose from "mongoose";


const promoCodeUsageSchema = new mongoose.Schema(
  {
    promoCodeId: { type: mongoose.Schema.Types.ObjectId, ref: "PromoCode", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    discountApplied: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('PromoCodeUsage',promoCodeUsageSchema)