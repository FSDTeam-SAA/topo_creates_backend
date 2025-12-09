import { generateResponse } from "../../lib/responseFormate.js";
import { contactService, getAllContacts, getContactById, getContactStats, updateContact } from "./support.service.js";


// 🔹 Lender-only contact (with form-data + file upload)
export const createLenderContact = async (req, res) => {
  try {

   const file = req.files && req.files.file ? req.files.file[0] : null;

    const result = await contactService.createLenderContact(
      { ...req.body, lenderId: req.user._id },
      file
    );

    return generateResponse(
      res,
      201,
      true,
      "Lender contact request submitted successfully",
      result
    );
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Something went wrong", error.message);
  }
};

// 🔹 General contact (JSON, no file)
export const createGeneralContact = async (req, res) => {
  try {
    const result = await contactService.createGeneralContact({
      ...req.body,
      userId: req.user?._id || null, // optional if logged in
    });

    return generateResponse(
      res,
      201,
      true,
      "Contact request submitted successfully",
      result
    );
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Something went wrong", error.message);
  }
};


// ---------------------- GET ALL CONTACTS ----------------------
export const getAllContactsController = async (req, res) => {
  try {

    const { page = 1, limit = 10, search, issueType, userId, lender } = req.query;

    const filters = { page, limit, search, issueType, userId, lender };

    const result = await getAllContacts(filters);

    return generateResponse(res, 200, true, "Contacts fetched successfully", result);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Something went wrong", error.message);
  }
};

// ---------------------- GET CONTACT BY ID ----------------------
export const getContactByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await getContactById(id);

    if (!contact) return generateResponse(res, 404, false, "Contact not found");

    return generateResponse(res, 200, true, "Contact fetched successfully", contact);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Something went wrong", error.message);
  }
};

// ---------------------- UPDATE CONTACT ----------------------
export const updateContactController = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const updated = await updateContact(id, payload, req.user);

    if (!updated) return generateResponse(res, 404, false, "Contact not found");

    return generateResponse(res, 200, true, "Contact updated successfully", updated);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Something went wrong", error.message);
  }
};


// 🔹 GET CONTACT STATS (Admin only)
export const getContactsStats = async (req, res) => {
  try {
    const result = await getContactStats();

    return generateResponse(res, 200, true, "Contact stats fetched successfully", result);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Something went wrong", error.message);
  }
};
