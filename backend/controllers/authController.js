const bcrypt = require('bcryptjs');
const { validateSignup, validateLogin } = require('../utils/validation');

// Temporary in-memory storage for registered users
const users = [];

/**
 * Handle user signup request.
 * POST /api/auth/signup
 */
async function signup(req, res) {
  try {
    // 1. Validate data
    const validation = validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check duplicate email
    const duplicateUser = users.find(u => u.email === normalizedEmail);
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.'
      });
    }

    // 3. Hash password (salt round = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Store user in array
    const newUser = {
      id: Date.now().toString(), // Simple string ID
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date()
    };
    users.push(newUser);

    // 5. Return success
    return res.status(201).json({
      success: true,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
}

/**
 * Handle user login request.
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    // 1. Validate data
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user
    const user = users.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Email or Password'
      });
    }

    // 3. Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Email or Password'
      });
    }

    // 4. Return success
    return res.status(200).json({
      success: true,
      message: 'Login Successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
}

module.exports = {
  signup,
  login
};
