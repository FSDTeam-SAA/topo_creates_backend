import Contact from "./contact.model.js";


export const createContactMessage = async (lenderId, contactData) => {
  const contact = new Contact({
    lender: lenderId,
    ...contactData,
  });

  return await contact.save();
};


export const getAllContactMessages = async () => {
  return await Contact.find()
    .populate("lender", "fullName email")
    .sort({ createdAt: -1 });
};
