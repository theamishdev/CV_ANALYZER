const validator = require('validator');

/**
 * Validates signup input data.
 * @param {object} data - The signup data.
 * @returns {object} { isValid: boolean, message: string }
 */
function validateSignup(data) {
  const { name, email, password } = data;

  if (!name || typeof name !== 'string' || validator.isEmpty(name.trim())) {
    return { isValid: false, message: 'Full Name is required.' };
  }

  if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }

  const passwordResult = validatePasswordStrength(password);
  if (!passwordResult.isValid) {
    return passwordResult;
  }

  return { isValid: true, message: '' };
}

/**
 * Validates login input data.
 * @param {object} data - The login data.
 * @returns {object} { isValid: boolean, message: string }
 */
function validateLogin(data) {
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }

  if (!password || typeof password !== 'string' || validator.isEmpty(password)) {
    return { isValid: false, message: 'Password is required.' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validates password strength rules:
 * - Minimum 8 characters
 * - Must contain uppercase
 * - Must contain lowercase
 * - Must contain number
 * - Must contain special character
 * @param {string} password 
 * @returns {object} { isValid: boolean, message: string }
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password must be a valid string.' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\/`~#]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, number and special character.'
    };
  }

  return { isValid: true, message: '' };
}

module.exports = {
  validateSignup,
  validateLogin,
  validatePasswordStrength
};
