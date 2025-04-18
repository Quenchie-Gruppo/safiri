// controllers/authController.js
const admin = require('../keys/firebase');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const otpController = require('./otpController');
const validateOtp = require('../utils/validateOtp');
const jwt = require('jsonwebtoken');

// Define transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register new user (email/password)
const register = async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists. Please login or reset password.' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    const newUser = new User({
      email,
      name,
      phone,
      verified: false,
    });
    await newUser.save();

    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      text: `Please verify your email by clicking the following link: ${verificationLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      email,
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      message: 'User registration failed',
      error: error.message || 'Unknown error'
    });
  }
};

// Email verification success handler
const verifyEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    if (userRecord.emailVerified) {
      const updatedUser = await User.findOneAndUpdate(
        { email },
        { verified: true },
        { new: true }
      );
      res.status(200).json({ message: 'Email verified successfully', user: updatedUser });
    } else {
      res.status(400).json({ message: 'Email verification failed. Please check your verification link.' });
    }
  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ message: 'Error during email verification', error });
  }
};

// ✅ Updated login function with fresh user fetch
const login = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 1: Get Firebase user record (cached)
    const userRecord = await admin.auth().getUserByEmail(email);

    // ✅ Step 2: Refresh the Firebase user to ensure emailVerified is up-to-date
    const refreshedUser = await admin.auth().getUser(userRecord.uid);

    // ✅ Step 3: If Firebase says verified but Mongo doesn't, update Mongo
    if (refreshedUser.emailVerified && !user.verified) {
      await User.findOneAndUpdate(
        { email },
        { verified: true },
        { new: true }
      );
    }

    if (!refreshedUser.emailVerified) {
      return res.status(401).json({
        message: 'Account not verified. Please verify your email using the verification link.',
      });
    }

    const token = jwt.sign({ uid: refreshedUser.uid, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(400).json({ message: 'Login failed', error });
  }
};

// Send password reset email
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Failed to send password reset email', error });
  }
};

// Confirm password reset
const resetPassword = async (req, res) => {
  const { oobCode, newPassword } = req.body;

  try {
    await admin.auth().confirmPasswordReset(oobCode, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired reset code', error });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
};
