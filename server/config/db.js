import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ Mongo Disconnected. Mongoose will attempt to reconnect...");
    });
    
    mongoose.connection.on("reconnected", () => {
      console.log("✅ Mongo Reconnected successfully!");
    });

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      family: 4,
      maxPoolSize: 10,
    });

    console.log("✅ MongoDB Connected:", conn.connection.host);

    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:");
    console.error(err.message);

    // 🔥 CRITICAL FIX: DO NOT STOP SERVER START IF DB FAILS
    // Returning null allows non-DB routes to work
    return null;
  }
}