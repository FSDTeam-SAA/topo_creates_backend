import jwt from 'jsonwebtoken';
import {accessTokenSecrete} from '../../core/config/config.js';
import RoleType from '../../lib/types.js';
import User from '../../entities/auth/auth.model.js';
import { generateResponse } from '../../lib/responseFormate.js';
import Team from '../../entities/admin/team/team.model.js';


export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return generateResponse(res, 401, false, "No token, auth denied", null);
  }

  try {
    const decoded = jwt.verify(token, accessTokenSecrete);

    let account;

    account = await User.findById(decoded._id)
      .select("-password -createdAt -updatedAt -__v");

    if (!account) {
      account = await Team.findById(decoded._id)
        .select("-password -createdAt -updatedAt -__v");
    }

    if (!account) {
      return generateResponse(res, 401, false, "Invalid token user", null);
    }

    // Attach final user info to req.user
    req.user = {
      _id: account._id,
      email: account.email,
      role: decoded.role,               
      permissions: decoded.permissions || [],
      ...account.toObject()            
    };

    return next();
  } 
  catch (err) {
    if (err.name === "TokenExpiredError") {
      return generateResponse(res, 401, false, "Token expired", null);
    } 
    else if (err.name === "JsonWebTokenError") {
      return generateResponse(res, 401, false, "Token is not valid", null);
    } 
    else if (err.name === "NotBeforeError") {
      return generateResponse(res, 401, false, "Token not active", null);
    } 
    else {
      return next(err);
    }
  }
};


const userMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: User not found', null);
  }
  const { role } = req.user;

 if (role !== "USER") {
  return generateResponse(res, 403, false, 'User access only', null);
}
next();
};


const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: Admin not found', null);
  }
  const { role } = req.user;

  if (role !== "ADMIN") {
    generateResponse(res, 403, false, 'Admin access only', null);
  }

  next();
};


const superadminMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: Admin not found', null);
  }
  const { role } = req.user;

  if (role !== "SUPER_ADMIN") {
    generateResponse(res, 403, false, 'Super Admin access only', null);
  }

  next();
};


const lenderMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: Lender not found', null);
  }
  const { role } = req.user;

  if (role !== "LENDER") {
    generateResponse(res, 403, false, 'Lender access only', null);
  }

  next();
};


const userLenderMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: Lender not found', null);
  }
  const { role } = req.user || {};

  if (role !== RoleType.USER && role !== RoleType.LENDER) {
    return generateResponse(res, 403, false, 'User or Lender access only', null);
  }

  next();
};


const adminLenderMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: Lender not found', null);
  }
  const { role } = req.user || {};

  if (role !== RoleType.ADMIN && role !== RoleType.LENDER) {
    generateResponse(res, 403, false, 'Admin or Lender access only', null);
  }

  next();
};


const adminLenderSuperadminMiddleware = (req, res, next) => {
  if (!req.user) {
    return generateResponse(res, 401, false, 'Unauthorized: Lender not found', null);
  }
  const { role } = req.user || {};

  if (role !== RoleType.ADMIN && role !== RoleType.LENDER && role !== RoleType.SUPER_ADMIN) {
    generateResponse(res, 403, false, 'Admin, Lender or Super Admin access only', null);
  }

  next();
};


const userAdminLenderMiddleware = (req, res, next) => {
  const { role } = req.user || {};

  if (![RoleType.USER, RoleType.ADMIN, RoleType.LENDER].includes(role))
 {
    return generateResponse(res, 403, false, 'User, Admin or Lender access only', null);
  }
  next();
};


const superAdminOrAdminMiddleware = (req, res, next) => {
  const { role } = req.user || {};

  if (![RoleType.SUPER_ADMIN, RoleType.ADMIN].includes(role))
 {
    return generateResponse(res, 403, false, 'Super Admin or Admin access only', null);
  }
  next();
};


const userAdminLenderSuperAdminMiddleware = (req, res, next) => {
  const { role } = req.user || {};

  if (![RoleType.USER, RoleType.ADMIN, RoleType.LENDER, RoleType.SUPER_ADMIN].includes(role))
  {
    return generateResponse(res, 403, false, 'User, Admin, Lender or Super Admin access only', null);
  }
  next();
};


export{ userMiddleware, adminMiddleware, lenderMiddleware, adminLenderMiddleware, userAdminLenderMiddleware, superAdminOrAdminMiddleware, superadminMiddleware, userLenderMiddleware,  userAdminLenderSuperAdminMiddleware, adminLenderSuperadminMiddleware };