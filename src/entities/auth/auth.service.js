import User from './auth.model.js';
import jwt from 'jsonwebtoken';
import {
  accessTokenExpires,
  accessTokenSecrete,
  refreshTokenExpires,
  refreshTokenSecrete,
  emailExpires
} from '../../core/config/config.js';
import { sendEmail } from '../../lib/resendEmial.js';
import verificationCodeTemplate from '../../lib/emailTemplates.js';
import Team from '../admin/team/team.model.js';
import bcrypt from 'bcrypt';

export const registerUserService = async ({
  firstName,
  lastName,
  email,
  password
}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('User already registered.');

  const newUser = new User({
    firstName,
    lastName,
    email,
    password
  });

  const user = await newUser.save();

  const { _id, role, profileImage } = user;
  return { _id, firstName, lastName, email, role, profileImage };
};

export const loginUserService = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password are required');

  let account = null;
  let accountType = null;

  // --- CHECK USER MODEL (USER + SUPER_ADMIN) ---
  account = await User.findOne({ email }).select('+password');

  if (account) {
    if (account.role === 'SUPER_ADMIN') accountType = 'SUPER_ADMIN';
    else if (account.role === 'USER') accountType = 'USER';
    else if (account.role === 'LENDER') accountType = 'LENDER';
    else accountType = 'ADMIN';
  }

  // --- CHECK TEAM MODEL (ADMIN) ---
  if (!account) {
    account = await Team.findOne({ email }).select('+password');
    if (account) accountType = 'ADMIN';
  }

  if (!account) throw new Error('User not found');

  // PASSWORD VALIDATION
  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) throw new Error('Invalid password');

  // JWT PAYLOAD
  const payload = {
    _id: account._id,
    role: accountType,
    permissions: accountType === 'ADMIN' ? account.permissions : []
  };

  // TOKENS
  const accessToken = jwt.sign(payload, accessTokenSecrete, {
    expiresIn: accessTokenExpires
  });

  const refreshToken = jwt.sign(payload, refreshTokenSecrete, {
    expiresIn: refreshTokenExpires
  });

  // SAVE REFRESH TOKEN FOR USER + SUPER_ADMIN
  if (accountType === 'USER' || accountType === 'SUPER_ADMIN') {
    account.refreshToken = refreshToken;
    await account.save();
  }

  // RESPONSE (role-based)
  let responseUser = {
    _id: account._id,
    email: account.email,
    role: accountType
  };

  // USER + SUPER_ADMIN RESPONSE FORMAT
  if (
    accountType === 'USER' ||
    accountType === 'SUPER_ADMIN' ||
    accountType === 'LENDER'
  ) {
    responseUser.firstName = account.firstName;
    responseUser.lastName = account.lastName;
    responseUser.profileImage = account.profileImage || '';
  }

  // ADMIN RESPONSE FORMAT
  if (accountType === 'ADMIN') {
    responseUser.name = account.name;
    responseUser.permissions = account.permissions || [];
  }

  return {
    user: responseUser,
    accessToken,
    refreshToken
  };
};

// export const loginUserService = async ({ email, password }) => {
//   if (!email || !password) throw new Error('Email and password are required');

//   const user = await User.findOne({ email }).select("_id firstName lastName email role profileImage");

//   if (!user) throw new Error('User not found');

//   const isMatch = await user.comparePassword(user._id, password);
//   if (!isMatch) throw new Error('Invalid password');

//   const payload = { _id: user._id, role: user.role };

//   const data = {
//     user,
//     accessToken: user.generateAccessToken(payload)
//   };

//   user.refreshToken = user.generateRefreshToken(payload);
//   await user.save({ validateBeforeSave: false });

//   return data
// };

export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new Error('No refresh token provided');

  const user = await User.findOne({ refreshToken });

  if (!user) throw new Error('Invalid refresh token');

  const decoded = jwt.verify(refreshToken, refreshTokenSecrete);

  if (!decoded || decoded._id !== user._id.toString())
    throw new Error('Invalid refresh token');

  const payload = { _id: user._id };

  const accessToken = user.generateAccessToken(payload);
  const newRefreshToken = user.generateRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken: newRefreshToken
  };
};

export const forgetPasswordService = async (email) => {
  if (!email) throw new Error('Email is required');

  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email');

  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpires = new Date(Date.now() + emailExpires);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: email,
    subject: 'Password Reset OTP',
    html: verificationCodeTemplate(otp)
  });

  return;
};

export const verifyCodeService = async ({ email, otp }) => {
  if (!email || !otp) throw new Error('Email and otp are required');

  const user = await User.findOne({ email });

  if (!user) throw new Error('Invalid email');

  if (!user.otp || !user.otpExpires) throw new Error('Otp not found');

  if (user.otp !== otp || new Date() > user.otpExpires)
    throw new Error('Invalid or expired otp');

  user.otp = null;
  user.otpExpires = null;
  await user.save({ validateBeforeSave: false });

  return;
};

export const resetPasswordService = async ({ email, newPassword }) => {
  if (!email || !newPassword)
    throw new Error('Email and new password are required');

  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email');

  if (user.otp || user.otpExpires) throw new Error('otp not cleared');

  user.password = newPassword;
  await user.save();

  return;
};

export const changePasswordService = async ({
  userId,
  oldPassword,
  newPassword
}) => {
  if (!userId || !oldPassword || !newPassword)
    throw new Error('User id, old password and new password are required');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const isMatch = await user.comparePassword(userId, oldPassword);
  if (!isMatch) throw new Error('Invalid old password');

  user.password = newPassword;
  await user.save();

  return;
};
