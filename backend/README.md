# 📁 CV Analyzer - Backend Section Documentation

This documentation provides a line-by-line explanation of every backend file in the project. The backend is built using **Node.js**, **Express**, **bcryptjs** (for password security), and **validator** (for email verification), structured modularly to separate server instantiation, application configuration, routing, request validation, logic execution, and global error handling.

---

## 🛠️ Table of Contents
- [server.js](#-serverjs)
- [app.js](#-appjs)
- [routes/authRoutes.js](#-routesauthroutesjs)
- [controllers/authController.js](#-controllersauthcontrollerjs)
- [middleware/errorHandler.js](#-middlewareerrorhandlerjs)
- [utils/validation.js](#-utilsvalidationjs)
- [package.json](#-packagejson)

---

## 🚀 server.js

The `server.js` file is the entry point of the backend application. It configures the environment variables, imports the Express app, starts the HTTP server, and registers global handler processes for handling unhandled exceptions.

```javascript
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = serverStart();

function serverStart() {
  return app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` CV Analyzer Backend running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(` Server is listening on port: ${PORT}`);
    console.log(` CORS Origin allowed: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`);
    console.log(`=============================================`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
```

### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `require('dotenv').config();` | Loads key-value environment variables from the `.env` file into `process.env`. |
| **2** | `const app = require('./app');` | Imports the configured Express application instance from `app.js`. |
| **3** | *(empty)* | Left blank for readability. |
| **4** | `const PORT = process.env.PORT \|\| 3000;` | Evaluates the port to listen on, retrieving `PORT` from environment configuration or defaulting to `3000`. |
| **5** | *(empty)* | Left blank for readability. |
| **6** | `const server = serverStart();` | Calls `serverStart()` and stores the returned server instance object to control its lifecycle. |
| **7** | *(empty)* | Left blank for readability. |
| **8** | `function serverStart() {` | Declares the helper function `serverStart` responsible for spinning up the server. |
| **9** | `  return app.listen(PORT, () => {` | Binds the Express application to listen on `PORT`, initiating the HTTP server. |
| **10** | `    console.log("=============================================");` | Prints a top boundary log decorator. |
| **11** | `    console.log(` CV Analyzer Backend running in ${process.env.NODE_ENV \|\| 'development'} mode`);` | Logs the active environment mode (e.g., development, staging, production). |
| **12** | `    console.log(` Server is listening on port: ${PORT}`);` | Logs the dynamic port where incoming traffic is being parsed. |
| **13** | `    console.log(` CORS Origin allowed: ${process.env.CORS_ORIGIN \|\| 'http://localhost:4200'}`);` | Logs the permitted frontend host allowed to query the API. |
| **14** | `    console.log("=============================================");` | Prints a bottom boundary log decorator. |
| **15** | `  });` | Closes the server configuration callback function logic. |
| **16** | `}` | Closes the `serverStart` function body. |
| **17** | *(empty)* | Left blank for readability. |
| **18** | `// Handle unhandled promise rejections` | Developer documentation explaining how global async errors are caught. |
| **19** | `process.on('unhandledRejection', (err, promise) => {` | Adds a listener on the Node.js runtime process targeting unhandled asynchronous promise rejections. |
| **20** | `  console.error(`Unhandled Rejection Error: ${err.message}`);` | Logs the unhandled exception error message. |
| **21** | `  // Close server & exit process` | Explains the action taken to gracefully shutdown the server to prevent memory leaks. |
| **22** | `  if (server) {` | Evaluates if the server was successfully instantiated prior to the rejection event. |
| **23** | `    server.close(() => process.exit(1));` | Gracefully closes the connection socket listener, then executes a hard exit of the process with status code `1` (abnormal exit). |
| **24** | `  } else {` | Execution branch when server object does not exist. |
| **25** | `    process.exit(1);` | Exits the process immediately with status code `1`. |
| **26** | `  }` | Closes the conditional server validation statement. |
| **27** | `});` | Closes the global event listener logic. |

---

## 🚀 app.js

The `app.js` file handles the configuration of the Express application instance, initializing CORS, JSON parsing, custom request logging, base route handlers, and error catching middlewares.

```javascript
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configure CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
```

### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `const express = require('express');` | Imports the core Express framework. |
| **2** | `const cors = require('cors');` | Imports the Cross-Origin Resource Sharing (CORS) security wrapper. |
| **3** | `const authRoutes = require('./routes/authRoutes');` | Imports authentication route configurations. |
| **4** | `const errorHandler = require('./middleware/errorHandler');` | Imports the custom global error catching middleware function. |
| **5** | *(empty)* | Left blank for readability. |
| **6** | `const app = express();` | Instantiates a new Express application object. |
| **7** | *(empty)* | Left blank for readability. |
| **8** | `// Request logger middleware` | Describes request instrumentation. |
| **9** | `app.use((req, res, next) => {` | Registers a custom callback execution block executed on every API hit. |
| **10** | `  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);` | Outputs request details: current date-time string, HTTP verb (POST/GET/etc), and endpoint URI. |
| **11** | `  next();` | Yields logic flow control to the next sequential middleware or route processor. |
| **12** | `});` | Closes logger middleware. |
| **13** | *(empty)* | Left blank for readability. |
| **14** | `// Configure CORS` | Explains CORS security setting targets. |
| **15** | `const corsOrigin = process.env.CORS_ORIGIN \|\| 'http://localhost:4200';` | Retreives allowed client origin or falls back to Angular’s default port of `4200`. |
| **16** | `app.use(cors({` | Registers standard CORS configuration into the request pipeline. |
| **17** | `  origin: corsOrigin,` | Locks requests down to accept requests only from the specified client origin address. |
| **18** | `  credentials: true` | Grants browser clients permission to pass cookie payloads and auth credentials. |
| **19** | `}));` | Closes CORS configuration middleware block. |
| **20** | *(empty)* | Left blank for readability. |
| **21** | `// Body parsing middleware` | Describes payload decoder steps. |
| **22** | `app.use(express.json());` | Parses incoming request JSON payloads (making structured payloads accessible via `req.body`). |
| **23** | `app.use(express.urlencoded({ extended: true }));` | Decodes URL-encoded forms with the query-string library to handle nested parameters. |
| **24** | *(empty)* | Left blank for readability. |
| **25** | `// API Routes` | Explains the mounting point of standard API routes. |
| **26** | `app.use('/api/auth', authRoutes);` | Directs all calls starting with `/api/auth` to be resolved using `authRoutes.js`. |
| **27** | *(empty)* | Left blank for readability. |
| **28** | `// Base route for health check` | Explains the health-monitoring endpoint. |
| **29** | `app.get('/health', (req, res) => {` | Creates a simple health-check API endpoint under `/health`. |
| **30** | `  res.status(200).json({ status: 'ok', timestamp: new Date() });` | Responds with standard OK code `200` alongside server timestamp indicator. |
| **31** | `});` | Closes health-check API route. |
| **32** | *(empty)* | Left blank for readability. |
| **33** | `// 404 Route handler` | Explains how unmapped endpoint paths are safely reported back. |
| **34** | `app.use((req, res, next) => {` | Registers standard wildcard fallback router interceptor. |
| **35** | `  res.status(404).json({ success: false, message: 'Resource not found' });` | Responds with `404` status code and JSON failure description. |
| **36** | `});` | Closes 404 fallback routing. |
| **37** | *(empty)* | Left blank for readability. |
| **38** | `// Error handling middleware` | Explains the global error fallback setup. |
| **39** | `app.use(errorHandler);` | Registers final system catch-all error handling middleware (registered at end of chain). |
| **40** | *(empty)* | Left blank for readability. |
| **41** | `module.exports = app;` | Exports Express application config instance block for use inside `server.js`. |

---

## 🚀 routes/authRoutes.js

This file holds route rules defining available operations for the authentication endpoint section, mapping them to explicit controller functions.

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
```

### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `const express = require('express');` | Imports Express logic components. |
| **2** | `const router = express.Router();` | Instantiates a Router object used to group related path operations. |
| **3** | `const authController = require('../controllers/authController');` | Imports target authentication controller handlers. |
| **4** | *(empty)* | Left blank for readability. |
| **5** | `// POST /api/auth/signup` | Documents that the subsequent line represents the API user registration path. |
| **6** | `router.post('/signup', authController.signup);` | Registers HTTP POST method path handler on `/signup` forwarding it to `authController.signup`. |
| **7** | *(empty)* | Left blank for readability. |
| **8** | `// POST /api/auth/login` | Documents that the subsequent line represents the API user login path. |
| **9** | `router.post('/login', authController.login);` | Registers HTTP POST method path handler on `/login` forwarding it to `authController.login`. |
| **10** | *(empty)* | Left blank for readability. |
| **11** | `module.exports = router;` | Exports router object container to expose paths externally. |

---

## 🚀 controllers/authController.js

This file houses execution logic for account registration (`signup`) and identification validation (`login`), maintaining temporary data state in an in-memory array `users` instead of an active persistent database.

```javascript
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
```

### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `const bcrypt = require('bcryptjs');` | Imports bcryptjs library used to secure user credentials by hashing passwords. |
| **2** | `const { validateSignup, validateLogin } = require('../utils/validation');` | Imports validation logic validators from the local validation module. |
| **3** | *(empty)* | Left blank for readability. |
| **4** | `// Temporary in-memory storage for registered users` | Explains that data persistence is simulated using memory structure runtime arrays. |
| **5** | `const users = [];` | Declares variable array `users` storing user accounts during app execution. |
| **6** | *(empty)* | Left blank for readability. |
| **7-10**| `/** ... */` | JSDoc comments representing endpoint description mapping documentation. |
| **11**| `async function signup(req, res) {` | Declares asynchronous handler processing client registration requests. |
| **12**| `  try {` | Initiates try execution wrapper to isolate code issues. |
| **13**| `    // 1. Validate data` | Describes registration step 1. |
| **14**| `    const validation = validateSignup(req.body);` | Validates registration properties inside `req.body` using the custom helper. |
| **15**| `    if (!validation.isValid) {` | Evaluates if credentials structural check returned false. |
| **16**| `      return res.status(400).json({` | Stops execution sending HTTP `400` Bad Request error. |
| **17**| `        success: false,` | Returns failed state indicators. |
| **18**| `        message: validation.message` | Attaches the validation error reason. |
| **19**| `      });` | Ends response container. |
| **20**| `    }` | Closes verification failure block. |
| **21**| *(empty)* | Left blank for readability. |
| **22**| `    const { name, email, password } = req.body;` | Extracts parameters `name`, `email`, and `password` from the incoming request body. |
| **23**| `    const normalizedEmail = email.toLowerCase().trim();` | Standardizes email layout: lowercases letters and trims space margins to avoid registration duplicates. |
| **24**| *(empty)* | Left blank for readability. |
| **25**| `    // 2. Check duplicate email` | Describes step 2 checking for pre-existing registered users. |
| **26**| `    const duplicateUser = users.find(u => u.email === normalizedEmail);` | Scans the `users` array looking for a match against the normalized email input. |
| **27**| `    if (duplicateUser) {` | Evaluates if a matching user was already registered. |
| **28**| `      return res.status(400).json({` | Interrupts and returns HTTP `400` status indicator code. |
| **29**| `        success: false,` | Returns failure success flag. |
| **30**| `        message: 'Email is already registered.'` | Returns descriptive error message. |
| **31**| `      });` | Closes network return response payload. |
| **32**| `    }` | Closes duplication check conditional logic. |
| **33**| *(empty)* | Left blank for readability. |
| **34**| `    // 3. Hash password (salt round = 10)` | Describes step 3 protecting plain-text credentials. |
| **35**| `    const salt = await bcrypt.genSalt(10);` | Generates salt hash helper using a complexity factor of 10 rounds. |
| **36**| `    const hashedPassword = await bcrypt.hash(password, salt);` | Cryptographically hashes user password utilizing generated salt parameter. |
| **37**| *(empty)* | Left blank for readability. |
| **38**| `    // 4. Store user in array` | Describes step 4 persistence operations. |
| **39**| `    const newUser = {` | Creates a new user record object block. |
| **40**| `      id: Date.now().toString(),` | Implements user identifier utilising current execution timestamp convertable to string. |
| **41**| `      name: name.trim(),` | Trims empty whitespace bounds from register name input field. |
| **42**| `      email: normalizedEmail,` | Sets account validation email mapping. |
| **43**| `      password: hashedPassword,` | Maps the newly secure hashed password string. |
| **44**| `      createdAt: new Date()` | Appends standard user registration timestamp. |
| **45**| `    };` | Closes new user payload declaration. |
| **46**| `    users.push(newUser);` | Appends user record data object onto database proxy `users` list. |
| **47**| *(empty)* | Left blank for readability. |
| **48**| `    // 5. Return success` | Describes final step reporting action success. |
| **49**| `    return res.status(201).json({` | Delivers successful HTTP response with state code `201` (Created). |
| **50**| `      success: true,` | Communicates success state is true. |
| **51**| `      message: 'Account created successfully'` | Delivers confirmation success message details. |
| **52**| `    });` | Closes return response data array block. |
| **53**| `  } catch (error) {` | Catch block managing application runtime errors. |
| **54**| `    console.error('Signup error:', error);` | Logs unexpected signup exception stack details into terminal dashboard logs. |
| **55**| `    return res.status(500).json({` | Responds with standard Server error code `500`. |
| **56**| `      success: false,` | Confirms action state evaluates to false. |
| **57**| `      message: 'Internal server error during registration.'` | Safely hides raw execution error metrics displaying user-friendly generic feedback. |
| **58**| `    });` | Closes HTTP return block. |
| **59**| `  }` | Closes execution validation block. |
| **60**| `}` | Closes `signup` function definition. |
| **61**| *(empty)* | Left blank for readability. |
| **62-65**| `/** ... */` | JSDoc comments representing login description documentation. |
| **66**| `async function login(req, res) {` | Declares login handling execution function structure. |
| **67**| `  try {` | Starts try isolation block. |
| **68**| `    // 1. Validate data` | Describes input validation step. |
| **69**| `    const validation = validateLogin(req.body);` | Evaluates login structure variables inside `req.body` using the custom helper. |
| **70**| `    if (!validation.isValid) {` | Evaluates if check failed logic validation steps. |
| **71**| `      return res.status(400).json({` | Terminates routine returning HTTP Bad Request `400` status. |
| **72**| `        success: false,` | Returns failure indicators. |
| **73**| `        message: validation.message` | Includes error descriptions. |
| **74**| `      });` | Closes response container payload. |
| **75**| `    }` | Closes login validation status block. |
| **76**| *(empty)* | Left blank for readability. |
| **77**| `    const { email, password } = req.body;` | Destructures input credentials from request body payload. |
| **78**| `    const normalizedEmail = email.toLowerCase().trim();` | standardizes logging client credentials formatting patterns. |
| **79**| *(empty)* | Left blank for readability. |
| **80**| `    // 2. Find user` | Explains matching profile detection operations. |
| **81**| `    const user = users.find(u => u.email === normalizedEmail);` | Scans array to retrieve user with matching email address. |
| **82**| `    if (!user) {` | Condition checking whether email match lookup failed. |
| **83**| `      return res.status(401).json({` | Stops flow returning HTTP `401` (Unauthorized) status. |
| **84**| `        success: false,` | Sets success structure parameters to false. |
| **85**| `        message: 'Invalid Email or Password'` | Safe validation error response (generic to avoid user enumeration vulnerability). |
| **86**| `      });` | Closes API response flow container. |
| **87**| `    }` | Closes email matching check statement block. |
| **88**| *(empty)* | Left blank for readability. |
| **89**| `    // 3. Compare hashed password` | Comments explaining secure password comparison operation. |
| **90**| `    const isPasswordValid = await bcrypt.compare(password, user.password);` | Uses bcryptjs helper to verify if input matches secure stored database string. |
| **91**| `    if (!isPasswordValid) {` | Evaluates if matching operation was invalidated. |
| **92**| `      return res.status(401).json({` | Ends login routine returning HTTP `401` Unauthorized status. |
| **93**| `        success: false,` | Confirms action state evaluates to false. |
| **94**| `        message: 'Invalid Email or Password'` | Delivers identical generic security warning message. |
| **95**| `      });` | Ends response process. |
| **96**| `    }` | Closes password verification conditional check block. |
| **97**| *(empty)* | Left blank for readability. |
| **98**| `    // 4. Return success` | Comments explaining standard authentication landing resolution. |
| **99**| `    return res.status(200).json({` | Returns HTTP `200` success code wrapper to client. |
| **100**| `      success: true,` | Sets success parameters to true. |
| **101**| `      message: 'Login Successful',` | Returns execution status message description. |
| **102**| `      user: {` | Attaches details of authenticated user profile. |
| **103**| `        id: user.id,` | Supplies profile identifier. |
| **104**| `        name: user.name,` | Supplies profile registration name. |
| **105**| `        email: user.email` | Supplies profile verified contact email. |
| **106**| `      }` | Closes user profile details object payload. |
| **107**| `    });` | Ends HTTP success return block. |
| **108**| `  } catch (error) {` | Catches exceptions that occurred during function execution. |
| **109**| `    console.error('Login error:', error);` | Prints exact authentication log issues directly in backend server logs. |
| **110**| `    return res.status(500).json({` | Responds with standard HTTP `500` server exception failure code. |
| **111**| `      success: false,` | Confirms action state evaluates to false. |
| **112**| `      message: 'Internal server error during login.'` | Delivers generic endpoint error message payload. |
| **113**| `    });` | Closes login response. |
| **114**| `  }` | Closes try catch blocks wrapper. |
| **115**| `}` | Closes `login` handler function execution body. |
| **116**| *(empty)* | Left blank for readability. |
| **117**| `module.exports = {` | Opens export namespace options listing. |
| **118**| `  signup,` | Maps `signup` controller handler. |
| **119**| `  login` | Maps `login` controller handler. |
| **120**| `};` | Closes module exports specification. |

---

## 🚀 middleware/errorHandler.js

This middleware serves as the global centralized error handler for the Express application. Any runtime error passed to the `next(err)` chain is handled here.

```javascript
/**
 * Express global error handling middleware.
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err.stack || err);
  
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
```

### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1-3** | `/** ... */` | JSDoc explaining that the script acts as the global error interception middleware. |
| **4** | `function errorHandler(err, req, res, next) {` | Defines the error middleware signature accepting four parameters (`err`, `req`, `res`, `next`). |
| **5** | `  console.error('Unhandled Error:', err.stack \|\| err);` | Outputs the unhandled error's stack trace to stderr logs. |
| **6** | *(empty)* | Left blank for readability. |
| **7** | `  const statusCode = err.status \|\| 500;` | Evaluates HTTP status code, defaulting to `500` (Internal Server Error) if undefined. |
| **8** | `  return res.status(statusCode).json({` | Sends the HTTP error status code with a JSON payload response. |
| **9** | `    success: false,` | Standardizes structure confirming process completed unsuccessfully. |
| **10** | `    message: err.message \|\| 'Internal Server Error'` | Sends the error message or falls back to 'Internal Server Error'. |
| **11** | `  });` | Closes API response construction. |
| **12** | `}` | Closes `errorHandler` middleware function logic. |
| **13** | *(empty)* | Left blank for readability. |
| **14** | `module.exports = errorHandler;` | Exports the handler component to be loaded inside `app.js`. |

---

## 🚀 utils/validation.js

This file houses helper scripts checking string lengths and format criteria during registrations or login activities.

```javascript
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
```

### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `const validator = require('validator');` | Imports the validator module used to simplify pattern verification on inputs. |
| **2** | *(empty)* | Left blank for readability. |
| **3-7** | `/** ... */` | JSDoc explaining parameters and returned structure of `validateSignup`. |
| **8** | `function validateSignup(data) {` | Declares the signup validator function. |
| **9** | `  const { name, email, password } = data;` | Destructures fields from the argument `data` payload. |
| **10** | *(empty)* | Left blank for readability. |
| **11** | `  if (!name \|\| typeof name !== 'string' \|\| validator.isEmpty(name.trim())) {` | Checks if `name` is missing, is not a string, or contains only whitespace. |
| **12** | `    return { isValid: false, message: 'Full Name is required.' };` | Returns validation failure configuration object. |
| **13** | `  }` | Closes conditional name validation. |
| **14** | *(empty)* | Left blank for readability. |
| **15** | `  if (!email \|\| typeof email !== 'string' \|\| !validator.isEmail(email)) {` | Checks if `email` is empty, is not a string, or fails email formatting checks. |
| **16** | `    return { isValid: false, message: 'Please enter a valid email address.' };` | Returns validation failure configuration object. |
| **17** | `  }` | Closes conditional email verification block. |
| **18** | *(empty)* | Left blank for readability. |
| **19** | `  const passwordResult = validatePasswordStrength(password);` | Delegates password validation checks to the `validatePasswordStrength` helper. |
| **20** | `  if (!passwordResult.isValid) {` | Checks if the password failed complexity rules. |
| **21** | `    return passwordResult;` | Forwards the password error object back to the controller. |
| **22** | `  }` | Closes password check validation code block. |
| **23** | *(empty)* | Left blank for readability. |
| **24** | `  return { isValid: true, message: '' };` | Returns successful validation confirmation status. |
| **25** | `}` | Closes `validateSignup` logic function block. |
| **26** | *(empty)* | Left blank for readability. |
| **27-31** | `/** ... */` | JSDoc explaining parameters and returned structure of `validateLogin`. |
| **32** | `function validateLogin(data) {` | Declares login parameters validator. |
| **33** | `  const { email, password } = data;` | Destructures `email` and `password` properties. |
| **34** | *(empty)* | Left blank for readability. |
| **35** | `  if (!email \|\| typeof email !== 'string' \|\| !validator.isEmail(email)) {` | Ensures login email parameter matches correct format. |
| **36** | `    return { isValid: false, message: 'Please enter a valid email address.' };` | Returns validation failure description state. |
| **37** | `  }` | Closes email field checker. |
| **38** | *(empty)* | Left blank for readability. |
| **39** | `  if (!password \|\| typeof password !== 'string' \|\| validator.isEmpty(password)) {` | Ensures password input exists and is a non-empty string. |
| **40** | `    return { isValid: false, message: 'Password is required.' };` | Returns validation failure config object. |
| **41** | `  }` | Closes password validator logic checks block. |
| **42** | *(empty)* | Left blank for readability. |
| **43** | `  return { isValid: true, message: '' };` | Confirms credentials format structure is valid. |
| **44** | `}` | Closes `validateLogin` helper function body. |
| **45** | *(empty)* | Left blank for readability. |
| **46-55** | `/** ... */` | JSDoc listing all complex password strength rules applied to new user creations. |
| **56** | `function validatePasswordStrength(password) {` | Declares password metric verification checks function. |
| **57** | `  if (!password \|\| typeof password !== 'string') {` | Validates value is defined and belongs to standard string format. |
| **58** | `    return { isValid: false, message: 'Password must be a valid string.' };` | Returns type error configuration object. |
| **59** | `  }` | Closes null validation blocks. |
| **60** | *(empty)* | Left blank for readability. |
| **61** | `  if (password.length < 8) {` | Requires password length to contain at least 8 characters. |
| **62** | `    return { isValid: false, message: 'Password must be at least 8 characters long.' };` | Returns minimum length error metadata config object. |
| **63** | `  }` | Closes length verification criteria check. |
| **64** | *(empty)* | Left blank for readability. |
| **65** | `  const hasUppercase = /[A-Z]/.test(password);` | Regex validating presence of at least one uppercase letter (A-Z). |
| **66** | `  const hasLowercase = /[a-z]/.test(password);` | Regex validating presence of at least one lowercase letter (a-z). |
| **67** | `  const hasNumber = /[0-9]/.test(password);` | Regex validating presence of at least one numerical digit (0-9). |
| **68** | `  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\/\`~#]/.test(password);` | Regex validating presence of at least one special character symbol. |
| **69** | *(empty)* | Left blank for readability. |
| **70** | `  if (!hasUppercase \|\| !hasLowercase \|\| !hasNumber \|\| !hasSpecial) {` | Checks if password does not satisfy all complexity metrics. |
| **71** | `    return {` | Returns failed validation result container. |
| **72** | `      isValid: false,` | Confirms status evaluations are failed. |
| **73** | `      message: 'Password must contain uppercase, lowercase, number and special character.'` | Explains specific complexity requirement details. |
| **74** | `    };` | Ends validation metadata package. |
| **75** | `  }` | Closes conditional complexity check. |
| **76** | *(empty)* | Left blank for readability. |
| **77** | `  return { isValid: true, message: '' };` | Returns success indicator status when all checks pass. |
| **78** | `}` | Closes password validation function body. |
| **79** | *(empty)* | Left blank for readability. |
| **80** | `module.exports = {` | Opens export block namespace configuration list. |
| **81** | `  validateSignup,` | Exports `validateSignup` function. |
| **82** | `  validateLogin,` | Exports `validateLogin` function. |
| **83** | `  validatePasswordStrength` | Exports `validatePasswordStrength` function. |
| **84** | `};` | Closes export options block list. |

---

## 🚀 package.json

This file tracks dependencies, metadata description patterns, and NPM command execution options configuration.

```json
{
  "name": "cv-analyzer-backend",
  "version": "1.0.0",
  "description": "Authentication backend for CV Analyzer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "validator": "^13.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  },
  "private": true
}
```

### Line-by-Line Explanation

| Line No. | Description |
| :--- | :--- |
| **1** | Opens package setup definitions structure. |
| **2** | Sets project name property ID to `cv-analyzer-backend`. |
| **3** | Sets current code bundle development version version to `1.0.0`. |
| **4** | Outlines short summary task description metadata values. |
| **5** | Declares standard execution entrance file to run (`server.js`). |
| **6** | Opens script operations map. |
| **7** | Maps `"start"` script command to run production server using Node (`node server.js`). |
| **8** | Maps `"dev"` script command to launch server tracking changes automatically using nodemon (`nodemon server.js`). |
| **9** | Closes script operations map. |
| **10** | Opens runtime production dependency list. |
| **11** | Installs `bcryptjs` dependency for secure hashing algorithms. |
| **12** | Installs `cors` dependency to configure cross-origin networking allowances. |
| **13** | Installs `dotenv` utility to resolve local environment configurations. |
| **14** | Installs `express` web app structure configuration frameworks. |
| **15** | Installs `validator` text data verification package. |
| **16** | Closes runtime production dependency lists. |
| **17** | Opens development tools dependency mappings. |
| **18** | Installs `nodemon` tool to reload the server script file instances on modification saves. |
| **19** | Closes development dependency list configurations. |
| **20** | Confirms code workspace is private (prevents publishing to public repositories). |
| **21** | Closes package config definitions file structure. |
