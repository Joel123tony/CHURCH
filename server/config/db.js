import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      family: 4,
      maxPoolSize: 10,
    });

    console.log("✅ MongoDB Connected:", conn.connection.host);
  } catch (err) {
    console.error("❌ MongoDB connection failed:");
    console.error(err.message);

    // IMPORTANT: do NOT crash immediately in dev
    // so frontend doesn't freeze completely
    return null;
  }
}