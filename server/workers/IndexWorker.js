import { BaseWorker } from "./BaseWorker.js";
import Song from "../models/Song.js";
import { normalizeTanglish } from "../utils/searchNormalizer.js";
import { buildSongPayload } from "../utils/songNormalization.js";

export class IndexWorker extends BaseWorker {
    constructor() {
        super("indexing", 5000); 
    }

    async processJob(job) {
        const songId = job.songId;

        const song = await Song.findById(songId);
        if (!song) {
            throw new Error(`Song metadata not found for ID: ${songId}`);
        }

        console.log(`[IndexWorker] Generating search index for: ${song.title}`);

        const payload = buildSongPayload(song.toObject(), {
            source: song.source,
            sourceUrl: song.sourceUrl || song.url,
            category: song.category
        });

        // Normalize Tanglish permutations (yesu, yeshu, iyesu -> iyesu)
        let searchKey = normalizeTanglish(payload.titleEnglish || payload.title || song.title);
        
        // Include partial lyrics and metadata for deep search
        const shortLyrics = `${payload.lyricsEnglish || ""} ${payload.lyricsTamil || ""}`.substring(0, 900);
        const searchLyrics = normalizeTanglish(shortLyrics);
        const searchMeta = normalizeTanglish([
            ...(payload.themes || []),
            ...(payload.keywords || []),
            ...(payload.bibleReferences || []),
            payload.author,
            payload.composer,
            payload.album
        ].filter(Boolean).join(" "));

        song.searchKey = `${searchKey} ${searchLyrics} ${searchMeta}`.trim();
        song.normalizedTitle = payload.normalizedTitle;
        song.normalizedLyrics = payload.normalizedLyrics;
        song.aiSearchIndex = payload.aiSearchIndex || song.aiSearchIndex;
        song.aiSections = payload.aiSections || song.aiSections;
        song.aiPromptVersion = payload.aiPromptVersion || song.aiPromptVersion;
        song.aiConfidenceBand = payload.aiConfidenceBand || song.aiConfidenceBand;
        song.aiNeedsReview = typeof payload.aiNeedsReview === "boolean" ? payload.aiNeedsReview : song.aiNeedsReview;
        song.recoveryRecommendations = payload.recoveryRecommendations || song.recoveryRecommendations;
        song.canonicalSong = typeof payload.canonicalSong === "boolean" ? payload.canonicalSong : (typeof song.canonicalSong === "boolean" ? song.canonicalSong : true);
        song.masterLyrics = payload.masterLyrics || song.masterLyrics || "";
        song.providerVariants = payload.providerVariants || song.providerVariants || [];
        song.versionHistory = payload.versionHistory || song.versionHistory || [];
        song.changeHistory = payload.changeHistory || song.changeHistory || [];
        song.fieldConfidence = payload.fieldConfidence || song.fieldConfidence || {};
        song.fieldSources = payload.fieldSources || song.fieldSources || {};
        song.mergeSummary = payload.mergeSummary || song.mergeSummary || {};
        song.comparisonSummary = payload.comparisonSummary || song.comparisonSummary || [];
        song.canonicalHash = payload.canonicalHash || song.canonicalHash || "";
        song.masterLyricsSections = payload.masterLyricsSections || song.masterLyricsSections || [];
        song.providerReliability = payload.providerReliability || song.providerReliability || {};
        song.masterSource = payload.masterSource || song.masterSource || null;
        await song.save();

        console.log(`[IndexWorker] Successfully indexed: ${song.title}`);
    }
}
