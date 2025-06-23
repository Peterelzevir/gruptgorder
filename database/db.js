const mongoose = require('mongoose');
const config = require('../config');

// MongoDB connection options
const options = config.DATABASE.OPTIONS;

// Connection function
const connect = async () => {
  try {
    await mongoose.connect(config.DATABASE.URI, options);
    console.log('Connected to MongoDB database');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect function
const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB database');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  connect,
  disconnect,
  connection: mongoose.connection
};