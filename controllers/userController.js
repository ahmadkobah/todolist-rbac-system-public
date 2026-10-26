const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const userService = require("../services/userService");
const fs = require('fs');
const path = require('path');
const {uploadSingleImage} = require("../middlewares/imageMulter");



exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await userService.getAllUsers({ page, limit });
    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

//___________________________________________________________________________
//Image Upload
exports.uploadUserImage = uploadSingleImage("profileImage");
exports.resizeUserImage = async (req, res, next) => {

  console.log(req.file)

  if (req.file) {
    const uniqueSuffix = `user-${uuidv4()}.jpeg`;
    const uploadDir = path.join(__dirname, '..', 'uploads', 'user');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(path.join(uploadDir, uniqueSuffix));
    // save in DB
    req.body.profileImage = uniqueSuffix;
  }

next();

}


//___________________________________________________________________________

exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.error("Create user error:", err); // Add error logging
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body, req.user);
    res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.softDeleteUser = async (req, res, next) => {
  try {
    const user = await userService.softDeleteUser(req.params.id, req.user);
    res.status(200).json({
      message: "User soft deleted (archived)",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
