import Review from "./review.model.js";

//user
export const createReviewService = async (body) => {

    const review = new Review(body);

    const savedReview = await review.save();
    return savedReview;
}

export const getAllReviewsService = async (page, limit, skip) => {

    const uniqueReviews = await Review.aggregate([
        {
            $match: { status: 'approved' } // Only approved reviews
        },
        {
            $sort: { createdAt: -1 } // Sort reviews so the latest comes first
        },
        {
            $group: {
                _id: "$userId",
                review: { $first: "$review" },
                comment: { $first: "$comment" },
                createdAt: { $first: "$createdAt" },
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                _id: 0,
                review: 1,
                comment: 1,
                createdAt: 1,
                user: {
                    _id: "$user._id",
                    firstName: "$user.firstName",
                    lastName: "$user.lastName",
                    profileImage: "$user.profileImage",
                }
            }
        }
    ]);

    return {
        data: uniqueReviews.slice(skip, skip + limit),
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(uniqueReviews.length / limit),
            totalItems: uniqueReviews.length,
            itemsPerPage: limit
        }
    }
}

//admin
export const getReviewsCountService = async () => {
    const [totalReviewsCount, approvedReviewsCount, pendingReviewsCount] = await Promise.all([
        Review.countDocuments({}),
        Review.countDocuments({ status: 'approved' }),
        Review.countDocuments({ status: 'pending' })
    ]);

    return {
        totalReviewsCount,
        approvedReviewsCount,
        pendingReviewsCount
    };
}

export const getAllPendingReviewsService = async (search, page, limit, skip) => {

    const reviews = (
        await Review
            .find({ status: 'pending' })
            .populate('userId', 'firstName lastName profileImage')
            .select('userId review comment createdAt status')
            .sort({ createdAt: -1 })
            .lean()
    )

    let filteredReviews = reviews.filter((review) => {

        const comment = review.comment.toLowerCase();
        const firstName = review.userId.firstName.toLowerCase();
        const lastName = review.userId.lastName.toLowerCase();

        const matchedSearch = search ? comment.includes(search) || firstName.includes(search) || lastName.includes(search) : true;

        return matchedSearch;
    })

    const totalItems = filteredReviews.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedReviews = filteredReviews.slice(skip, skip + limit);

    return {
        data: paginatedReviews,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
        }
    }
}

export const approveReviewService = async (reviewId) => {

    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found');

    review.status = 'approved';
    await review.save();
    return;
}

export const declineReviewService = async (reviewId) => {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) throw new Error('Review not found');
    return;
}