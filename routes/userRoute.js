const express = require("express");
const {
  createUser,
  updateUser,
  getAllUsers,
  getUserById,
  softDeleteUser,
  deleteUser,
  uploadUserImage,
  resizeUserImage  
} = require("../controllers/userController");
const {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  softDeleteUserValidator
} = require("../utils/validator/userValidator");

const { filterActiveUsers } = require("../middlewares/userMiddleware");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { verifyToken } = require("../controllers/authController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(filterActiveUsers);

//___________________________________________________________________________
 // Profile Image

router.post(
  "/",
  uploadUserImage, 
  resizeUserImage,
  createUser
);

//___________________________________________________________________________

// Public signup route (must be before protect)
router.post("/signup", authController.signup);

// Public create route (must be before protect)
router.post("/", createUserValidator, createUser);

// Public forgot password route
router.post("/forgotPassword", authController.forgotPassword);

// Public reset password route
router.post("/resetPassword/:token", authController.resetPassword);

// Public send new password route
router.post("/sendNewPassword", authController.sendNewPassword);

// Protect all routes below
router.use(protect);

// Get all users
router.get("/", getAllUsers);

// Get single user
router.get("/:id", getUserValidator, getUserById);

// Update user (only self or admin)
router.put("/:id", authorize("user", "admin"), updateUserValidator, updateUser);

// Soft delete (deactivate)
router.patch("/:id/deactivate", authorize("user", "admin"), softDeleteUserValidator, softDeleteUser);

// Hard delete
router.delete("/:id", authorize("user", "admin"), deleteUserValidator, deleteUser);

// Route for uploading and resizing user image (example for update)
router.put("/:id/profile-image",uploadUserImage,resizeUserImage,updateUser);

module.exports = router;
