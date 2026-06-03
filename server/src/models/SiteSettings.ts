import { Schema, model, type InferSchemaType } from "mongoose";

const navItemSchema = new Schema(
  {
    label: String,
    href: String,
    visible: { type: Boolean, default: true }
  },
  { _id: false }
);

const siteSettingsSchema = new Schema(
  {
    churchName: { type: String, required: true },
    logoUrl: String,
    colors: {
      primary: String,
      accent: String,
      background: String,
      surface: String
    },
    typography: {
      heading: String,
      body: String
    },
    heroBanner: String,
    footer: {
      text: String,
      copyright: String
    },
    socialLinks: [{ label: String, href: String }],
    homepageLayout: [String],
    navItems: [navItemSchema]
  },
  { timestamps: true }
);

export type SiteSettingsDoc = InferSchemaType<typeof siteSettingsSchema>;
export const SiteSettings = model("SiteSettings", siteSettingsSchema);

