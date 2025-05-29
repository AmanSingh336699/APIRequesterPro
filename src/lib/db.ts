import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalCache = globalThis as unknown as { mongoose?: MongooseCache };

if (!globalCache.mongoose) {
  globalCache.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalCache.mongoose?.conn) {
    return globalCache.mongoose.conn;
  }

  if (!globalCache.mongoose?.promise) {
    globalCache.mongoose!.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    globalCache.mongoose!.conn = await globalCache.mongoose!.promise;
    return globalCache.mongoose!.conn;
  } catch (error) {
    globalCache.mongoose = { conn: null, promise: null };
    throw error;
  }
}
