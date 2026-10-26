const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


exports.signup = async (req, res, next) => {
  try {
    // Debug: log request body
    console.log("Signup request body:", req.body);

    const { username, email, password, role } = req.body;

    // Check for missing fields
    if (!username || !email || !password || !role) {
      return next(new ApiError(400, 'All fields (username, email, password, role) are required'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'Email already exists'));
    }

    
    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return next(new ApiError(400, 'Username already taken'));
    }


    // Try to create user and log result
    let user;
    try {
      user = await User.create({ username, email, password, role });
      console.log("User created:", user);
    } catch (createErr) {
      console.error("User creation error:", createErr);
      return next(new ApiError(400, createErr.message));
    }

    const token = signToken(user);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        password: user.password,
      },
    });
  } catch (err) {
    console.error('Signup Error:', err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(
        new ApiError(400, `Duplicate ${field}: ${err.keyValue[field]}`)
      );
    }

    next(new ApiError(500, err.message || 'Signup failed'));
  }
};


exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("Signin request:", email, password);

    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password'));
    }

    const user = await User.findOne({ email }).select('+password');
    console.log("User found:", user);

    if (!user) {
      console.log("User not found for email:", email);
      return next(new ApiError(401, 'Incorrect email or password'));
    }

    // Check if correctPassword method exists
    if (typeof user.correctPassword !== 'function') {
      console.error("User model is missing correctPassword method. Check your userModel.js implementation.");
      return next(new ApiError(500, 'Server misconfiguration: password comparison not implemented'));
    }

    const isMatch = await user.correctPassword(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password incorrect for user:", email);
      return next(new ApiError(401, 'Incorrect email or password'));
    }

    const token = signToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        password: user.password,
      },
    });
  } catch (err) {
    console.error('Signin Error:', err);
    next(new ApiError(500, err.message || 'Signin failed'));
  }
};


exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("No token provided in Authorization header:", authHeader);
    return next(new ApiError(401, 'No token provided'));
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err.message);
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    req.user = decoded;
    next();
  });
};


// Task 6 Forgot password


exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new ApiError(404, 'No user found with that email'));

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER, 
      pass: process.env.MAIL_PASS        
    }
  });
  const resetURL = `http://localhost:3000/api/users/resetPassword/${resetToken}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Password Reset',
    text: `Reset your password using this link: ${resetURL}`,
  });

  res.status(200).json({ message: 'Reset link sent to email' });
};

exports.resetPassword = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() } + 60 * 60 * 1000, // 1 hour
  });
  if (!user) return next(new ApiError(400, 'Token is invalid or has expired'));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password has been reset' });
};


exports.sendNewPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new ApiError(404, 'No user found with that email'));

  // Generate a random password
  const newPassword = crypto.randomBytes(8).toString('hex');
  user.password = newPassword;
  await user.save();

  // Send email with new password
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS// Useing an App Password
    }
    
  });
  await transporter.sendMail({
    to: user.email,
    subject: 'Password Reset',
    text: `Your new password: ${newPassword}`,
  });

  res.status(200).json({ message: 'New password sent to email' });
};
