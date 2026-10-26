const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");

exports.createUserValidator = [
  check("username")
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 2 }).withMessage("Username too short"),

  check("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .custom(async (val) => {
      const exists = await User.findOne({ email: val });
      if (exists) throw new Error("Email already exists");
    }),

  check("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  check("confirmPassword")
    .notEmpty().withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("role").optional().isIn(["user", "admin"]),
  validatorMiddleware,
];

exports.getUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID"),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID"),

  check("username")
    .optional()
    .isLength({ min: 2 }).withMessage("Username too short"),

  check("password")
    .optional()
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  body("confirmPassword")
    .custom((value, { req }) => {
      if (req.body.password && value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("role").optional().isIn(["user", "admin"]),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID"),
  validatorMiddleware,
];

exports.softDeleteUserValidator = exports.deleteUserValidator;
