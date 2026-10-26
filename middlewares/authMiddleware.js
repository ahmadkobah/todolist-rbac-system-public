// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");

// Authentication
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "You are not logged in");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = currentUser; // Attach the user to the request
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

// Authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `You do not have permission to perform this action`)
      );
    }
    next();
  };
};


//service controller route 