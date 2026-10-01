const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');

async function connectDatabase() {
  if (!mongoUri) throw new Error('MONGODB_URI is required.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('[Database] MongoDB connected.');
}

module.exports = { connectDatabase };
