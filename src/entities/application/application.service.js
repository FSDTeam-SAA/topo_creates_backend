import Application from './application.model.js';
import { generateRandomPassword } from '../../lib/generatePassword.js'; 
import lenderCredentialsTemplate from '../../lib/lenderCredentialsTemplate.js';
import sendEmail from '../../lib/sendEmail.js'; 
import User from '../auth/auth.model.js'

export const createApplication = async (data) => {
    const exists = await Application.findOne({ businessEmail: data.businessEmail });
    if (exists) throw new Error('An application with this email already exists');

    const application = new Application(data);
    return await application.save();
};


export const getAllApplications = async () => {
    const applications = await Application.find().sort({ createdAt: -1 });
    if (!applications) throw new Error('No applications found');
    return applications;
}
export const getApplicationById = async (id) => {
    const application = await Application.findById(id);
    if (!application) throw new Error('Application not found');
    return application;
}
export const updateApplication = async (id, data) => {
  try {
    const prevApp = await Application.findById(id);
    if (!prevApp) throw new Error('Application not found');

    const wasPending = prevApp.status === 'pending';
    const isNowApproved = data.status === 'approved';

    const updatedApplication = await Application.findByIdAndUpdate(id, data, { new: true });

    if (wasPending && isNowApproved) {
      try {
        const existingUser = await User.findOne({ email: updatedApplication.businessEmail });

        if (!existingUser) {
          const password = generateRandomPassword();

          const user = new User({
            email: updatedApplication.businessEmail,
            username: updatedApplication.businessEmail,
            password,
            role: 'LENDER',
            fullName: updatedApplication.fullName,
            businessName: updatedApplication.businessName,
            businessAddress: updatedApplication.businessAddress,
            phoneNumber: updatedApplication.phoneNumber,
          });

          await user.save();

          const emailContent = lenderCredentialsTemplate(
            updatedApplication.fullName,
            updatedApplication.businessEmail,
            password
          );

          await sendEmail({
            to: updatedApplication.businessEmail,
            subject: 'Your Lender Account Details',
            html: emailContent,
          });

          console.log(`✅ Email sent to ${updatedApplication.businessEmail}`);
        } else {
          console.log(`ℹ️ User already exists for ${updatedApplication.businessEmail}`);
        }
      } catch (userOrEmailErr) {
        console.error('❌ Error while creating user or sending email:', userOrEmailErr);
      }
    }

    return updatedApplication;
  } catch (err) {
    console.error('❌ Error in updateApplication:', err);
    throw err; // rethrow for controller to catch
  }
};

export const deleteApplication = async (id) => {
    const application = await Application.findByIdAndDelete(id);
    if (!application) throw new Error('Application not found');
    return application;
}



