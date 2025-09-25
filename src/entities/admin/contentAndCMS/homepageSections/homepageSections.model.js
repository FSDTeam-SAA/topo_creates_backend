import mongoose, { Schema } from 'mongoose';

const FileSchema = new Schema({
  filename: String,
  url: String,
}, { _id: false });


const homepageSectionSchema = new Schema(
    {
        sectionName: {
            type: String,
            required: true,
            trim: true
        },
        content: {
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
);

const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);

export default HomepageSection;
