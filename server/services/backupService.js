import fs from "fs/promises";
import path from "path";
import Song from "../models/Song.js";
import ProviderRegistry from "../models/ProviderRegistry.js";
import ProviderHealth from "../models/ProviderHealth.js";
import JobQueue from "../models/JobQueue.js";
import { collectPlatformMetrics } from "./observability.js";

const BACKUP_DIR = path.join(process.cwd(), "server", "backups");

export const createBackupCheckpoint = async (label = "scheduled") => {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const [providerRegistry, providerHealth, queueSummary, metrics] = await Promise.all([
    ProviderRegistry.find().lean(),
    ProviderHealth.find().lean(),
    JobQueue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    collectPlatformMetrics()
  ]);

  const queue = { pending: 0, processing: 0, completed: 0, failed: 0, quarantined: 0 };
  queueSummary.forEach((item) => {
    if (queue[item._id] !== undefined) queue[item._id] = item.count;
  });

  const backup = {
    label,
    createdAt: new Date().toISOString(),
    metrics,
    queue,
    counts: {
      songs: await Song.countDocuments(),
      providers: providerRegistry.length,
      providerHealth: providerHealth.length
    },
    providerRegistry,
    providerHealth
  };

  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(backup, null, 2), "utf8");
  return { filePath, backup };
};
