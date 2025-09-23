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
            enum: ['active', 'inactive','draft'],
            default: 'active',
        }
    },
    {
        timestamps: true
    }
);

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
