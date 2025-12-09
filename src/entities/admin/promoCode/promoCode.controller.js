
// =============================
// CREATE PROMO CODE

import { promoCodeTemplate } from "../../../lib/emailTemplates/promoCode.template.js";
import { sendEmail } from "../../../lib/resendEmial.js";
import User from "../../auth/auth.model.js";
import PromoCode from "./promoCode.model.js";

// =============================
export const createPromoCode = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discount,
      expiresAt,
     
      maxUsage,
    } = req.body;

    const exists = await PromoCode.findOne({ code });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Promo code already exists",
      });
    }

    const promo = await PromoCode.create({
      code,
      discountType,
      discount,
      expiresAt,
      maxUsage: maxUsage || null,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Promo code created successfully",
      data: promo,
    });
  } catch (error) {
    next(error);
  }
};

// =============================
// GET ALL PROMO CODES
// =============================
export const getAllPromoCodes = async (req, res, next) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Promo codes fetched successfully",
      data: promos,
    });
  } catch (error) {
    next(error);
  }
};

// =============================
// GET PROMO CODE BY ID
// =============================
export const getPromoCodeById = async (req, res, next) => {
  try {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo code fetched successfully",
      data: promo,
    });
  } catch (error) {
    next(error);
  }
};

// =============================
// UPDATE PROMO CODE
// =============================
export const updatePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo code updated successfully",
      data: promo,
    });
  } catch (error) {
    next(error);
  }
};

// =============================
// DELETE PROMO CODE
// =============================
export const deletePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// =============================
// SEND PROMO CODE EMAILS
// =============================

export const sendPromoCodeEmail = async (req, res, next) => {
  try {
    const { id } = req.params;               // promo code ID
    const { selectedUserIds } = req.body;    // optional array of user IDs

    // Fetch promo code
    const promo = await PromoCode.findById(id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    // Determine users to send
 let users = [];

if (selectedUserIds && selectedUserIds.length > 0) {
  // Selected users only, with role = "USER"
  users = await User.find(
    { _id: { $in: selectedUserIds }, role: "USER" },
    "email name"
  );
} else {
  // All users with role = "USER"
  users = await User.find({ role: "USER" }, "email name");
}


    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found to send promo emails",
      });
    }

    // Send emails
    const results = [];
    for (const user of users) {
      const emailHtml = promoCodeTemplate({
        name: user.name,
        code: promo.code,
        discountType: promo.discountType,
        discount: promo.discount,
        expiresAt: promo.expiresAt,
      });

      const r = await sendEmail({
        to: user.email,
        subject: `Your Promo Code: ${promo.code}`,
        html: emailHtml,
      });

      results.push(r);
    }
    const sentUserIds = users.map(u => u._id);
    promo.selectedUsers = Array.from(new Set([...(promo.selectedUsers || []), ...sentUserIds]));
    await promo.save();


    return res.status(200).json({
      success: true,
      message: `Promo emails sent successfully to ${users.length} users`,
      data: {
        totalSent: users.length,
        results,
      },
    });

  } catch (error) {
    next(error);
  }
};