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
