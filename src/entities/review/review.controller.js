import { generateResponse } from "../../lib/responseFormate.js";
import { approveReviewService, createReviewService, declineReviewService, getAllPendingReviewsService, getAllReviewsService, getReviewsCountService } from "./review.service.js";

//user
export const createReview = async (req, res, next) => {
    const userId = req.user._id;
    req.body.userId = userId;

    try {
        await createReviewService(req.body);
        generateResponse(res, 201, true, 'Review created successfully', null);
    }

    catch (error) {
        next(error);
    }
}

export const getAllReviews = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    try {
        const { data, pagination } = await getAllReviewsService(page, limit, skip);
        return res.status(200).json({
            success: true,
            data,
            pagination
        });
    }

    catch (error) {
        next(error);
    }
}

//admin
export const getReviewsCount = async (req, res, next) => {
    try {
        const reviewsCount = await getReviewsCountService();
        generateResponse(res, 200, true, 'Reviews count fetched successfully', reviewsCount);
    }

    catch (error) {
        next(error);
    }
}

export const getAllPendingReviews = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || null;
    const skip = (page - 1) * limit;
    try {
        const { data, pagination } = await getAllPendingReviewsService(search, page, limit, skip);
        return res.status(200).json({
            success: true,
            data,
            pagination
        });
    }

    catch (error) {
        next(error);
    }
}

export const approveReview = async (req, res, next) => {
    const { id } = req.params;
    try {
        await approveReviewService(id);
        generateResponse(res, 200, true, 'Review approved successfully', null);
    }

    catch (error) {
        if (error.message === 'Review not found') {
            return generateResponse(res, 404, false, 'Review not found', null);
        }

        else {
            next(error);
        }
    }
}

export const declineReview = async (req, res, next) => {
    const { id } = req.params;
    try {
        await declineReviewService(id);
        generateResponse(res, 200, true, 'Review declined successfully', null);
    }

    catch (error) {
        if (error.message === 'Review not found') {
            return generateResponse(res, 404, false, 'Review not found', null);
        }

        else {
            next(error);
        }
    }
}