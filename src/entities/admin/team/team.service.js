import Team from "./team.model.js";


export const createAdminService = async ({ name, email, permissions, createdBy }) => {
  const existing = await Team.findOne({ email });
  if (existing) {
    throw new Error("Admin already exists");
  }

  const admin = new Team({ name, email, permissions, createdBy });
  return await admin.save();
};


export const updateAdminPermissionsService = async (id, updates) => {
  const updatePayload = {};

  if (updates.permissions) updatePayload.permissions = updates.permissions;
  if (updates.status) updatePayload.status = updates.status;

  const admin = await Team.findByIdAndUpdate(id, updatePayload, { new: true });
  if (!admin) {
    throw new Error("Admin not found");
  }
  return admin;
};


export const getAdminByIdService = async (id) => {
  const admin = await Team.findById(id).populate("createdBy", "name email");
  if (!admin) {
    throw new Error("Admin not found");
  }
  return admin;
};


export const getAllAdminsService = async () => {
  return await Team.find().populate("createdBy", "name email");
};


