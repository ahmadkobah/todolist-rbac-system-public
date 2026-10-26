const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/apiError');

class TaskService {
  async createTask(taskData) {
    const userExists = await userRepository.findById(taskData.userId);
    if (!userExists) {
      throw new ApiError(404, 'User not found');
    }

    if (!taskData.status) {
      taskData.status = 'pending';
    }

    return await taskRepository.create(taskData);
  }

  async getTaskById(id) {
    return await taskRepository.findById(id);
  }

  async getTasksByUser(userId, { page, limit }) {
    const userExists = await userRepository.findById(userId);
    if (!userExists) {
      throw new ApiError(404, 'User not found');
    }

    return await taskRepository.findByUserId(userId, { page, limit });
  }

  async updateTask(id, updateData) {
    const task = await taskRepository.findById(id);
    if (!task || task.isDeleted) {
      throw new ApiError(404, 'Task not found');
    }

    if (updateData.userId) {
      throw new ApiError(400, 'Cannot reassign task to another user');
    }

    return await taskRepository.updateById(id, updateData);
  }

  async deleteTask(id) {
    const task = await taskRepository.findById(id);
    if (!task || task.isDeleted) {
      throw new ApiError(404, 'Task not found');
    }

    await taskRepository.softDeleteById(id);
  }

  async getAllTasks({ page, limit }) {
    return await taskRepository.findAll({ page, limit });
  }

  async getTasksByStatus(status, { page, limit }) {
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      throw new ApiError(400, 'Invalid status value');
    }

    return await taskRepository.findByStatus(status, { page, limit });
  }

  async countUserTasks(userId) {
    return await taskRepository.countByUser(userId);
  }

  
  async archiveTask(taskId, currentUser) {
    const task = await taskRepository.findById(taskId);
    if (!task || task.isDeleted) {
      throw new ApiError(404, 'Task not found');
    }

    
    if (
      task.userId.toString() !== currentUser._id.toString() &&
      currentUser.role !== 'admin'
    ) {
      throw new ApiError(403, 'You are not authorized to archive this task');
    }

    return await taskRepository.softDeleteById(taskId);
  }
}

module.exports = new TaskService();
