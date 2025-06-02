import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'published', 'rejected', 'archived', 'draft'],
            default: 'published',
        },
    },
    {
        timestamps: true
    }
);

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
