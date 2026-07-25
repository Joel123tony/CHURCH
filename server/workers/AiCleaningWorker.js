import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import crypto from "crypto";
import * as cheerio from "cheerio";
import { cleanLyricsWithAI } from "../services/aiLyricsCleaner.js";
import { buildSongPayload } from "../utils/songNormalization.js";
import { recordProviderHealth } from "../services/ai/providerHealth.js";

export class AiCleaningWorker extends BaseWorker {
    constructor() {
        super("ai_cleaning", 5000); 
    }

    async processJob(job) {
        const { html, rawText: suppliedRawText, providerCandidates = [], url } = job.payload;
        const songId = job.songId;

        let song = null;
        if (songId) {
            song = await Song.findById(songId);
            if (!song) throw new Error(`Song metadata not found for ID: ${songId}`);
        } else {
            song = job.payload.transientMetadata || {};
            song.title = song.title || job.payload.title;
            song.titleTamil = song.titleTamil || job.payload.titleTamil;
            song.titleEnglish = song.titleEnglish || job.payload.titleEnglish;
            song.source = song.source || job.payload.source;
            song.category = song.category || job.payload.category;
            song.sourceUrl = song.sourceUrl || url;
            song.url = song.url || url;
        }

        let rawText = suppliedRawText || "";
        let isYouTube = false;
        let youtubeMetadata = null;
        let isMergedFallback = false;
        let candidateVersions = [...providerCandidates];

        try {
            const parsed = JSON.parse(html);
            if (parsed.isYouTubeSource) {
                isYouTube = true;
                rawText = html; // Pass the JSON string straight to AI
                youtubeMetadata = parsed.metadata;
            } else if (parsed.isAiMergedSource) {
                isMergedFallback = true;
                rawText = parsed.rawText || rawText;
                youtubeMetadata = parsed.metadata || {};
                if (Array.isArray(parsed.candidates) && parsed.candidates.length > 0) {
                    candidateVersions = parsed.candidates;
                }
            }
        } catch {
            // Not JSON, parse as HTML
        }

        if (!isYouTube && !isMergedFallback) {
            // Fast extraction of main content area to feed AI
            const $ = cheerio.load(html);
            const contentArea = $('.post-inner, .entry-content, .post-content, article, .td-post-content, .site-main, main, #contents').first();
            
            if (contentArea.length) {
                contentArea.find('.sharedaddy, .yarpp-related, #comments, .nav-links, header, footer, style, script, iframe, nav').remove();
                let rawHtml = contentArea.html() || "";
                rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li|ul|ol|table)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
                rawText = cheerio.load(rawHtml).text();
            } else {
                rawText = $.text();
            }
        }

        console.log(`[AiCleaningWorker] Invoking AI for: ${song.title}`);
        
        const aiResult = await cleanLyricsWithAI(rawText, {
            title: song.title,
            titleTamil: song.titleTamil,
            titleEnglish: song.titleEnglish,
            source: song.source,
            sourceUrl: url,
            category: song.category,
            language: song.language,
            metadata: youtubeMetadata || song.aiMetadata || {},
            providerCandidates: candidateVersions,
            originalVersions: candidateVersions
        });

        const providerName = song.source || aiResult.aiProvider || song.aiProvider || "unknown";
        const candidateList = Array.isArray(candidateVersions) ? candidateVersions : [];
        const hasMissingLyrics = !(aiResult.lyrics || "").trim();
        const hasMissingVerse = hasMissingLyrics || !(aiResult.aiSections || []).some((section) => /verse/i.test(section?.label || section?.type || ""));
        await recordProviderHealth({
            provider: providerName,
            domain: song.sourceUrl ? new URL(song.sourceUrl).hostname : "",
            success: aiResult.valid !== false,
            parsed: true,
            merged: !!aiResult.mergedVersion || candidateList.length > 1,
            missingLyrics: hasMissingLyrics,
            missingVerse: hasMissingVerse,
            confidence: aiResult.confidenceScore || 0,
            processingTimeMs: aiResult.aiProcessingTimeMs || 0,
            note: aiResult.aiNeedsReview ? `ai-needs-review:${aiResult.aiProvider || song.aiProvider || "heuristic"}` : ""
        });

        if (aiResult.valid === false) {
            console.error(`[AiCleaningWorker] AI validation failed for ${song.title}. Issues:`, aiResult.aiReviewReasons);
            throw new Error(`Hard Reject: AI Rejected Import: ${aiResult.reason || "Validation Failed: " + (aiResult.aiReviewReasons || []).join(", ")}`);
        }

        if (aiResult.multiSong && aiResult.songs && aiResult.songs.length > 0) {
            console.log(`[AiCleaningWorker] Multi-song detected! Splitting into ${aiResult.songs.length} independent jobs.`);
            
            for (let i = 0; i < aiResult.songs.length; i++) {
                const s = aiResult.songs[i];
                const splitPayload = buildSongPayload({
                    ...s,
                    source: song.source,
                    sourceUrl: url,
                    category: song.category,
                    status: "processing",
                    scrapeStatus: "success",
                    lyricsStatus: "found",
                    isPublished: true,
                    aiStatus: s.aiStatus || "processed",
                    aiProvider: s.aiProvider || "gemini",
                    aiConfidence: s.aiConfidence || s.confidenceScore || 0,
                    aiMetadata: s.metadata || {},
                    providerHistory: song.providerHistory || []
                }, {
                    source: song.source,
                    sourceUrl: url,
                    category: song.category
                });

                // Create a separate Song record for each if songId exists, otherwise just pass it transiently
                let splitSongId = null;
                if (songId) {
                    const splitSong = new Song({
                        uuid: crypto.randomUUID(),
                        ...splitPayload,
                        title: splitPayload.title || `Split Song ${i + 1}`,
                        titleTamil: splitPayload.titleTamil || `Split Song ${i + 1}`,
                        artist: song.artist || "",
                        source: song.source || "",
                        sourceUrl: url,
                        url: `${url}#split-${i}`,
                        category: song.category || "",
                        lyricsStatus: "pending",
                        status: "processing"
                    });
                    await splitSong.save();
                    splitSongId = splitSong._id;
                } else {
                    splitPayload.transientMetadata = {
                        ...song,
                        title: splitPayload.title || `Split Song ${i + 1}`,
                        titleTamil: splitPayload.titleTamil || `Split Song ${i + 1}`,
                        url: `${url}#split-${i}`
                    };
                }

                // Queue each split song for validation immediately
                // Construct a mock aiResult for validation
                const splitAiResult = {
                    valid: true,
                    multiSong: false,
                    title: splitPayload.title,
                    alternateTitle: splitPayload.titleEnglish || "",
                    lyrics: splitPayload.cleanedLyrics || splitPayload.lyrics || "",
                    originalLyrics: splitPayload.originalLyrics || "",
                    language: splitPayload.language || "ta",
                    confidenceScore: s.confidenceScore || aiResult.confidenceScore || 0,
                    extractedFrom: s.extractedFrom || aiResult.extractedFrom || "website",
                    themes: splitPayload.themes || [],
                    tags: splitPayload.keywords || [],
                    author: splitPayload.author || "",
                    composer: splitPayload.composer || "",
                    album: splitPayload.album || "",
                    year: splitPayload.year || "",
                    scriptureReferences: splitPayload.bibleReferences || [],
                    worshipCategory: splitPayload.aiMetadata?.worshipCategory || "",
                    containsRelatedSongs: aiResult.containsRelatedSongs || false,
                    containsSeo: aiResult.containsSeo || false,
                    containsNavigation: aiResult.containsNavigation || false,
                    containsChords: aiResult.containsChords || false,
                    containsMetadata: aiResult.containsMetadata || false,
                    aiUsed: true,
                    aiStatus: "processed",
                    aiProvider: aiResult.aiProvider || "heuristic",
                    aiProcessedAt: new Date()
                };

                await QueueManager.addJob("validation", {
                    aiResult: splitAiResult,
                    url,
                    transientMetadata: splitPayload.transientMetadata || null
                }, splitSongId);
            }

            // Since the original job was just an archive container, we can quarantine the parent
            throw new Error("Hard Reject: Multi-Song Archive Page. Split successfully.");
        }

        // Single Song processing
        song.aiStatus = "processed";
        if (songId) await song.save();

        // Queue for validation
        await QueueManager.addJob("validation", {
            aiResult,
            url,
            metadata: youtubeMetadata,
            providerCandidates,
            transientMetadata: !songId ? song : null
        }, songId);

        console.log(`[AiCleaningWorker] AI completed successfully, queued for validation: ${song.title}`);
    }
}
