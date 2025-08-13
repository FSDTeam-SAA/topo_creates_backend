
import { generateResponse } from '../../lib/responseFormate.js';
import User from '../auth/auth.model.js';
import { createOrReuseVerificationSession } from './kyc.service.js';


export const startOrResumeVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // console.log("User found:", user);

    const { url, reused } = await createOrReuseVerificationSession(user);

    return generateResponse(res, 200, true,{
      url,
      message: reused ? 'Resuming existing verification session' : 'New verification session created',
    });
  } catch (error) {
    console.error('Error starting/resuming verification:', error);
    return generateResponse(res, 500, false, 'Failed to start or resume verification');
  }
};
