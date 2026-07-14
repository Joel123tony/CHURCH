import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import auth from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// ============================
// LOGIN
// ============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email"
      });
    }

    const storedPassword = user.password || user.passwordHash;

    if (!storedPassword) {
      return res.status(400).json({
        message: "Invalid credentials (no password found in DB)"
      });
    }

    const isMatch = await bcrypt.compare(password, storedPassword);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      token,
      user
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: err.message
    });
  }
});

// ============================
// CHANGE PASSWORD (ADMIN)
// ============================
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // We get the user ID from the JWT token (req.user.id)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const storedPassword = user.password || user.passwordHash;
    const isMatch = await bcrypt.compare(currentPassword, storedPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash the new password
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // Save to passwordHash (as per previous schema updates)
    user.passwordHash = newHash;
    // We should probably remove 'password' if it exists so we rely on passwordHash
    if (user.password) {
      user.password = undefined;
    }
    
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ============================
// FORGOT PASSWORD (OTP)
// ============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    // 1. We ONLY want to allow the single admin (or existing user)
    // To prevent email enumeration, we will return a generic success message
    // even if the user doesn't exist, but we only send the email if they do.
    const user = await User.findOne({ email: normalizedEmail });
    
    if (user) {
      // 2. Rate limiting check (max 3 recent requests can be done by checking Otp collection, omitted for brevity, using attempts instead)
      // Delete any existing OTPs for this email to invalidate old ones
      await Otp.deleteMany({ email: normalizedEmail });

      // 3. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 4. Hash the OTP
      const otpHash = await bcrypt.hash(otp, 10);

      // 5. Store in DB
      await Otp.create({
        email: normalizedEmail,
        otpHash
      });

      // 6. Send Email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #531B24; text-align: center;">Methodist Tamil Church Admin</h2>
          <p>You requested to reset your password. Use the following One-Time Password (OTP) to proceed.</p>
          <div style="background-color: #f4efe7; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #531B24;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `;
      console.log("Forgot Password Request:", normalizedEmail);
      console.log("Generated OTP:", otp);
      
      console.log({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_PORT == 465,
          user: process.env.SMTP_USER,
          hasPassword: !!process.env.SMTP_PASS
      });

      console.log("Sending email...");
      
      try {
        await sendEmail(normalizedEmail, "MTC Admin - Password Reset OTP", emailHtml);
      } catch (mailError) {
        return res.status(500).json({ message: "Failed to send OTP email: " + mailError.message });
      }
    }

    return res.status(200).json({ message: "If this email is registered, an OTP has been sent." });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ============================
// RESET PASSWORD (WITH OTP)
// ============================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    // 1. Password Validation Rules
    if (!newPassword || newPassword.trim() === "") {
      return res.status(400).json({ message: "Password cannot be empty" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New Password and Confirm Password must match" });
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    // Check attempts to prevent brute force
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update User Password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHash;
    if (user.password) {
      user.password = undefined;
    }
    await user.save();

    // Delete OTP record immediately after successful reset
    await Otp.deleteOne({ _id: otpRecord._id });

    // VERIFICATION STEP (As requested by User)
    const updatedUser = await User.findOne({ email: normalizedEmail });
    const verifyMatch = await bcrypt.compare(
      newPassword,
      updatedUser.passwordHash || updatedUser.password || ""
    );
    console.log("Password Updated:", verifyMatch);

    return res.status(200).json({ message: "Password changed successfully. You can now log in using your new password." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;