import mongoose from 'mongoose';

const { Schema } = mongoose;

const AddressSchema = new Schema({
  addressLine: { type: String, required: true, trim: true },
  suburb: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
  },
});

const RentalPriceSchema = new Schema({
  fourDays: {
    type: Number,
    required: [true, '4-day rental price is required'],
    min: [0, 'Price must be positive'],
  },
  eightDays: {
    type: Number,
    required: [true, '8-day rental price is required'],
    min: [0, 'Price must be positive'],
  },
});

const ListingSchema = new Schema(
  {
    lender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dressName: {
      type: String,
      required: [true, 'Dress name is required'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
    },
    colour: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: [
        'Brand New',
        'Like New',
        'Gently Used',
        'Used',
        'Worn',
        'Damaged',
        'Altered',
        'Vintage',
      ],
      required: [true, 'Dress condition is required'],
    },
    category: {
      type: String,
      enum: ['Formal', 'Casual', 'Cocktail', 'Bridal', 'Party', 'Workwear', 'Other'],
      required: [true, 'Category is required'],
    },
    locations: {
      type: [AddressSchema],
      validate: [(val) => val.length > 0, 'At least one location is required'],
    },
    media: {
      type: [String], // URLs to Cloudinary or similar
      validate: [(val) => val.length > 0, 'At least one media item is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    rentalPrice: {
      type: RentalPriceSchema,
      required: true,
    },
    material: {
      type: String,
      trim: true,
    },
    careInstructions: {
      type: String,
      enum: ['Dry Clean Only', 'Hand Wash', 'Machine Wash', 'Delicate Wash', 'Other'],
    },
    occasion: {
      type: [String], // can be multiple (e.g., ["Wedding", "Prom"])
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'inactive'],
      default: 'pending',
    },
    insurance: {
      type: Boolean,
      default: false,
    },
    pickupOption: {
      type: String,
      enum: ['Local', 'Australia-wide', 'Both'],
      required: [true, 'Pickup option is required'],
    },
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


const Listing =  mongoose.model('Listings', ListingSchema);
export default Listing
