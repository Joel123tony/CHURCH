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
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn(`LOGIN ATTEMPT: Admin not found for email ${normalizedEmail}`);
      return res.status(400).json({
        message: "Admin not found"
      });
    }

    const storedPassword = user.password || user.passwordHash;

    if (!storedPassword) {
      console.warn(`LOGIN ATTEMPT: No password stored in DB for ${normalizedEmail}`);
      return res.status(400).json({
        message: "Invalid credentials (no password found in DB)"
      });
    }

    const isMatch = await bcrypt.compare(password, storedPassword);

    if (!isMatch) {
      console.warn(`LOGIN ATTEMPT: Incorrect password for user ${normalizedEmail}`);
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

    console.log(`LOGIN SUCCESS: User ${normalizedEmail} logged in`);

    return res.json({
      token,
      user
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Internal server error"
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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #5D1324; padding: 30px 20px;">
              <h1 style="color: #F8F3EA; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Methodist Tamil Church</h1>
              <p style="color: #D4AF37; margin: 5px 0 0 0; font-size: 14px;">Padikuppam</p>
              <p style="color: #F8F3EA; margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Church Administration Portal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding: 40px 30px;">
              <h2 style="color: #5D1324; margin: 0 0 15px 0; font-size: 20px;">Password Reset Request</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin: 0 0 25px 0; text-align: center;">
                We received a request to reset the password for your Church Administration account.<br><br>
                Use the One-Time Password (OTP) below to continue.
              </p>

              <!-- OTP Box with Click-to-Copy -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                <tr>
                  <td align="center" 
                      onclick="navigator.clipboard.writeText('${otp}').then(() => { var msg = document.getElementById('copy-msg'); msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 2000); })"
                      style="background-color: #F8F3EA; border: 2px dashed #D4AF37; border-radius: 10px; padding: 20px; cursor: pointer; transition: background-color 0.3s ease; user-select: all; -webkit-user-select: all;"
                      onmouseover="this.style.backgroundColor='#F3E5AB'"
                      onmouseout="this.style.backgroundColor='#F8F3EA'">
                    <span style="font-family: monospace; font-size: 38px; font-weight: bold; color: #5D1324; letter-spacing: 8px; display: block; pointer-events: none;">
                      ${otp}
                    </span>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #8C7323; pointer-events: none;">← Click this OTP to copy</p>
                  </td>
                </tr>
              </table>

              <!-- Copy Success Message -->
              <div id="copy-msg" style="display: none; text-align: center; margin-top: 15px; color: #28a745; font-weight: bold; font-size: 14px;">
                ✓ OTP Copied
              </div>

              <!-- Expiry Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 25px;">
                <tr>
                  <td align="center">
                    <p style="background-color: #FDF9E8; color: #8C7323; padding: 12px 20px; border-radius: 6px; font-size: 14px; margin: 0; font-weight: bold; border: 1px solid #F3E5AB;">
                      This verification code expires in 10 minutes.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">
                If you did not request a password reset, please ignore this email.<br>
                Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #F8F3EA; padding: 25px 20px; border-top: 1px solid #e5e5e5;">
              <p style="color: #5D1324; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">Methodist Tamil Church</p>
              <p style="color: #666666; font-size: 12px; margin: 0 0 5px 0; line-height: 1.5;">
                Padikuppam, Mogappair East<br>
                Chennai – 600107
              </p>
              <a href="mailto:methodistchurch1975@gmail.com" style="color: #D4AF37; font-size: 12px; text-decoration: none; font-weight: bold;">methodistchurch1975@gmail.com</a>
              
              <p style="color: #999999; font-size: 11px; margin: 20px 0 0 0;">
                This is an automated email.<br>
                Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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