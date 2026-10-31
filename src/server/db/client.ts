import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/server/env";

// Giữ một client duy nhất cho cả process (kể cả khi dev server reload module).
const globalForMongo = globalThis as typeof globalThis & { _mongoClient?: MongoClient };

export function getMongoClient(): MongoClient {
  globalForMongo._mongoClient ??= new MongoClient(env().MONGODB_URI, {
    appName: "quizz",
    serverSelectionTimeoutMS: 5000,
  });
  return globalForMongo._mongoClient;
}

export function getDb(): Db {
  return getMongoClient().db(env().MONGODB_DB);
}
