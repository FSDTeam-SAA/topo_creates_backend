import mongoose, { Schema } from 'mongoose';

const FileSchema = new Schema({
  filename: String,
  url: String,
}, { _id: false });


const bannerSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        image: [FileSchema],
        status: {
            type: String,
            enum: ['active', 'inactive','draft'],
            default: 'active',
        }
    },
    {
        timestamps: true
    }
)

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;

