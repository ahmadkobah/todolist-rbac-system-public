// controllers/taskController.js
const taskService = require("../services/taskService");
const Task = require('../models/taskModel'); // oder taskService, falls dort .find() existiert
const ApiFilter = require('../utils/apiFilter');

exports.createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    const filter = new ApiFilter(Task.find(), req.query)
      .filter()
      .sort()
      .fields()
      .page();

    const tasks = await filter.query;

    res.status(200).json({
      message: "success",
      length: tasks.length,
      data: tasks,
    });
  } catch (err) {
    console.error("Get Tasks Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json({
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const updatedTask = await taskService.updateTask(req.params.id, req.body);
    res.status(200).json({
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

exports.archiveTask = async (req, res, next) => {
  try {
    const task = await taskService.archiveTask(req.params.id, req.user);
    res.status(200).json({
      message: "Task archived successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id);
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};

exports.getTasksByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const tasks = await taskService.getTasksByUser(req.params.userId, { page, limit });
    res.status(200).json({
      message: "Tasks fetched successfully",
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};


  exports.getTasksByTitle = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const tasks = await taskService.findTasksByTitle(req.query.title, { page, limit });
    res.status(200).json({
      message: "Tasks fetched successfully",
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};