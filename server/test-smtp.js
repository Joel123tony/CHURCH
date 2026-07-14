import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const testSMTP = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log("-----------------------------------------");
    console.log("Configuration loaded from .env:");
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
    console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'MISSING!'}`);
    console.log("-----------------------------------------");

    console.log("1. Verifying SMTP Connection...");
    await transporter.verify();
    console.log("✅ SMTP Connected Successfully!");

    const testEmail = process.argv[2] || process.env.SMTP_USER;
    
    console.log(`\n2. Sending test email to: ${testEmail}...`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: "SMTP Test - MTC Admin",
      text: "If you received this, Gmail SMTP is working perfectly!"
    });
    
    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("\n❌ SMTP ERROR:");
    console.error(error.message);
    if (error.code === 'EAUTH') {
        console.error("\nThis is an Authentication Error.");
        console.error("1. Did you paste the App Password correctly?");
        console.error("2. Make sure you are using an App Password, NOT your regular Gmail password.");
    }
  }
};

testSMTP();
