// utils/otpStore.js

// In-memory OTP store (Map)
const otpMap = new Map();

/**
 * Save OTP for a given email with an expiry timestamp
 * @param {string} email - Email address to associate the OTP with
 * @param {string} otp - The OTP code
 * @param {number} expiresInMs - Expiry time in milliseconds (default: 5 minutes)
 */
const setOtp = (email, otp, expiresInMs = 5 * 60 * 1000) => {
  const expiresAt = Date.now() + expiresInMs;
  otpMap.set(email, { otp, expiresAt });
};

/**
 * Retrieve the OTP record for a given email
 * @param {string} email
 * @returns {{ otp: string, expiresAt: number } | undefined}
 */
const getOtp = (email) => {
  return otpMap.get(email);
};

/**
 * Delete the OTP record for a given email
 * @param {string} email
 */
const deleteOtp = (email) => {
  otpMap.delete(email);
};

/**
 * Periodically clean up expired OTPs every 1 minute
 */
setInterval(() => {
  const now = Date.now();
  for (const [email, { expiresAt }] of otpMap.entries()) {
    if (now > expiresAt) {
      otpMap.delete(email);
    }
  }
}, 60 * 1000); // every 1 minute

module.exports = {
  set: setOtp,
  get: getOtp,
  delete: deleteOtp,
};
