import RoleType from '../../lib/types.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  accessTokenExpires,
  accessTokenSecrete,
  refreshTokenExpires,
  refreshTokenSecrete
} from '../../core/config/config.js';

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, default: '' },
    dob: { type: Date, default: null },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male'
    },

    role: {
      type: String,
      default: RoleType.USER,
      enum: [RoleType.USER, RoleType.ADMIN, RoleType.LENDER, RoleType.SUPER_ADMIN, 'APPLICANT']
    },
    bio: { type: String, default: '' },

    profileImage: { type: String, default: '' },
    multiProfileImage: { type: [String], default: [] },

    file: {
      url: {
        type: String,
        default: ''
      },
      type: {
        type: String,
        default: ''
      }
    },

    otp: {
      type: String,
      default: null
    },

    otpExpires: {
      type: Date,
      default: null
    },

    refreshToken: {
      type: String,
      default: ''
    },

    isActive: {
      type: Boolean,
      default: true
    },

    subscription: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }
    },

    hasActiveSubscription: { type: Boolean, default: false },
    subscriptionExpireDate: { type: Date, default: null },
    subscriptionStartDate: { type: Date, default: null },

    // Lender-specific fields
    businessName: { type: String, trim: true },
    abnNumber: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    instagramHandle: { type: String, trim: true },
    businessWebsite: { type: String, trim: true },
    numberOfDresses: {
      type: String,
      default: 0,
      min: [0, 'Number of dresses cannot be negative']
    },
    allowTryOn: { type: Boolean, default: false },
    allowLocalPickup: { type: Boolean, default: false },
    shipAustraliaWide: { type: Boolean, default: false },
    reviewStockMethod: {
      website: { type: Boolean, default: false },
      instagram: { type: Boolean, default: false },
      keyBrands: { type: Boolean, default: false }
    },
    agreedTerms: { type: Boolean, default: false },
    agreedCurationPolicy: { type: Boolean, default: false },
    totalbookings: { type: Number, default: 0 },
    totalRatting: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },
    totalReveneue: { type: Number, default: 0 },
     totalSpent: { type: Number, default: 0 },

      
    firstBookingDiscountUsed: { type: Boolean, default: false },
    spent300DiscountUsed: { type: Boolean, default: false },
    spent600DiscountUsed: { type: Boolean, default: false },

    //Adress fro lenders from map

    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postcode: { type: String, default: '' },
    suburb: { type: String, default: '' },
    placeName: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    address: { type: String, default: '' },

    // stripe customer setup save card info
    stripeCustomerId: { type: String, default: null },
    defaultPaymentMethodId: { type: String, default: null },

   

    // onboarding lender relarted fields
    stripeAccountId: {
      type: String,
      default: null
    },

    chargesEnabled: {
      type: Boolean,
      default: false
    },

    payoutsEnabled: {
      type: Boolean,
      default: false
    },

    detailsSubmitted: {
      type: Boolean,
      default: false
    },

    stripeOnboardingCompleted: {
      type: Boolean,
      default: false
    },

    // document verification

    kycVerified: { type: Boolean, default: false },

    kycStatus: {
      type: String,
      enum: ['pending', 'requires_input', 'verified', 'failed'],
      default: 'pending'
    },

    kycLastUpdated: { type: Date },

    kycDetails: { type: Object },

    stripeVerificationSessionId: { type: String },
    stripeVerificationSessionUrl: { type: String },
    stripeVerificationSessionExpiresAt: { type: Date },

    // location fro mongo db

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    applicationSubmittedAt: { type: Date, default: null },
    applicationReviewedAt: { type: Date, default: null },

    notes: { type: String, trim: true },
    reason: { type: String, default: '' },
    deactivationReason: { type: String, default: '' },
    deactivationFeedback: { type: String, default: '' },
    deactivated: { type: Boolean, default: false },

    notificationPreferences: {
      receiveEmailAlertsForNewOrders: { type: Boolean, default: false },
      sendRemindersForReturnDeadlines: { type: Boolean, default: false }
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', function (next) {
  if (typeof this.latitude === 'number' && typeof this.longitude === 'number') {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude] // [lng, lat]
    };
  }
  next();
});

UserSchema.index({ location: '2dsphere' });

// Hashing password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const hashedPassword = await bcrypt.hash(this.password, 10);

  this.password = hashedPassword;
  next();
});

// Password comparison method (bcrypt)
UserSchema.methods.comparePassword = async function (id, plainPassword) {
  const { password: hashedPassword } =
    await User.findById(id).select('password');

  const isMatched = await bcrypt.compare(plainPassword, hashedPassword);

  return isMatched;
};

// Generate ACCESS_TOKEN
UserSchema.methods.generateAccessToken = function (payload) {
  return jwt.sign(payload, accessTokenSecrete, {
    expiresIn: accessTokenExpires
  });
};

// Generate REFRESH_TOKEN
UserSchema.methods.generateRefreshToken = function (payload) {
  return jwt.sign(payload, refreshTokenSecrete, {
    expiresIn: refreshTokenExpires
  });
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
