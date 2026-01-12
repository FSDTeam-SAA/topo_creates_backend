// 📦 Updated Lender Application Services to Use User Model Only

import { adminEmail } from '../../core/config/config.js';
import { generateRandomPassword } from '../../lib/generatePassword.js';
import lenderCredentialsTemplate from '../../lib/lenderCredentialsTemplate.js';
import { sendEmail } from '../../lib/resendEmial.js';
import RoleType from '../../lib/types.js';
import User from '../auth/auth.model.js';

export const createApplication = async (data) => {
  const normalizedEmail = data.email?.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required');

  // Check if user with email exists (either active user or pending application)
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.status === 'pending') {
    throw new Error('You have already applied. Please wait for review.');
  }
  if (existingUser && existingUser.role === 'LENDER') {
    throw new Error('User with this email is already a lender.');
  }

  // Generate random password for the applicant (saved in DB but not emailed to them)
  const tempPassword = generateRandomPassword(10);

  let user;
  if (existingUser) {
    // Update existing user record (not lender, maybe role=USER)
    user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        ...data,
        password: tempPassword,
        status: 'pending',
        applicationSubmittedAt: new Date(),
        role: 'APPLICANT' // or keep USER, just mark status
      },
      { new: true }
    );
  } else {
    // Create new user with application info
    user = new User({
      ...data,
      email: normalizedEmail,
      password: tempPassword,
      status: 'pending',
      applicationSubmittedAt: new Date(),
      role: 'APPLICANT' // temp role
    });
    await user.save();
  }

  // Email admin with applicant info and password
  const adminEmailContent = `
    <p>New lender application submitted:</p>
    <ul>
      <li>Name: ${user.fullName || user.firstName || 'N/A'}</li>
      <li>Email: ${user.email}</li>
      <li>Phone: ${user.phoneNumber || 'N/A'}</li>
      <li>Temporary Password: <strong>${tempPassword}</strong></li>
    </ul>
    <p>Please review and approve/reject the application in the admin panel.</p>
  `;

  // Email applicant confirmation (no password)
  const applicantEmailContent = `
    <p>Dear ${user.fullName || user.firstName || 'Applicant'},</p>
    <p>Thank you for your lender application. Your application has been received and is pending review.</p>
    <p>We will contact you once your application is reviewed.</p>
  `;

  // Send both emails in parallel to reduce wait time
  await Promise.all([
    sendEmail({
      to: adminEmail,
      subject: 'New Lender Application Received',
      html: adminEmailContent
    }),
    sendEmail({
      to: user.email,
      subject: 'Your Lender Application Has Been Received',
      html: applicantEmailContent
    })
  ]);

  // Return the user data (without password)
  user.password = undefined;
  return user;
};

export const getAllApplicationsService = async ({
  search,
  status,
  totalbookings,
  totalRatting,
  totalListings,
  totalReveneue,
  startDate,
  endDate,
  page = 1,
  limit = 10
}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const regex = search ? new RegExp(search, 'i') : null;

  const query = {
    status: { $ne: null },
    role: { $in: ['LENDER', 'APPLICANT'] }
  };

  if (status && status !== 'all') query.status = status;
  if (regex) {
    query.$or = [
      { fullName: { $regex: regex } },
      { firstName: { $regex: regex } },
      { lastName: { $regex: regex } }
    ];
  }
  if (totalbookings) query.totalbookings = parseInt(totalbookings);
  if (totalRatting) query.totalRatting = parseInt(totalRatting);
  if (totalListings) query.totalListings = parseInt(totalListings);
  if (totalReveneue) query.totalReveneue = parseInt(totalReveneue);
  if (startDate || endDate) {
    query.applicationSubmittedAt = {};
    if (startDate) query.applicationSubmittedAt.$gte = new Date(startDate);
    if (endDate) query.applicationSubmittedAt.$lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getApplicationById = async (id) => {
  const user = await User.findById(id);
  if (!user || !user.status) throw new Error('Application not found');
  return user;
};

export const updateApplication = async (id, data) => {
  const user = await User.findById(id).select(
    '-password -accessToken -refreshToken'
  );

  if (!user || !user.status) throw new Error('Application not found');

  const isAlreadyApproved =
    user.status === 'approved' && data.status === 'approved';
  const isNowRejected = data.status === 'rejected';
  if (isAlreadyApproved)
    throw new Error('This lender application has already been approved.');

  const isNowApproved =
    ['pending', 'rejected'].includes(user.status) && data.status === 'approved';

  if (isNowApproved) {
    user.role = 'LENDER';
    user.applicationReviewedAt = new Date();
    user.status = 'approved';

    await user.save();

    const adminEmailContent = `
      <p>Application has been approved</p>
      <ul>
        <li>Name: ${user.fullName || user.firstName || 'N/A'}</li>
        <li>Email: ${user.email}</li>
        <li>Phone: ${user.phoneNumber || 'N/A'}</li>
      </ul>
    `;

    const userEmailContent = `
      <p>Dear ${user.fullName || 'Applicant'},</p>
      <p>Your lender application has been approved.</p>
    `;

    await Promise.all([
      sendEmail({
        to: user.email,
        subject: 'Your Lender Application Approved',
        html: userEmailContent
      }),
      sendEmail({
        to: adminEmail,
        subject: 'A Lender Application Has Been Approved',
        html: adminEmailContent
      })
    ]);
  } else if (isNowRejected) {
    user.status = 'rejected';
    user.role = 'APPLICANT';
    user.applicationReviewedAt = new Date();

    if (data.rejectionNote) {
      user.rejectionNote = data.rejectionNote;
    }

    await user.save();

    const userEmailContent = `
      <p>Dear ${user.fullName || 'Applicant'},</p>
      <p>We're sorry to inform you that your lender application has been rejected.</p>
      ${
        data.rejectionNote
          ? `<p><strong>Reason:</strong> ${data.rejectionNote}</p>`
          : ''
      }
    `;

    await sendEmail({
      to: user.email,
      subject: 'Your Lender Application Rejected',
      html: userEmailContent
    });
  } else {
    await User.findByIdAndUpdate(id, data, { new: true });
  }

  return await User.findById(id).select('-password -accessToken -refreshToken');
};

export const deleteApplication = async (id) => {
  const user = await User.findById(id);
  if (!user || !user.status) throw new Error('Application not found');

  user.status = null;
  user.applicationSubmittedAt = null;
  user.applicationReviewedAt = null;

  await user.save();
  return user;
};
