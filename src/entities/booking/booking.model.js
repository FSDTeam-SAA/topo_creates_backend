import mongoose from 'mongoose';

const { Schema } = mongoose;
// lender allocation data for both the shipping and the local pick up

const LenderInfoSchema = new mongoose.Schema({
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
      required: function () {
        return this.allocationType === 'LocalPickup';
      }
    }
  },
  allocatedAt: { type: Date, default: Date.now },
  allocationType: {
    type: String,
    enum: ['LocalPickup', 'Shipping'],
    default: 'LocalPickup'
  }
});

// Main Booking schema
const BookingSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    lender: { type: Schema.Types.ObjectId, ref: 'User' },
    listing: { type: Schema.Types.ObjectId, ref: 'Listings' },
    masterdressId: {
      type: Schema.Types.ObjectId,
      ref: 'MasterDress',
      required: true
    },
    dressName: { type: String },
    allocatedLender: LenderInfoSchema,
    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    rentalDurationDays: { type: Number, required: true, enum: [4, 8] },
    listingId: { type: String },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postcode: { type: String, default: '' },
    suburb: { type: String, default: '' },
    address: { type: String, default: '' },
    size: {
      type: String,
      required: true
    },
    deliveryMethod: {
      type: String,
      enum: ['Shipping', 'Pickup', 'Manual booking'],
      default: 'Shipping'
    },

    lenderPrice: { type: Number, default: 0 },
    rentalFee: { type: Number },
    shippingFee: { type: Number, default: 10, immutable: true },
    insuranceFee: { type: Number, default: 0 },
    totalAmount: { type: Number },

    deliveryStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'PreparingShipment',
        'LabelReady',
        'ShippedToCustomer',
        'PickedUpByCustomer',
        'InPossessionOfCustomer',
        'ReturnInitiated',
        'ShippedToLender',
        'ReceivedByLender',
        'Completed',
        'CancelledByCustomer',
        'CancelledByLender',
        'Return Due',
        'Dress Returned',
        'CancelledByAdmin',
        'Disputed',
        'IssueReported',
        'Accepted',
        'WaitingForPayment',
        'Delivered',
        'Rejected',
        'RejectedByLender',
        'PaymentRetryScheduled',
        'AcceptedByLender'
      ],
      default: 'Pending',
      index: true
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: String
      }
    ],
    paymentErrorMessage: { type: String },
    paymentIntent: { type: String },
    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    stripeRefundId: { type: String },
    stripeTransferId: { type: String },
    paymentStatus: {
      type: String,
      enum: [
        'Pending',
        'RetryPending',
        'RefundPending',
        'Paid',
        'Succeeded',
        'Failed',
        'Refunded',
        'PartiallyRefunded',
        'NotCharged'
      ],
      default: 'Pending'
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'transferred', 'failed'],
      default: 'pending'
    },
    refundDetails: [
      {
        refundType: String,
        amount: Number,
        reason: String,
        stripeRefundId: String,
        processedAt: { type: Date, default: Date.now },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: String
      }
    ],

    tryOnRequested: { type: Boolean, default: false },
    tryOnAllowedByLender: { type: Boolean, default: false },
    tryOnOutcome: {
      type: String,
      enum: [
        'ProceededWithRental',
        'DidNotProceed',
        'BookedDifferentItemExternally',
        'BookedDifferentItemOnPlatform'
      ],
      default: 'ProceededWithRental'
    },
    tryOnNotes: { type: String },

    isManualBooking: { type: Boolean, default: false },
    manualBookingDescription: { type: String },

    dispute: { type: Schema.Types.ObjectId, ref: 'Dispute' },
    customerNotes: { type: String },
    lenderNotes: { type: String },
    adminNotes: { type: String }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
    }
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
          updatedBy: this.customer || null
        }
      ];
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Post-save hook: Send emails on status changes
BookingSchema.post('save', async function (doc, next) {
  try {
    const { sendEmail } = await import('../../../lib/resendEmial.js');
    const {
      shipmentPreparingTemplate,
      labelReadyTemplate,
      shippedToCustomerTemplate,
      dressDeliveredTemplate,
      returnInitiatedTemplate,
      shippedToLenderTemplate,
      bookingCompletedTemplate
    } = await import('../../../lib/emailTemplates/booking.templates.js');
    const User = mongoose.model('User');
    const MasterDress = mongoose.model('MasterDress');

    // Get the original document to compare status
    const originalDoc = await this.constructor.findById(this._id);
    if (!originalDoc || originalDoc.deliveryStatus === doc.deliveryStatus) {
      return next();
    }

    const customer = await User.findById(doc.customer);
    const lender = await User.findById(doc.allocatedLender?.lenderId);
    const dress = await MasterDress.findById(doc.masterdressId);
    const dressName = dress?.dressName || 'Your Dress';

    const statusMap = {
      PreparingShipment: {
        recipients: [customer],
        template: () =>
          shipmentPreparingTemplate(
            customer?.firstName || customer?.name || 'Customer',
            dressName,
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()
          ),
        subject: 'Preparing Your Shipment'
      },
      LabelReady: {
        recipients: [customer],
        template: () =>
          labelReadyTemplate(
            customer?.firstName || customer?.name || 'Customer',
            dressName,
            'Tracking info coming soon'
          ),
        subject: 'Shipping Label Ready'
      },
      ShippedToCustomer: {
        recipients: [customer],
        template: () =>
          shippedToCustomerTemplate(
            customer?.firstName || customer?.name || 'Customer',
            dressName,
            doc.stripePaymentIntentId || 'TRACKING123',
            'https://track.example.com/' +
              (doc.stripePaymentIntentId || 'TRACKING123')
          ),
        subject: 'Your Dress is On the Way!'
      },
      Delivered: {
        recipients: [customer],
        template: () =>
          dressDeliveredTemplate(
            customer?.firstName || customer?.name || 'Customer',
            dressName,
            new Date(doc.rentalEndDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          ),
        subject: 'Your Dress Has Arrived!'
      },
      ReturnInitiated: {
        recipients: [customer, lender],
        template: (recipient) =>
          returnInitiatedTemplate(
            recipient?.firstName || recipient?.name || 'User',
            dressName,
            new Date(doc.rentalEndDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          ),
        subject: 'Return Process Initiated'
      },
      ShippedToLender: {
        recipients: [lender],
        template: () =>
          shippedToLenderTemplate(
            lender?.firstName || lender?.name || 'Lender',
            dressName,
            doc.stripePaymentIntentId || 'RETURN123',
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
          ),
        subject: 'Dress Return Shipped'
      },
      Completed: {
        recipients: [customer, lender],
        template: (recipient) =>
          bookingCompletedTemplate(
            recipient?.firstName || recipient?.name || 'User',
            dressName,
            doc.rentalDurationDays.toString(),
            doc.refundDetails?.length > 0
              ? doc.refundDetails[0].amount
              : '0.00',
            'Processed'
          ),
        subject: 'Booking Completed'
      }
    };

    const statusConfig = statusMap[doc.deliveryStatus];
    if (statusConfig) {
      for (const recipient of statusConfig.recipients) {
        if (recipient?.email) {
          try {
            await sendEmail({
              to: recipient.email,
              subject: statusConfig.subject,
              html: statusConfig.template(recipient)
            });
          } catch (emailError) {
            console.error(
              `Error sending ${doc.deliveryStatus} email:`,
              emailError
            );
          }
        }
      }
    }

    next();
  } catch (err) {
    console.error('Error in booking post-save hook:', err);
    next();
  }
});

// Indexes for faster queries
BookingSchema.index({ rentalStartDate: 1, rentalEndDate: 1 });

export const Booking = mongoose.model('Booking', BookingSchema);
