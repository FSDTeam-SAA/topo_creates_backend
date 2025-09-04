import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    commission:{
      type:Number,
     required:true 

    },
    durationDays:{
      type:Number,
      
    },
    
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'AUD',
    },
    billingCycle: {
      type: String,
      default: 'monthly',
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [
      {
        type: String,
      },
    ],
   
   
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
