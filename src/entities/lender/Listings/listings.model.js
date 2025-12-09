import mongoose from 'mongoose';

const { Schema } = mongoose;



const RentalPriceSchema = new Schema({
  fourDays: {
    type: Number,
    
    min: [0, 'Price must be positive'],
  },
  eightDays: {
    type: Number,
   
    min: [0, 'Price must be positive'],
  },
  _id: false
});

const ListingSchema = new Schema(
  {
    lenderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dressId: {
      type: String,
      required: true,
      unique: true,
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
      type: [String],
      enum: [
        "XXS",
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "XXXL",
        "4XL",
        "5XL",
        "Custom"
      ],
      required: true,
      trim:true
    },
    status:{
    type:String,
    enum:['available','booked','not-available'],
    default:'available'
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
      enum: ['Formal',
    'Casual',
    'Cocktail',
    'Bridal',
    'Party',
    'Evening Gown',
    'Ball Gown',
    'Red Carpet',
    'Designer',
    'Haute Couture',
    'Luxury',
    'Other'],
      required: [true, 'Category is required'],
    },
  
    media: {
      type: [String], 
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
      type: [String],
      default: [],
    },
    
    insurance: {
      type: Boolean,
      default: false,
    },
    pickupOption: {
      type: String,
      enum: ['Local-Pickup', 'Australia-wide', 'Both'],
      required: [true, 'Pickup option is required'],
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reasonsForRejection: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: false,
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
