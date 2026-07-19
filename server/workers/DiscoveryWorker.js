import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import crypto from "crypto";
import { providers } from "../services/songSources/adapterManager.js";

export class DiscoveryWorker extends BaseWorker {
    constructor() {
        // Poll every 10 seconds for discovery tasks
        super("discovery", 10000); 
        this.crawlTimer = null;
        this.CRAWL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
    }

    start() {
        super.start();
        if (!this.crawlTimer) {
            console.log("[DiscoveryWorker] Starting autonomous crawler schedule (every 6 hours).");
            // Run immediately on start, then every interval
            this.runAutonomousCrawl();
            this.crawlTimer = setInterval(() => this.runAutonomousCrawl(), this.CRAWL_INTERVAL_MS);
        }
    }

    stop() {
        super.stop();
        if (this.crawlTimer) {
            clearInterval(this.crawlTimer);
            this.crawlTimer = null;
        }
    }

    async runAutonomousCrawl() {
        console.log("[DiscoveryWorker] Initiating autonomous provider crawl...");
        for (const { name, provider } of providers) {
            if (provider.discoverLatest) {
                try {
                    console.log(`[DiscoveryWorker] Crawling provider: ${name}`);
                    const urls = await provider.discoverLatest();
                    if (!urls || urls.length === 0) continue;
                    
                    let newDiscoveredCount = 0;
                    for (const url of urls) {
                        const existing = await Song.findOne({ url });
                        if (!existing) {
                            // Queue it for processing
                            await QueueManager.addJob("discovery", {
                                url,
                                source: name,
                                metadata: {
                                    title: "Auto Discovered Import",
                                    category: "Autonomous Crawler"
                                }
                            });
                            newDiscoveredCount++;
                        }
                    }
                    console.log(`[DiscoveryWorker] Finished ${name}: Queued ${newDiscoveredCount} new songs.`);
                } catch (err) {
                    console.error(`[DiscoveryWorker] Failed to crawl ${name}:`, err.message);
                }
            }
        }
    }

    async processJob(job) {
        const { source, url, metadata } = job.payload;
        
        // Check if URL already exists
        const existing = await Song.findOne({ url });
        if (existing) {
            console.log(`[DiscoveryWorker] URL already exists, skipping: ${url}`);
            return;
        }

        // Generate UUID
        const uuid = crypto.randomUUID();

        // Save metadata only
        const newSong = new Song({
            uuid,
            title: metadata.title || "",
            titleTamil: metadata.titleTamil || "",
            artist: metadata.artist || "",
            source,
            sourceUrl: url,
            url,
            category: metadata.category || "Unknown",
            lyricsStatus: "pending",
            status: "pending",
            ...metadata
        });

        await newSong.save();
        console.log(`[DiscoveryWorker] Discovered and saved metadata for: ${newSong.title}`);

        // Queue for import
        await QueueManager.addJob("import", {
            url: newSong.url,
            priority: 1
        }, newSong._id);
    }
}
