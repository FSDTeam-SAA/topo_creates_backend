import mongoose, { Schema } from "mongoose";

const FileSchema = new Schema({
  filename: String,
  url: String,
}, { _id: false });


const contactSchema = new Schema(
  { 
    lender :{
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    evidence: [FileSchema],
  },
  {
    timestamps: true
  }
);


const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
