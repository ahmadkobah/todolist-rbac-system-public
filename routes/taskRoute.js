const express = require("express");

const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  archiveTask,
  deleteTask,
  getTasksByUser
} = require("../controllers/taskController");

const {
  createTaskValidator,
  getTaskValidator,
  updateTaskValidator,
  deleteTaskValidator,
  archiveTaskValidator,
  getTasksByUserValidator
} = require("../utils/validator/taskValidator");

const { protect, authorize } = require("../middlewares/authMiddleware");
const { Admin } = require("mongodb");

const router = express.Router();

// 🔐 All routes below require authentication
router.use(protect);

// Create a task
router.post("/", createTaskValidator, createTask);

// Get all tasks

router.get("/", protect,authorize("admin"),getAllTasks);

// Get all tasks for a specific user
router.get("/user/:userId", getTasksByUserValidator, getTasksByUser);

// Get a specific task by ID
router.get("/:id", getTaskValidator, getTaskById);

// Update a task
router.put("/:id", authorize("user", "admin"), updateTaskValidator, updateTask);

// Archive (soft delete) a task — only task owner or admin allowed (handled in service)
router.patch("/:id/deactivate", authorize("user", "admin"), archiveTaskValidator, archiveTask);

// Hard delete a task — 🔐 admin only
router.delete("/:id", authorize("user", "admin"), deleteTaskValidator, deleteTask);



module.exports = router;



