import mongoose from 'mongoose';
import { deactivationOtpEmail } from '../../../lib/deactivationOtpEmail.js';
import { sendEmail } from '../../../lib/resendEmial.js';
import User from '../../auth/auth.model.js';
import { Dispute } from '../../dispute/dispute.model.js';
import payOutModel from '../payOut/payOut.model.js';
import Listing from '../Listings/listings.model.js';
import { Booking } from '../../booking/booking.model.js';

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const getLenderByIdService = async (id) => {
  const lender = await User.findById(id).select('-password');
  if (!lender) throw new Error('Lender not found');

  return {
    lender
  };
};

export const updateLenderByIdService = async (id, updates) => {
  const updated = await User.findByIdAndUpdate(id, updates, {
    new: true
  }).select('-password');
  if (!updated) throw new Error('Update failed or Lender not found');

  return {
    message: 'Lender profile updated successfully.',
    updatedLender: updated
  };
};

export const startDeactivationService = async ({
  lenderId,
  reason,
  feedback
}) => {
  const lender = await User.findById(lenderId);
  if (!lender) throw new Error('Lender not found');

  lender.deactivationReason = reason;
  lender.deactivationFeedback = feedback;
  await lender.save();

  return {
    message:
      'Deactivation reason and feedback saved. Proceed to verification step.',
    lender,
    timestamp: new Date()
  };
};

export const sendDeactivationCodeService = async (userId) => {
  const lender = await User.findById(userId);

  if (!lender) throw new Error('User not found');

  const otp = generateOTP();
  lender.otp = otp;
  lender.otpExpires = Date.now() + 10 * 60 * 1000;
  await lender.save();

  if (lender.email) {
    const html = deactivationOtpEmail(lender.fullName || 'Lender', otp);
    await sendEmail({
      to: lender.email,
      subject: 'Your Account Deactivation Code',
      html
    });
  }

  return {
    message: 'Verification code sent successfully.',
    deliveryMethod: lender.email ? 'email' : 'phone',
    expiresIn: '10 minutes'
  };
};

export const verifyDeactivationCodeService = async ({ userId, code }) => {
  const lender = await User.findById(userId);
  if (!lender) throw new Error('Lender not found');

  const now = Date.now();
  if (!lender.otp || lender.otp !== code || now > lender.otpExpires) {
    throw new Error('Invalid or expired verification code');
  }

  lender.isActive = false;
  lender.deactivated = true;
  lender.otp = null;
  lender.otpExpires = null;
  await lender.save();

  return {
    message: 'Account has been successfully deactivated.',
    deactivatedAt: new Date(),
    lenderId: lender._id
  };
};
