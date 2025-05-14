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
    
    // --- Core Parties & Item ---

    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listings', 
      required: true,
      index: true,
    },

    // --- Rental Period & Duration ---

    rentalStartDate: {
      type: Date,
      required: [true, 'Rental start date is required'],
    },
    rentalEndDate: {
      type: Date,
      required: [true, 'Rental end date is required'],
    },
    rentalDurationDays: {
      type: Number,
      required: [true, 'Rental duration in days is required'],
      enum: [4, 8],
    },


    // --- Pricing & Fees ---

    baseRentalPrice: {
      type: Number,
      //required: [true, 'Base rental price is required'],
    },
    insuranceOptIn: {
      type: Boolean,
      default: false,
    },
    insuranceFee: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    pickupBookingFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      // Sum of baseRentalPrice + insuranceFee + shippingFee + pickupBookingFee
      type: Number,
      //required: [true, 'Total booking amount is required'],
    },
    platformCommissionRate: {
        type: Number,
        //required: true,
    },
    platformCommissionAmount: {
        type: Number,
        //required: true,
    },
    lenderEarnings: { // totalAmount - platformCommissionAmount - (potentially other platform-absorbed fees)
        type: Number,
        //required: true,
    },


    // --- Delivery & Fulfillment ---
    deliveryMethod: {
      type: String,
      //required: [true, 'Delivery method is required'],
      enum: ['Shipping', 'Pickup'],
      default: 'Shipping'
    },
    shippingAddress: {
      type: AddressSchema,
    },
    selectedPickupLocation: {
      type: AddressSchema,
    },
    outboundTrackingNumber: { type: String, trim: true },
    returnTrackingNumber: { type: String, trim: true },
    pickupConfirmedTime: { type: Date }, 


    // --- Status & Lifecycle ---

    status: {
      type: String,
      //required: true,
      enum: [
        'PendingPayment',         
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
        'CancelledByAdmin',
        'Disputed',               
        'IssueReported',         
      ],
      default: 'PendingPayment',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
        notes: String, 
      },
    ],


    // --- Payment Information ---

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
        processedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin who processed
      }
    ],


    // --- Try-On (For Local Pickup) ---

    tryOnRequested: { 
      type: Boolean,
      default: false,
    },
    tryOnAllowedByLender: { 
        type: Boolean,
        default: false,
    },
    tryOnOutcome: {
      type: String,
      enum: [
        'ProceededWithRental',       
        'DidNotProceed',             
        'BookedDifferentItemExternally', 
        'BookedDifferentItemOnPlatform', 
      ],
    },
    tryOnNotes: { type: String }, 


    // --- late fee ---

    lateFeeAmount: { type: Number, default: 0 },
    isLateFeeApplied: { type: Boolean, default: false },

    // --- Manual & External Booking Flags ---

    isManualBooking: { 
      type: Boolean,
      default: false,
    },
    manualBookingDescription: { type: String }, 

 
    // --- Communication & Issues ---

    dispute: { 
      type: Schema.Types.ObjectId,
      ref: 'Dispute', 
    },
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



// Virtual to check if the booking return is overdue
BookingSchema.virtual('isReturnOverdue').get(function () {
  const currentStatus = this.status;
  const inPossessionStatuses = ['InPossessionOfCustomer', 'ShippedToCustomer', 'PickedUpByCustomer'];

  if (inPossessionStatuses.includes(currentStatus) && this.rentalEndDate) {
    const bufferDays = 2; // Move to constants/env later if needed
    const expectedReturnDate = new Date(this.rentalEndDate);
    expectedReturnDate.setDate(expectedReturnDate.getDate() + bufferDays);
    return new Date() > expectedReturnDate;
  }

  return false;
});



// --- PRE-SAVE HOOKS ---
// Add initial status to statusHistory when booking is first created
BookingSchema.pre('save', function (next) {
  if (this.isNew && this.status) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date(),
      changedBy: this.customer || null // or set null/admin if unsure
    }];
  }
  next();
});


// --- INDEXES ---
BookingSchema.index({ rentalStartDate: 1, rentalEndDate: 1 });
BookingSchema.index({ 'shippingAddress.postalCode': 1 }); // If you search by postal code

export const Booking = mongoose.model('Booking', BookingSchema);
