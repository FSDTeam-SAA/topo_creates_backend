import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";
import { generateResponse } from "../../../lib/responseFormate.js";
import * as contactService from "./contact.service.js";


export const submitContactMessage = async (req, res, next) => {
  try {
    const lenderId = req.user?._id;

    const { subject, message } = req.body;

    if (!subject || !message) {
      return generateResponse(res, 400, false, "Subject and message are required");
    }

    let evidence = [];

    if (req.files && req.files.filename) {
      const file = req.files.filename[0];

      const uploadResult = await cloudinaryUpload(
        file.path,
        `contact_${Date.now()}`,
        "contact/evidence"
      );

      if (uploadResult?.secure_url) {
        evidence.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const contactData = {
      subject,
      message,
      evidence,
    };

    const newMessage = await contactService.createContactMessage(lenderId, contactData);
    return generateResponse(res, 201, true, "Message submitted successfully", newMessage);
  } catch (error) {
    console.error("Error submitting contact message:", error);
    next(error);
  }
};


export const getAllMessages = async (req, res, next) => {
  try {
    const messages = await contactService.getAllContactMessages();
    return generateResponse(res, 200, true, "Messages fetched successfully", messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    next(error);
  }
};
