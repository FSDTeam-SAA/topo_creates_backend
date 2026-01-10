import mongoose from "mongoose";
const { Schema } = mongoose;

const MasterDressSchema = new Schema(
  {
    masterDressId: { type: String,immutable: true, unique: true },
    dressName: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, trim: true, unique: true },

    listingIds: [{ type: String, required: true }], 
    lenderIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],

    sizes: [{ type: String }],
    colors: [{ type: String }],
    occasions: [{ type: String }],

    content: {
      description: { type: String },
      fabric: { type: String },
      careInstructions: { type: String },
    },

    media: [{ type: String, required: true }], 

    thumbnail: { type: String }, 

    shippingDetails: {
      isLocalPickup: { type: Boolean, default: false },
      isShippingAvailable: { type: Boolean, default: true },
       
    },
    insuranceFee: { type: Number },

    basePrice: { type: Number }, 
    rrpPrice:{type:Number},
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug and masterDressId before saving
MasterDressSchema.pre("save", async function (next) {
  // Generate slug if missing
  if (!this.slug) {
    this.slug = this.dressName.toLowerCase().replace(/\s+/g, "-");
  }

  // Generate masterDressId if missing
  if (!this.masterDressId) {
    const last = await mongoose.model("MasterDress").findOne().sort({ createdAt: -1 });
    let newId = "Muse-0001";
    if (last?.masterDressId) {
      const lastNum = parseInt(last.masterDressId.split("-")[1]);
      newId = `Muse-${String(lastNum + 1).padStart(4, "0")}`;
    }
    this.masterDressId = newId;
  }

  // If no thumbnail, use first media URL
  if (!this.thumbnail && this.media && this.media.length > 0) {
    this.thumbnail = this.media[0];
  }

  next();
});
MasterDressSchema.index({ dressName: 'text', slug: 'text' });

const MasterDress = mongoose.model("MasterDress", MasterDressSchema);
export default MasterDress;
