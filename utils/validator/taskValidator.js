// utils/validator/taskValidator.js
const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.createTaskValidator = [
  check("userId")
    .notEmpty().withMessage("User ID is required")
    .isMongoId().withMessage("Invalid User ID format"),

  check("title")
    .notEmpty().withMessage("Task title is required")
    .isLength({ min: 2 }).withMessage("Title must be at least 2 characters"),

  check("dueDate")
    .notEmpty().withMessage("Due date is required")
    .isISO8601().withMessage("Due date must be a valid date"),

  check("status")
    .optional()
    .isIn(["pending", "in-progress", "completed", "archived"])
    .withMessage("Invalid task status"),

  validatorMiddleware,
];

exports.getTaskValidator = [
  check("id")
    .isMongoId().withMessage("Invalid task ID format"),
  validatorMiddleware,
];

exports.updateTaskValidator = [
  check("id").isMongoId().withMessage("Invalid task ID format"),
  check("title").optional().isLength({ min: 2 }),
  check("dueDate").optional().isISO8601(),
  check("status").optional().isIn(["pending", "in-progress", "completed", "archived"]),
  validatorMiddleware,
];

exports.deleteTaskValidator = [
  check("id").isMongoId().withMessage("Invalid task ID format"),
  validatorMiddleware,
];

exports.archiveTaskValidator = exports.deleteTaskValidator;

exports.getTasksByUserValidator = [
  check("userId").isMongoId().withMessage("Invalid user ID format"),
  validatorMiddleware,
];
