require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_analyzer';

let server;

// Connect to MongoDB and start Express server
mongoose.connect(DB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    serverStart();
  })
  .catch((err) => {
    console.error('MongoDB database connection error:', err.message);
    console.error('Please ensure MongoDB is running on your machine.');
    process.exit(1);
  });

function serverStart() {
  server = app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` CV Analyzer Backend running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(` Server is listening on port: ${PORT}`);
    console.log(` CORS Origin allowed: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`);
    console.log(`=============================================`);
    
    // Initialize Telegram Bot
    const telegramBotService = require('./services/telegramBotService');
    telegramBotService.initBot();
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  
  if (err.message && err.message.includes('fetch failed')) {
      console.error('Ignoring Telegram fetch failure to keep server alive.');
      return;
  }
  
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
