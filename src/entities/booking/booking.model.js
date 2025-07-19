import mongoose from 'mongoose';

const { Schema } = mongoose;

const AddressSchema = new Schema({
  addressLine: { type: String, required: true, trim: true },
  suburb: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, default: 'Australia', trim: true },
  contactName: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
});

const BookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listings', required: true, index: true },

    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    rentalDurationDays: { type: Number, required: true, enum: [4, 8] },

    baseRentalPrice: { type: Number, min: 0, default: 0 },
    insuranceOptIn: { type: Boolean, default: false },
    insuranceFee: { type: Number, min: 0, default: 0 },
    shippingFee: { type: Number, min: 0, default: 0 },
    pickupBookingFee: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, min: 0 },

    platformCommissionRate: { type: Number, min: 0, max: 1 },
    platformCommissionAmount: { type: Number, min: 0 },
    lenderEarnings: { type: Number, min: 0 },

    deliveryMethod: {
      type: String,
      enum: ['Shipping', 'Pickup'],
      default: 'Shipping',
    },
    shippingAddress: { type: AddressSchema },
    selectedPickupLocation: { type: AddressSchema },
    outboundTrackingNumber: { type: String, trim: true },
    returnTrackingNumber: { type: String, trim: true },
    pickupConfirmedTime: { type: Date },

    status: {
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
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Succeeded', 'Failed', 'Refunded', 'PartiallyRefunded'],
      default: 'Pending',
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
    },
    tryOnNotes: { type: String },

    lateFeeAmount: { type: Number, min: 0, default: 0 },
    isLateFeeApplied: { type: Boolean, default: false },

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


BookingSchema.virtual('isReturnOverdue').get(function () {
  const inPossessionStatuses = ['InPossessionOfCustomer', 'ShippedToCustomer', 'PickedUpByCustomer'];
  if (inPossessionStatuses.includes(this.status) && this.rentalEndDate) {
    const bufferDays = 2;
    const expectedReturnDate = new Date(this.rentalEndDate);
    expectedReturnDate.setDate(expectedReturnDate.getDate() + bufferDays);
    return new Date() > expectedReturnDate;
  }
  return false;
});


BookingSchema.pre('save', function (next) {
  if (this.isNew && this.status) {
    this.statusHistory = [
      {
        status: this.status,
        timestamp: new Date(),
        updatedBy: this.customer || null,
      },
    ];
  }
  next();
});

BookingSchema.index({ rentalStartDate: 1, rentalEndDate: 1 });
BookingSchema.index({ 'shippingAddress.postalCode': 1 });

export const Booking = mongoose.model('Booking', BookingSchema);
