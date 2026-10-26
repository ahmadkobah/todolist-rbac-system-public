// Apply a default filter to only fetch non-deleted tasks (and by userId if present)
exports.filterActiveTasks = (req, res, next) => {
  const base = { isDeleted: false };
  if (req.params.userId) {
    base.userID = req.params.userId;
  }
  req.taskFilter = base;
  next();
};

// Validate payload for creating or updating a task
exports.validateTaskPayload = (req, res, next) => {
  const { title, status, dueDate } = req.body;
  const missing = [];

  if (!title) missing.push("title");

  // If provided, status must be one of these
  const validStatuses = ["pending", "in-progress", "completed", "archived"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      status: "fail",
      message: `Invalid status: must be one of [${validStatuses.join(", ")}]`
    });
  }

  // If provided, dueDate must be a valid ISO date
  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid dueDate: must be a valid date string"
    });
  }

  if (missing.length) {
    return res.status(400).json({
      status: "fail",
      message: `Missing required fields: ${missing.join(", ")}`
    });
  }

  next();
};