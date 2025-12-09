export const createFilter = (query = {}, role) => {
  const { search, date, lenderId, dressId, customerId } = query;

  let filter = {};

  // Text search (all roles)
  if (search) {
    filter.$or = [
      { dressName: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { colour: { $regex: search, $options: "i" } },
      { size: { $regex: search, $options: "i" } },
    ];
  }

  // Exact matches based on role
  if (role === "ADMIN") {
    if (lenderId) filter.lenderId = lenderId;
    if (customerId) filter.customerId = customerId;
    if (dressId) filter.dressId = dressId;
  } else if (role === "LENDER") {
    if (dressId) filter.dressId = dressId;
    if (customerId) filter.customerId = customerId; // only their clients
  } else if (role === "USER") {
    if (dressId) filter.dressId = dressId;
    // customerId ignored, only their own bookings
  }

  // Date filter
  if (date) {
    const _date = new Date(date);
    const startOfDay = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate());
    const endOfDay = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate() + 1);
    filter.createdAt = { $gte: startOfDay, $lt: endOfDay };
  }

  return filter;
};

export const createPaginationInfo = (page, limit, totalData) => ({
  currentPage: page,
  totalPages: Math.ceil(totalData / limit),
  totalData,
  hasNextPage: page * limit < totalData,
  hasPrevPage: page > 1,
});