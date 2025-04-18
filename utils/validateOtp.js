const otpStore = require('./otpStore');

const validateOtp = (email, otp) => {
  const record = otpStore.get(email);
  if (!record) return false;
  if (record.otp !== otp) return false;
  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return false;
  }
  otpStore.delete(email); // Remove after successful use
  return true;
};

module.exports = validateOtp;
