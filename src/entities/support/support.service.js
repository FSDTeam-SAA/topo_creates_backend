

import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";
import { Contact } from "./support.model.js";


// 🔹 Lender Contact (with file support)
const createLenderContact = async (payload, file) => {
  let fileUrl;
  if (file) {
    const uploaded = await cloudinaryUpload(
      file.path,
      `contact_${Date.now()}`,
      "contacts"
    );
    fileUrl = uploaded.secure_url;
  }

  const data = {
    lender: payload.lenderId,
    subject: payload.subject,
    issueType: payload.issueType,
    message: payload.message,
    file: fileUrl,
  };

  return await Contact.create(data);
};

// 🔹 General Contact (no file)
const createGeneralContact = async (payload) => {
  const data = {
    user: payload.userId, // optional if logged in
    name: payload.name,
    email: payload.email,
    message: payload.message,
  };

  return await Contact.create(data);
};

export const contactService = {
  createLenderContact,
  createGeneralContact,
};


// ---------------------- GET ALL CONTACTS WITH FILTER & PAGINATION ----------------------
export const getAllContacts = async ({ page = 1, limit = 10, search, issueType, userId, lender }) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },  
      { priority: { $regex: search, $options: "i" } }, 
    ];
  }

  if (issueType) query.issueType = issueType;
  if (userId) query.user = userId;
  if (lender) query.lender = lender;

  const skip = (page - 1) * limit;
  const total = await Contact.countDocuments(query);
  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "email")
    .populate("lender", "email");

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    contacts,
  };
};

// ---------------------- GET CONTACT BY ID ----------------------
export const getContactById = async (id) => {
  return await Contact.findById(id)
    .populate("user", "name email")
    .populate("lender", "name email");
};

// ---------------------- UPDATE CONTACT ----------------------
export const updateContact = async (id, payload, user) => {
  const contact = await Contact.findById(id);
  if (!contact) return null;

  // Admin can update: status, priority, responses
  if (user.role === "ADMIN") {
    if (payload.status) contact.status = payload.status;
    if (payload.priority) contact.priority = payload.priority;

    // Adding a response
    if (payload.responseText) {
      contact.responses.push({
        text: payload.responseText,
        admin: user._id,
      });
    }
  }

  // Optional: Lender can update message only on their own contact
  if (user.role === "LENDER" && contact.lender?.toString() === user._id.toString()) {
    if (payload.message) contact.message = payload.message;
  }

  return await contact.save();
};




// ---------------------- CONTACT STATS ----------------------
export const getContactStats = async () => {
  // Count all contacts
  const total = await Contact.countDocuments();

  // Count by issue type
  const issueCounts = await Contact.aggregate([
    {
      $group: {
        _id: "$issueType",
        count: { $sum: 1 },
      },
    },
  ]);

  // Transform aggregation result to object { issueType: count }
  const issueTypeStats = issueCounts.reduce((acc, curr) => {
    acc[curr._id || "unknown"] = curr.count;
    return acc;
  }, {});

  // Count by status
  const openCount = await Contact.countDocuments({
    status: { $in: ["pending", "in-progress"] },
  });
  const resolvedCount = await Contact.countDocuments({ status: "resolved" });

  return {
    total,
    issueTypeStats,
    open: openCount,
    resolved: resolvedCount,
  };
};
