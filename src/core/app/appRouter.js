import express from 'express';
import authRoutes from '../../entities/auth/auth.routes.js';
import userRoutes from '../../entities/user/user.routes.js';
import newsletterSubscriptionRoutes from '../../entities/newsletterSubscription/newsletterSubscription.routes.js'
import reviewsRoutes from '../../entities/review/review.routes.js'
import applicationRoutes from '../../entities/application/application.routes.js'
import lenderRoutes from '../../entities/lender/Listings/lisitngs.routes.js'
import customerBookingRoutes from '../../entities/booking/customer/bookings.routes.js';
import messageRoutes from '../../entities/message/message.routes.js';
// import customerBookingRoutes from '../../entities/customer/bookings/bookings.routes.js';
// import lenderBookingRoutes from '../../entities/lender/bookings/bookings.routes.js';
// import adminBookingRoutes from '../../entities/admin/bookings/bookings.routes.js';
// import webhookRoutes from '../../entities/webhooks/webhooks.routes.js';
import customerDispute from '../../entities/dispute/customer/dispute.routes.js';
import lenderDispute from '../../entities/dispute/lender/dispute.routes.js';
import adminListingRoutes from '../../entities/admin/Lisitngs/ReviewandMain Site Listing/adminListing.routes.js'
import teamRoutes from '../../entities/admin/team/team.routes.js';
import bannerRoutes from '../../entities/admin/contentAndCMS/banners/banners.routes.js';
import testimonialRoutes from '../../entities/admin/contentAndCMS/testimonials/testimonials.routes.js';
import termsAndConditionsRoutes from '../../entities/admin/contentAndCMS/termsAndConditions/termsAndConditions.routes.js';
import homepageSectionsRoutes from '../../entities/admin/contentAndCMS/homepageSections/homepageSections.routes.js';
import accountRoutes from '../../entities/lender/account settings/account.routes.js';
import onboardingRoutes from '../../entities/lender/Onboard/onboard.routes.js'
import paymentRoutes from '../../entities/Payment/Booking/payment.routes.js'
import subscriptionRoutes from '../../entities/subscription/subscription.routes.js'
import payOutRoutes from '../../entities/lender/payOut/payOuts.routes.js'
import supportRoutes from '../../entities/support/support.routes.js'
import adminDispute from '../../entities/dispute/admin/dispute.routes.js';
import overviewRoutes from '../../entities/lender/overview/overview.routes.js';
import customerRoutes from '../../entities/admin/customer/customer.routes.js'
import overviewAdminRoutes from '../../entities/admin/overview/overview.routes.js';
import promoCode from '../../entities/admin/promoCode/promoCode.routes.js'
import editRoutes from '../../entities/admin/styleByYou/edit.routes.js'
const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/newsletterSubscription', newsletterSubscriptionRoutes)
router.use('/v1/reviews', reviewsRoutes)
router.use('/v1/application', applicationRoutes)
router.use('/v1/lender', lenderRoutes);
router.use('/v1/payment', paymentRoutes);
router.use('/v1/lender/account', accountRoutes);


router.use('/v1/message', messageRoutes)
router.use('/v1/payout',payOutRoutes)


// admin routes
router.use('/v1/admin',adminListingRoutes)
router.use('/v1/admin/promo',promoCode)
router.use('/v1/admin/team', teamRoutes);
router.use('/v1/support',supportRoutes)



// content and CMS routes
router.use('/v1/banner', bannerRoutes)
router.use('/v1/testimonoal', testimonialRoutes)
router.use('/v1/termsAndConditions', termsAndConditionsRoutes); 
router.use('/v1/homepageSections', homepageSectionsRoutes);
router.use('/v1/admin/edit', editRoutes)

router.use('/v1/lender/overview', overviewRoutes)


// lender routes
router.use('/v1/subscription',subscriptionRoutes)
//lender onboard routes

router.use('/v1/lender',onboardingRoutes)


// dispute routes
router.use('/v1/customer/disputes', customerDispute);
router.use('/v1/lender/disputes', lenderDispute); 
router.use('/v1/admin/disputes', adminDispute); 

// bookings routes
router.use('/v1/customer/bookings', customerBookingRoutes);
// app.use('/api/lender/bookings', lenderBookingRoutes);
// app.use('/api/admin/bookings', adminBookingRoutes);
// app.use('/api/webhooks', webhookRoutes);

router.use('/v1/admin/customer', customerRoutes);
router.use('/v1/admin/overview', overviewAdminRoutes);


export default router;
