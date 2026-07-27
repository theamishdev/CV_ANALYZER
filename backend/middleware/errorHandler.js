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
