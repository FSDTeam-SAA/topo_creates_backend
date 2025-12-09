import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },

    // FLAT or PERCENTAGE
    discountType: {
      type: String,
      enum: ["FLAT", "PERCENTAGE"],
      required: true,
    },

    discount: { type: Number, required: true }, 
    
    expiresAt: { type: Date, required: true },

    selectedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Track usage
    maxUsage: { type: Number, default: null }, 
    usedCount: { type: Number, default: 0 },

    // Active / inactive promo
    isActive: { type: Boolean, default: true },

  },
  { timestamps: true }
);

export default mongoose.model("PromoCode", promoCodeSchema);
