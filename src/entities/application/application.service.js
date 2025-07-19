import Application from './application.model.js';
import { generateRandomPassword } from '../../lib/generatePassword.js';
import lenderCredentialsTemplate from '../../lib/lenderCredentialsTemplate.js';
import sendEmail from '../../lib/sendEmail.js';
import User from '../auth/auth.model.js'


export const createApplication = async (data) => {
  if (!data.businessEmail) {
    throw new Error('Business email is required');
  }

  const normalizedEmail = data.businessEmail.trim().toLowerCase();
  const exists = await Application.findOne({ businessEmail: normalizedEmail });

  if (exists) throw new Error('An application with this email already exists');

  const application = new Application({
    ...data,
    businessEmail: normalizedEmail, 
  });

  return await application.save();
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
  limit = 10,
}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const regex = search ? new RegExp(search, "i") : null;

  let data = [];
  let total = 0;

  // Numeric filters for User
  const userNumberFilters = {};
  if (totalbookings) userNumberFilters.totalbookings = parseInt(totalbookings);
  if (totalRatting) userNumberFilters.totalRatting = parseInt(totalRatting);
  if (totalListings) userNumberFilters.totalListings = parseInt(totalListings);
  if (totalReveneue) userNumberFilters.totalReveneue = parseInt(totalReveneue);

  // Date filter for Applications
  let applicationDateFilter = {};
  if (startDate || endDate) {
    applicationDateFilter.createdAt = {};
    if (startDate) applicationDateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) applicationDateFilter.createdAt.$lte = new Date(endDate);
  }

  if (Object.keys(userNumberFilters).length > 0) {
    const userFilter = {
      role: "LENDER",
      ...userNumberFilters,
    };
    if (regex) {
      userFilter.$or = [
        { fullName: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
      ];
    }

    [data, total] = await Promise.all([
      User.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(userFilter),
    ]);
  } else if (startDate || endDate) {
    const appFilter = { ...applicationDateFilter };
    if (status) appFilter.status = status;
    if (regex) appFilter.fullName = { $regex: regex };

    [data, total] = await Promise.all([
      Application.find(appFilter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application.countDocuments(appFilter),
    ]);
  } else if (status === "pending") {
    const filter = { status: "pending" };
    if (regex) filter.fullName = { $regex: regex };

    [data, total] = await Promise.all([
      Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application.countDocuments(filter),
    ]);
  } else if (status === "approved") {
    const approvedApps = await Application.find({ status: "approved" });
    const approvedEmails = approvedApps.map(app => app.businessEmail);

    const userFilter = {
      email: { $in: approvedEmails },
      role: "LENDER",
    };
    if (regex) {
      userFilter.$or = [
        { fullName: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
      ];
    }

    [data, total] = await Promise.all([
      User.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(userFilter),
    ]);
  } else if (status) {
    const filter = { status };
    if (regex) filter.fullName = { $regex: regex };

    [data, total] = await Promise.all([
      Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application.countDocuments(filter),

    ]);
    
    
  } else if (search) {
    const [apps, users] = await Promise.all([
      Application.find({ fullName: { $regex: regex } }),
      User.find({
        role: "LENDER",
        $or: [
          { fullName: { $regex: regex } },
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
        ],
      }),
    ]);

    const combined = [...apps, ...users];
    total = combined.length;
    data = combined.slice(skip, skip + parseInt(limit));
  } else {
    const [applications, users] = await Promise.all([
      Application.find().sort({ createdAt: -1 }),
      User.find({ role: "LENDER" }).sort({ createdAt: -1 }),
    ]);

    const combined = [...applications, ...users];
    total = combined.length;
    data = combined.slice(skip, skip + parseInt(limit));
  }




  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    },
  };
};



export const getApplicationById = async (id) => {
  const application = await Application.findById(id);
  if (!application) throw new Error('Application not found');
  return application;
}


export const updateApplication = async (id, data) => {
  try {
    const prevApp = await Application.findById(id);
    if (!prevApp) throw new Error('Application not found');

    const isAlreadyApproved = prevApp.status === 'approved' && data.status === 'approved';
if (isAlreadyApproved) {
  throw new Error(`This lender application has already been approved.`);
}

    const wasPending = prevApp.status === 'pending';
    const isNowApproved = data.status === 'approved';

    // Prevent status update if user already exists
    if (wasPending && isNowApproved) {
      const existingUser = await User.findOne({ email: prevApp.businessEmail });

      if (existingUser) {
        // Send a polite email to the applicant
        const conflictEmailContent = `
          <p>Dear ${prevApp.fullName},</p>
          <p>Unfortunately, we couldn’t approve your application because the email <strong>${prevApp.businessEmail}</strong> is already associated with an existing lender account.</p>
          <p>Please try again with a different business email.</p>
          <p>Thank you,<br/>The Team</p>
        `;

        await sendEmail({
          to: prevApp.businessEmail,
          subject: 'Lender Application Error - Email Already Exists',
          html: conflictEmailContent,
        });

        console.log(`Conflict email sent to ${prevApp.businessEmail}`);

        // Respond with error
        throw new Error(`This lender application has already been approved.`);

      }

      // If user does not exist, create the account and send credentials
      const password = generateRandomPassword();

      const user = new User({
        email: prevApp.businessEmail,
        username: prevApp.businessEmail,
        password,
        role: 'LENDER',
        fullName: prevApp.fullName,
        phoneNumber: prevApp.phoneNumber,

        businessName: prevApp.businessName,
        businessAddress: prevApp.businessAddress,
        abnNumber: prevApp.abnNumber,
        instagramHandle: prevApp.instagramHandle,
        businessWebsite: prevApp.businessWebsite,
        numberOfDresses: prevApp.numberOfDresses,
        allowTryOn: prevApp.allowTryOn,
        allowLocalPickup: prevApp.allowLocalPickup,
        shipAustraliaWide: prevApp.shipAustraliaWide,
        reviewStockMethod: prevApp.reviewStockMethod,
        agreedTerms: prevApp.agreedTerms,
        agreedCurationPolicy: prevApp.agreedCurationPolicy,
        deactivationReason: prevApp.deactivationReason,
        deactivationFeedback: prevApp.deactivationFeedback,
        deactivated: prevApp.deactivated,
      });

      await user.save();

      const emailContent = lenderCredentialsTemplate(
        prevApp.fullName,
        prevApp.businessEmail,
        password
      );

      await sendEmail({
        to: prevApp.businessEmail,
        subject: 'Your Lender Account Details',
        html: emailContent,
      });

      console.log(`Credentials email sent to ${prevApp.businessEmail}`);
    }

    // Only update application if no conflict
    const updatedApplication = await Application.findByIdAndUpdate(id, data, { new: true });
    return updatedApplication;

  } catch (err) {
    console.error('Error in updateApplication:', err);
    throw err;
  }
};


export const deleteApplication = async (id) => {
  const application = await Application.findByIdAndDelete(id);
  if (!application) throw new Error('Application not found');
  return application;
}



