import mongoose from 'mongoose';

const { Schema } = mongoose;

// Main Booking schema
const BookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listings', required: true, index: true },
    dressId: { type: String, required: true },
    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    rentalDurationDays: { type: Number, required: true, enum: [4, 8] },

    size: {
      type: String,
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ['Shipping', 'Pickup'],
      default: 'Shipping',
    },
   

    rentalFee: { type: Number},
    shippingFee: { type: Number, default: 10, immutable: true },
    insuranceFee: { type: Number, default: 0 },
    totalAmount: { type: Number},

    deliveryStatus: {
      type: String,
      enum: [
        'Pending', 'Confirmed', 'PreparingShipment', 'LabelReady',
        'ShippedToCustomer', 'PickedUpByCustomer', 'InPossessionOfCustomer',
        'ReturnInitiated', 'ShippedToLender', 'ReceivedByLender',
        'Completed', 'CancelledByCustomer', 'CancelledByLender',
        'CancelledByAdmin', 'Disputed', 'IssueReported',
      ],
      default: 'Pending',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: String,
      },
    ],

    paymentIntentId: { type: String },
    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    stripeRefundId: { type: String },
    stripeTransferId: { type: String },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid','Succeeded', 'Failed', 'Refunded', 'PartiallyRefunded'],
      default: 'Pending',
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "transferred", "failed"],
      default: "pending",
    },
    refundDetails: [
      {
        amount: Number,
        reason: String,
        stripeRefundId: String,
        processedAt: { type: Date, default: Date.now },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    tryOnRequested: { type: Boolean, default: false },
    tryOnAllowedByLender: { type: Boolean, default: false },
    tryOnOutcome: {
      type: String,
      enum: [
        'ProceededWithRental', 'DidNotProceed',
        'BookedDifferentItemExternally', 'BookedDifferentItemOnPlatform',
      ],
      default: 'ProceededWithRental',
    },
    tryOnNotes: { type: String },

    isManualBooking: { type: Boolean, default: false },
    manualBookingDescription: { type: String },

    dispute: { type: Schema.Types.ObjectId, ref: 'Dispute' },
    customerNotes: { type: String },
    lenderNotes: { type: String },
    adminNotes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  }
);

// Pre-save hook: initialize statusHistory and calculate fees
BookingSchema.pre('save', async function (next) {
  try {

       const Listing = mongoose.model("Listings");
    const listing = await Listing.findById(this.listing); // <-- move here

    if (!listing) {
      throw new Error("Listing not found");
    }
    // Initialize statusHistory for new bookings
    if (this.isNew && this.deliveryStatus) {
      this.statusHistory = [
        {
          status: this.deliveryStatus,
          timestamp: new Date(),
          updatedBy: this.customer || null,
        },
      ];
    }


     if (this.rentalDurationDays === 4) {
      this.rentalFee = listing.rentalPrice?.fourDays || 0;
    } else if (this.rentalDurationDays === 8) {
      this.rentalFee = listing.rentalPrice?.eightDays || 0;
    } else {
      this.rentalFee = 0; // fallback
    }

    // Set insuranceFee if listing requires insurance
    if (listing && listing.insurance) {
      this.insuranceFee = 5;
    } else {
      this.insuranceFee = 0;
    }

    // Calculate totalAmount = rental + shipping + insurance
    this.totalAmount = this.rentalFee + this.shippingFee + this.insuranceFee;

    next();
  } catch (err) {
    next(err);
  }
});

// Indexes for faster queries
BookingSchema.index({ rentalStartDate: 1, rentalEndDate: 1 });

export const Booking = mongoose.model('Booking', BookingSchema);
