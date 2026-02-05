import { generateResponse } from "../../lib/responseFormate.js";
import { createNewsletterSubscriptionService, getAllNewsletterSubscriptionService, unsubscribeNewsletterService } from "./newsletterSubscription.service.js";

export const createNewsletterSubscription = async (req, res, next) => {
    const { email } = req.body;
    try {
        await createNewsletterSubscriptionService(email);
        generateResponse(res, 201, true, 'Newsletter subscription created successfully', null);
    }

    catch (error) {
        if (error.message === 'Email already subscribed to the newsletter') {
            generateResponse(res, 400, false, error.message, null);
        }

        else {
            next(error);
        }
    }
}
export const getAllNewsletterSubscription = async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    try {
        const {data, pagination} = await getAllNewsletterSubscriptionService(page, limit, skip);
        return res.status(200).json({
            success: true,
            message: 'Newsletter subscriptions fetched successfully',
            data,
            pagination
        });
    }

    catch (error) {
        next(error);
    }
}

export const unsubscribeNewsletter = async (req, res, next) => {
    const { email } = req.body;
    try {
        await unsubscribeNewsletterService(email);
        generateResponse(res, 200, true, 'You have been successfully unsubscribed from the newsletter', null);
    } catch (error) {
        if (error.message === 'Email not found in newsletter subscriptions') {
            generateResponse(res, 404, false, error.message, null);
        } else {
            next(error);
        }
    }
}