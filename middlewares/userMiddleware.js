// Apply a default filter to only fetch non-deleted users
exports.filterActiveUsers = (req, res, next) => {
  // Controllers will use req.userFilter in their queries
  req.userFilter = { isDeleted: false };
  next();
};
