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

    const adminEmails = ["methodistchurch1975@gmail.com", "1234eruk1637@gmail.com"];
    
    for (const email of adminEmails) {
      const exists = await User.findOne({ email });
      if (!exists) {
        const defaultPassword = await bcrypt.hash("admin123", 10);
        await User.create({
          email,
          password: defaultPassword,
          role: "admin",
        });
        console.log(`✅ Seeded admin: ${email}`);
      } else {
        console.log(`✅ Admin already exists: ${email}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error.message);
    process.exit(1);
  }
};

seedAdmin();
