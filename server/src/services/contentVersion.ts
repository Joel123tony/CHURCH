import { SiteSettings } from "../models/SiteSettings";

export async function touchContentVersion() {
  await SiteSettings.updateOne({}, { $set: { lastContentChangeAt: new Date() } });
}
