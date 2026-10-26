const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');

class UserService {
  async createUser(userData) {
    if (await userRepository.emailExists(userData.email)) {
      throw new ApiError(400, 'Email already in use');
    }

    if (await userRepository.usernameExists(userData.username)) {
      throw new ApiError(400, 'Username already taken');
    }

    // add validation or hashing here if needed
    return await User.create(userData);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async updateUser(id, updateData, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    if (user._id.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to update this user');
    }

    if (updateData.email) {
      throw new ApiError(400, 'Email cannot be changed');
    }

    return await userRepository.updateById(id, updateData);
  }

  async softDeleteUser(id, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    if (user._id.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to archive this user');
    }

    return await userRepository.updateById(id, { isDeleted: true });
  }

  async deleteUser(id, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    if (user._id.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to delete this user');
    }

    await userRepository.deleteById(id);
  }

  async getAllUsers({ page, limit }) {
    return await userRepository.findAll({ page, limit });
  }

  async getUserByEmail(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}

module.exports = new UserService();
