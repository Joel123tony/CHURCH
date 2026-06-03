import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db";
import { env } from "../config/env";
import { User } from "../models/User";
import { SiteSettings } from "../models/SiteSettings";

async function main() {
  await connectDatabase();

  await SiteSettings.findOneAndUpdate(
    {},
    {
      churchName: "Grace House",
      logoUrl: "",
      colors: {
        primary: "#d7b46a",
        accent: "#f6f1e8",
        background: "#07111f",
        surface: "#0f172a"
      },
      typography: {
        heading: "Playfair Display",
        body: "Inter"
      },
      heroBanner: "",
      footer: {
        text: "Worship with us this Sunday.",
        copyright: "Grace House Church"
      },
      socialLinks: [],
      homepageLayout: ["hero", "live-stream", "about", "sermons", "events", "pastors", "gallery", "contact"],
      navItems: [
        { label: "Home", href: "/", visible: true },
        { label: "About", href: "/about", visible: true },
        { label: "Ministries", href: "/ministries", visible: true },
        { label: "Events", href: "/events", visible: true },
        { label: "Gallery", href: "/gallery", visible: true },
        { label: "Pastors", href: "/pastors", visible: true },
        { label: "Contact", href: "/contact", visible: true },
        { label: "Search", href: "/search", visible: true }
      ]
    },
    { upsert: true, new: true }
  );

  if (env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10);
    await User.findOneAndUpdate(
      { email: env.SEED_ADMIN_EMAIL },
      {
        name: env.SEED_ADMIN_NAME ?? "Church Admin",
        email: env.SEED_ADMIN_EMAIL,
        passwordHash,
        role: "admin"
      },
      { upsert: true, new: true }
    );
  }

  console.log("Seed complete");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

