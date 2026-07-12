import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config(); // 👈 IMPORTANT

await mongoose.connect(process.env.MONGO_URI);

const updateAdmin = async () => {
  try {
    const newEmail = "admin@church.com";
    const newPassword = "mtc@2026";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne(
      { role: "admin" },
      {
        email: newEmail,
        password: hashedPassword,
      }
    );

    console.log("Admin updated successfully:", result);
  } catch (err) {
    console.error("Error updating admin:", err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

updateAdmin();