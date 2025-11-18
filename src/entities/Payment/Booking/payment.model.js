import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['booking', 'subscription'], 
      required: true
    },
    subscription: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
     
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      
    },
    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
     
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listings',
      
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    stripe: {
      paymentIntentId: String,
      checkoutSessionId: String,
      idempotencyKey: String
    },
    refundDetails: [
      {
        refundId: String,
        amount: Number,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// export default mongoose.model('Payment', PaymentSchema);


// export default Payment = mongoose.model('Payment', PaymentSchema);


const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;