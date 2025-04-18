// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const firebaseAdmin = require('../keys/firebase');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// OTP routes
router.post('/request-otp', otpController.requestOtp);
router.post('/resend-otp', otpController.resendOtp);
router.post('/verify-otp', otpController.verifyOtp);

// Email Verification routes
router.post('/send-verification-email', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    const link = await firebaseAdmin.auth().generateEmailVerificationLink(email);
    await otpController.sendVerificationEmail(email, link);
    res.status(200).send({ message: 'Verification email sent', link });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).send({ message: 'Error sending verification email' });
  }
});

// Route to verify the email link
router.post('/verify-email', async (req, res) => {
  const { oobCode } = req.body;

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(oobCode);
    res.status(200).send({ message: 'Email verified successfully', email: decodedToken.email });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(400).send({ message: 'Invalid or expired verification link' });
  }
});

module.exports = router;
