import mongoose from "mongoose";
import { env } from "./env";

export type DatabaseStatus = {
  mode: "atlas" | "mock" | "unknown";
  connected: boolean;
  readyState: number;
  name?: string;
  host?: string;
  port?: number;
};

let databaseStatus: DatabaseStatus = {
  mode: "unknown",
  connected: false,
  readyState: 0
};

export function getDatabaseStatus() {
  return databaseStatus;
}

export function setMockDatabaseStatus() {
  databaseStatus = {
    mode: "mock",
    connected: false,
    readyState: 0
  };
}

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  databaseStatus = {
    mode: "atlas",
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name ?? undefined,
    host: mongoose.connection.host ?? undefined,
    port: mongoose.connection.port ?? undefined
  };
}
