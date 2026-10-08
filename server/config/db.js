const mongoose = require('mongoose');

const connectDB = async () => {
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/prernanode';
  const getConnectOptions = () => ({
    serverSelectionTimeoutMS: 5000,
  });

  const tryConnect = async (uri) => {
    return mongoose.connect(uri, getConnectOptions());
  };

  const connectWithFallback = async () => {
    const initialUri = process.env.MONGO_URI || defaultLocalUri;
    try {
      const conn = await tryConnect(initialUri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`MongoDB initial connection failed: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }

      if (initialUri !== defaultLocalUri) {
        try {
          console.log(`Attempting local MongoDB fallback at ${defaultLocalUri}...`);
          const conn = await tryConnect(defaultLocalUri);
          console.log(`MongoDB connected to local instance: ${conn.connection.host}`);
          return conn;
        } catch (localErr) {
          console.warn(`Local MongoDB fallback failed: ${localErr.message}`);
        }
      }

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        console.log(`Starting in-memory MongoDB for development at ${memUri}`);
        const conn = await tryConnect(memUri);
        console.log(`MongoDB connected: ${conn.connection.host} (in-memory)`);
        return conn;
      } catch (memoryErr) {
        console.error(`MongoDB memory-server fallback failed: ${memoryErr.message}`);
        throw memoryErr;
      }
    }
  };

  try {
    await connectWithFallback();
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
