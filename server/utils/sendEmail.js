import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log("Verifying SMTP Connection...");
    await transporter.verify();
    console.log("SMTP Connection Verified.");

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Church Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    console.log(`Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent successfully. ID: %s", info.messageId);
    console.log("Response:", info.response);
    return true;
  } catch (error) {
    console.error("MAIL ERROR");
    console.error(error);
    console.error(error.stack);
    throw error; // Throw so caller knows it failed
  }
};
