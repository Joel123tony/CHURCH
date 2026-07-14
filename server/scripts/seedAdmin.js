import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Determine the path to the .env file
const envPath = fs.existsSync(path.join(process.cwd(), "server", ".env"))
  ? path.join(process.cwd(), "server", ".env")
  : path.join(process.cwd(), ".env");

dotenv.config({ path: envPath });

import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      family: 4,
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB Connected");

    const adminCount = await User.countDocuments({ role: "admin" });
    
    if (adminCount === 0) {
      const defaultPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        email: "admin@church.com",
        password: defaultPassword,
        role: "admin",
      });
      console.log("✅ Seeded default admin (admin@church.com / admin123)");
    } else {
      console.log(`✅ Admin users already exist (Count: ${adminCount}). Skipping seeding.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error.message);
    process.exit(1);
  }
};

seedAdmin();
