import mongoose from 'mongoose';

const { Schema } = mongoose;
// lender allocation data for both the shipping and the local pick up 

const LenderInfoSchema = new mongoose.Schema({
  lenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String },
  price: { type: Number }, // optional if you want to store the lender's offer
  distance: { type: Number }, // from API
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
coordinates: {
  type: [Number],
  required: function() {
    return this.allocationType === 'LocalPickup';
  }
}


  },
  allocatedAt: { type: Date, default: Date.now },
  allocationType: { type: String, enum: ['LocalPickup', 'Shipping'], default: 'LocalPickup' },
});



// Main Booking schema
const BookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lender: { type: Schema.Types.ObjectId, ref: 'User'},
    listing: { type: Schema.Types.ObjectId, ref: 'Listings'},
    masterdressId: { type: Schema.Types.ObjectId,ref:'MasterDress', required: true },
    dressName:{type:String},
    allocatedLender: LenderInfoSchema,
    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    rentalDurationDays: { type: Number, required: true, enum: [4, 8] },
    listingId: { type: String},
    size: {
      type: String,
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ['Shipping', 'Pickup'],
      default: 'Shipping',
    },
   
    lenderPrice:{type:Number,default:0},
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
        'CancelledByAdmin', 'Disputed', 'IssueReported','Accepted','WaitingForPayment',
        'Delivered','Rejected'
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


     

    next();
  } catch (err) {
    next(err);
  }
});

// Indexes for faster queries
BookingSchema.index({ rentalStartDate: 1, rentalEndDate: 1 });

export const Booking = mongoose.model('Booking', BookingSchema);
