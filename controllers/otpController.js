// controllers/otpController.js
const transporter = require('../mailer');
const admin = require('../keys/firebase'); // Firebase Admin
const User = require('../models/User'); // Assuming you have a User model

// In-memory store for OTPs
const otpStore = new Map(); // { email: { otp, expires } }

// Generate and send OTP
const requestOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

  console.log(`Generated OTP for ${email}: ${otp}`);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP', error });
  }
};

// Resend OTP (uses the same logic as requestOtp)
const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  return requestOtp(req, res); // reuse the same logic
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ message: 'No OTP found for this email' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: 'Incorrect OTP' });
  }

  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return res.status(400).json({ message: 'OTP expired' });
  }

  otpStore.delete(email);

  try {
    // Update user in MongoDB
    const userDoc = await User.findOneAndUpdate(
      { email },
      { $set: { verified: true } },
      { new: true }
    );

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found in MongoDB' });
    }

    // Firebase user management
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch {
      user = await admin.auth().createUser({ email });
    }

    const token = await admin.auth().createCustomToken(user.uid);
    res.status(200).json({ message: 'OTP verified successfully', token });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed', error });
  }
};

// Send Verification Email
const sendVerificationEmail = async (email, verificationLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your email',
    text: `Click the following link to verify your email: ${verificationLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log('Failed to send verification email:', error);
  }
};

module.exports = {
  requestOtp,
  resendOtp,
  verifyOtp,
  sendVerificationEmail,
};
