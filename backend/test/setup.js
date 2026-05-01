import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to in-memory MongoDB for testing');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
  }
};

export const clearDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
  }
};