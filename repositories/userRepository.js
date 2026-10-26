const User = require("../models/userModel");

class UserRepository {
  // Create a new user
  async create(userData) {
    return await User.create(userData);
  }

  // Find user by ID (excluding deleted users)
  async findById(id) {
    return await User.findOne({ _id: id, isDeleted: false })
      .select('-password -__v');
  }

  // Find user by email (used for login, so include password)
  async findByEmail(email) {
    return await User.findOne({ email, isDeleted: false })
      .select('+password');
  }

  // Get all users with pagination (exclude soft-deleted)
  async findAll({ page = 1, limit = 10 }) {
    return await User.find({ isDeleted: false })
      .select('-password -__v')
      .skip((page - 1) * limit)
      .limit(limit);
  }

  // Update user by ID (soft-delete aware)
  async updateById(id, updateData, allowDeleted = false) {
    const query = { _id: id };
    if (!allowDeleted) query.isDeleted = false;

    return await User.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    }).select('-password -__v');
  }

  // Soft delete user
  async softDeleteById(id) {
    return await User.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    ).select('-password -__v');
  }

  // Hard delete user
  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  // Check if username exists (for uniqueness validation)
  async usernameExists(username) {
    return await User.exists({ username, isDeleted: false });
  }

  // Check if email exists (for uniqueness validation)
  async emailExists(email) {
    return await User.exists({ email, isDeleted: false });
  }
}

module.exports = new UserRepository();
