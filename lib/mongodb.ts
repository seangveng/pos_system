import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ??
  (global.mongooseCache = {
    conn: null,
    promise: null,
  });

export default async function connectDB(): Promise<typeof mongoose> {
  // Reuse a healthy connection.
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // Reuse an ongoing connection attempt.
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,

      // Avoid waiting several minutes for an unavailable server.
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,

      // Prefer IPv4.
      family: 4,

      // Connection pool configuration.
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60000,
      waitQueueTimeoutMS: 10000,

      // Socket timeout.
      socketTimeoutMS: 45000,

      // Heartbeat monitoring.
      heartbeatFrequencyMS: 10000,
    });
  }

  try {
    await cached.promise;

    cached.conn = mongoose;

    console.log("MongoDB connected successfully.");

    return mongoose;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;

    console.error("MongoDB connection failed:", error);

    throw error;
  }
}
