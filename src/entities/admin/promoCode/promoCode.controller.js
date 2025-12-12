
// =============================
// CREATE PROMO CODE

import { promoCodeTemplate } from "../../../lib/emailTemplates/promoCode.template.js";
import { sendEmail } from "../../../lib/resendEmial.js";
import User from "../../auth/auth.model.js";
import promoCodeUsageModel from "../../booking/promoCodeUsage.model.js";
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
    // 1️⃣ Fetch all promo codes
    const promos = await PromoCode.find().sort({ createdAt: -1 });

    // 2️⃣ Total issued discount = discount * maxUsage
    const issuedAgg = await PromoCode.aggregate([
      {
        $group: {
          _id: null,
          totalIssuedDiscount: {
            $sum: { $multiply: ["$discount", "$maxUsage"] }
          }
        }
      }
    ]);
    const totalIssuedDiscount =
      issuedAgg.length > 0 ? issuedAgg[0].totalIssuedDiscount : 0;

    // 3️⃣ Total discount given from PromoCodeUsage
    const usageAgg = await promoCodeUsageModel.aggregate([
      {
        $group: {
          _id: null,
          totalDiscountGiven: { $sum: "$discountApplied" }
        }
      }
    ]);
    const totalDiscountGiven =
      usageAgg.length > 0 ? usageAgg[0].totalDiscountGiven : 0;

    // 4️⃣ Fetch all PromoCodeUsage documents with populated fields
    const allUsage = await promoCodeUsageModel.find()
      .populate({ path: "userId", select: "firstName email" })
      .populate({ path: "promoCodeId", select: "code expiresAt createdAt discountType discount" })
      .populate({ path: "bookingId", select: "_id" })
      .sort({ usedAt: -1 });

    // 5️⃣ Format usage for response
    const usageData = allUsage.map(u => ({
      bookingId: u.bookingId?._id || null,
      promoCodeName: u.promoCodeId?.code || "",
      promoCodeDiscount: u.promoCodeId?.discount || 0,
      userName: u.userId?.firstName || "",
      userEmail: u.userId?.email || "",
      discountApplied: u.discountApplied,
      usedAt: u.usedAt,
      expireAt: u.promoCodeId?.expiresAt || null,   // <- corrected
  createAt: u.promoCodeId?.createdAt || null

    }));

    // 6️⃣ Return response
    return res.status(200).json({
      success: true,
      message: "Promo codes fetched successfully",
      totalIssuedDiscount,
      totalDiscountGiven,
      data: promos,
      usageData
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

export const getUserSpecificActivePromoCodes = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not logged in",
      });
    }

    // Find promo codes where:
    // 1. Active = true
    // 2. Not expired
    // 3. Logged-in user is inside selectedUsers array
    const promos = await PromoCode.find({
      isActive: true,
      expiresAt: { $gte: new Date() },
      selectedUsers: { $in: [userId] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "User-specific active promo codes fetched successfully",
      data: promos,
    });

  } catch (error) {
    next(error);
  }
};
