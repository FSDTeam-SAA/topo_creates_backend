import mongoose from "mongoose";


const ImageSchema = new mongoose.Schema({
  filename: String,
  url: String,
  index: Number,
  _id:false // track the image index
});

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // constant section name
  images: [ImageSchema], // editable images
}, { timestamps: true });

const Section = mongoose.model('Section', SectionSchema);

export default Section;

