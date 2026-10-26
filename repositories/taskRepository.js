// Updated taskRepository.js
const Task = require("../models/taskModel");
const ApiError = require("../utils/apiError");

class TaskRepository {
  async create(taskData) {
    try {
      return await Task.create(taskData);
    } catch (err) {
      throw new ApiError(500, "Failed to create task: " + err.message);
    }
  }

  async findById(id) {
    try {
      const task = await Task.findById(id).populate("userId", "username email");
      if (!task) {
        throw new ApiError(404, "Task not found or has been deleted.");
      }
      return task;
    } catch (err) {
      throw new ApiError(500, "Failed to retrieve task: " + err.message);
    }
  }

  async findByUserId(userId, { page = 1, limit = 10 }) {
    try {
      return await Task.find({ userId, isDeleted: false })
        .populate("userId", "username email")
        .skip((page - 1) * limit)
        .limit(limit);
    } catch (err) {
      throw new ApiError(500, "Error fetching user's tasks: " + err.message);
    }
  }

  async findAll({ page = 1, limit = 10 }) {
    try {
      return await Task.find({ isDeleted: false })
        .populate("userId", "username email")
        .skip((page - 1) * limit)
        .limit(limit);
    } catch (err) {
      throw new ApiError(500, "Error fetching all tasks: " + err.message);
    }
  }

  async updateById(id, updateData) {
    try {
      const task = await Task.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("userId", "username email");

      if (!task) {
        throw new ApiError(404, "Task not found for update.");
      }
      return task;
    } catch (err) {
      throw new ApiError(500, "Failed to update task: " + err.message);
    }
  }

  async softDeleteById(id) {
    try {
      const task = await Task.findByIdAndUpdate(
        id,
        { isDeleted: true, status: "archived" },
        { new: true }
      );
      if (!task) {
        throw new ApiError(404, "Task not found for deletion.");
      }
      return task;
    } catch (err) {
      throw new ApiError(500, "Failed to archive task: " + err.message);
    }
  }

  async restoreById(id) {
    try {
      const task = await Task.findByIdAndUpdate(
        id,
        { isDeleted: false, status: "pending" },
        { new: true }
      );
      if (!task) {
        throw new ApiError(404, "Task not found or cannot be restored.");
      }
      return task;
    } catch (err) {
      throw new ApiError(500, "Failed to restore task: " + err.message);
    }
  }

  async countByUser(userId) {
    try {
      return await Task.countDocuments({ userId, isDeleted: false });
    } catch (err) {
      throw new ApiError(500, "Failed to count user's tasks: " + err.message);
    }
  }

  async findByStatus(status, { page = 1, limit = 10 }) {
    try {
      return await Task.find({ status, isDeleted: false })
        .populate("userId", "username email")
        .skip((page - 1) * limit)
        .limit(limit);
    } catch (err) {
      throw new ApiError(500, "Failed to find tasks by status: " + err.message);
    }
  }
}

module.exports = new TaskRepository();
