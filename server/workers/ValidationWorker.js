import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import { isMissingTitle } from "../utils/lyricsExtractor.js";
import { buildSongPayload } from "../utils/songNormalization.js";

export class ValidationWorker extends BaseWorker {
    constructor() {
        super("validation", 5000); 
    }

    async processJob(job) {
        const { aiResult, url } = job.payload;
        const songId = job.songId;

        let song = null;
        if (songId) {
            song = await Song.findById(songId);
            if (!song) throw new Error(`Song metadata not found for ID: ${songId}`);
        } else {
            song = job.payload.transientMetadata || {};
            // Convert to a temporary Mongoose document to use its methods if needed, or just work with payload
            song = new Song({ ...song });
            // Don't save it yet!
        }

        console.log(`[ValidationWorker] Validating AI output for: ${song.title}`);

        const cleanTitle = aiResult.title || song.title;
        const cleanLyrics = (aiResult.lyrics || "").trim();
        const payload = buildSongPayload({
            ...song.toObject(),
            title: cleanTitle,
            titleTamil: cleanTitle,
            titleEnglish: aiResult.alternateTitle || song.titleEnglish || "",
            lyrics: cleanLyrics,
            originalLyrics: aiResult.originalLyrics || song.originalLyrics || song.lyrics || "",
            cleanLyrics,
            cleanedLyrics: cleanLyrics,
            lyricsEnglish: aiResult.language === "English" ? cleanLyrics : song.lyricsEnglish || "",
            author: aiResult.author || song.author || "",
            composer: aiResult.composer || song.composer || "",
            album: aiResult.album || song.album || "",
            year: aiResult.year || song.year || "",
            language: aiResult.language || song.language || "Tamil",
            keywords: aiResult.tags || song.keywords || [],
            themes: aiResult.themes || song.themes || [],
            bibleReferences: aiResult.scriptureReferences || song.bibleReferences || [],
            aiStatus: aiResult.aiStatus || "processed",
            aiProvider: aiResult.aiProvider || "gemini",
            aiConfidence: aiResult.confidenceScore || song.aiConfidence || 0,
            aiProcessedAt: aiResult.aiProcessedAt || new Date(),
            aiPromptVersion: aiResult.aiPromptVersion || song.aiPromptVersion || "",
            aiMetadata: aiResult.metadata || song.aiMetadata || {},
            extractionMode: aiResult.extractionMode || song.extractionMode || "",
            extractionConfidence: aiResult.extractionConfidence || song.extractionConfidence || 0,
            extractionSelectors: aiResult.extractionSelectors || song.extractionSelectors || [],
            canonicalSong: typeof aiResult.canonicalSong === "boolean" ? aiResult.canonicalSong : (typeof song.canonicalSong === "boolean" ? song.canonicalSong : true),
            masterLyrics: aiResult.masterLyrics || song.masterLyrics || cleanLyrics,
            providerVariants: aiResult.providerVariants || song.providerVariants || [],
            versionHistory: aiResult.versionHistory || song.versionHistory || [],
            changeHistory: aiResult.changeHistory || song.changeHistory || [],
            fieldConfidence: aiResult.fieldConfidence || song.fieldConfidence || {},
            fieldSources: aiResult.fieldSources || song.fieldSources || {},
            fieldVerification: aiResult.fieldVerification || song.fieldVerification || {},
            mergeSummary: aiResult.mergeSummary || song.mergeSummary || {},
            comparisonSummary: aiResult.comparisonSummary || song.comparisonSummary || [],
            canonicalHash: aiResult.canonicalHash || song.canonicalHash || "",
            masterLyricsSections: aiResult.masterLyricsSections || song.masterLyricsSections || [],
            providerReliability: aiResult.providerReliability || song.providerReliability || {},
            masterSource: aiResult.masterSource || song.masterSource || null,
            contentHash: aiResult.contentHash || song.contentHash || "",
            relatedSongs: aiResult.relatedSongs || song.relatedSongs || [],
            graphSignals: aiResult.graphSignals || song.graphSignals || {},
            moderationStatus: aiResult.moderationStatus || song.moderationStatus || "approved",
            moderationHistory: aiResult.moderationHistory || song.moderationHistory || [],
            reviewNotes: aiResult.reviewNotes || song.reviewNotes || [],
            learningFeedback: aiResult.learningFeedback || song.learningFeedback || [],
            searchRankingSignals: aiResult.searchRankingSignals || song.searchRankingSignals || {},
            revisionNumber: (song.revisionNumber || 0) + 1,
            status: song.status || "completed",
            lyricsStatus: "found",
            isPublished: true,
            recoveredAt: song.recoveredAt || null
        }, {
            source: song.source,
            sourceUrl: song.sourceUrl || url,
            category: song.category
        });

        // Calculate Quality Score
        let score = 100;
        if (aiResult.containsSeo) score -= 30;
        if (aiResult.containsRelatedSongs) score -= 30;
        if (aiResult.containsMetadata) score -= 20;
        if (aiResult.containsChords) score -= 20;

        const lowerLyrics = cleanLyrics.toLowerCase();
        if (lowerLyrics.includes("trending")) score -= 30;
        if (lowerLyrics.includes("god medias") || lowerLyrics.includes("tamil christians songs")) score -= 30;

        let rejectionReason = null;

        // Hard Rejections
        if (aiResult.containsRelatedSongs) rejectionReason = "Contains Related Songs";
        if (aiResult.containsSeo) rejectionReason = "Contains SEO";
        if (aiResult.containsMetadata) rejectionReason = "Contains Metadata";
        if (isMissingTitle(cleanTitle)) rejectionReason = "Invalid Title";
        if (cleanTitle.length < 2) rejectionReason = "Title too short";
        
        const invalidTitles = [
            "unknown title", "untitled", "home", "lyrics", "tamil christian songs", "wordpress", 
            "archive", "category", "search"
        ];
        if (invalidTitles.some(t => cleanTitle.toLowerCase().includes(t))) {
            rejectionReason = `Invalid Title keyword found: ${cleanTitle}`;
        }
        
        const lyricsLines = cleanLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lyricsLines.length < 2) rejectionReason = "Lyrics too short (< 2 lines)";
        if (cleanLyrics.length < 50) rejectionReason = "Lyrics too short (< 50 chars)";
        if (aiResult.confidenceScore && aiResult.confidenceScore < 80) rejectionReason = `Low confidence score (${aiResult.confidenceScore})`;

        // The user requested minimum 95 for the new architecture
        if (score < 95) {
            rejectionReason = `Lyrics Quality Score too low (${score}/100)`;
        }

        const needsRecovery = (aiResult.confidenceScore || 0) < 80 || !!aiResult.aiNeedsReview;
        const isSoftRejection = typeof rejectionReason === "string" && (
            rejectionReason.startsWith("Lyrics Quality Score too low") ||
            rejectionReason.startsWith("Low confidence score")
        );
        const isHardReject = rejectionReason && !isSoftRejection;

        if (isHardReject) {
            if (aiResult.extractedFrom === "description" || aiResult.extractedFrom === "captions" || song.sourceUrl?.includes("youtube.com")) {
                console.warn(`[ValidationWorker] YouTube extraction failed validation (${rejectionReason}). Moving to Pending Lyrics.`);
                song.isPendingLyrics = true;
                song.lyricsStatus = "pending";
                await song.save();
                return; // Gracefully complete the job since we handled the fallback state
            } else {
                throw new Error(`Hard Reject: ${rejectionReason}`);
            }
        }

        if (needsRecovery || isSoftRejection) {
            song.aiNeedsReview = true;
            song.aiConfidenceBand = aiResult.confidenceBand || "Needs review";
            song.aiReviewReasons = aiResult.aiReviewReasons || [];
            song.recoveryRecommendations = aiResult.recoveryRecommendations || [
                "retry provider",
                "try another provider",
                "merge providers",
                "rerun AI cleanup"
            ];
            song.status = "recovering";
            song.lyricsStatus = "pending";
            song.isPendingLyrics = true;
            song.nextRetryAt = new Date(Date.now() + 30 * 60 * 1000);
            await song.save();
            await QueueManager.addJob("recovery", {
                reason: "AI confidence below threshold",
                source: song.source,
                sourceUrl: song.sourceUrl || url
            }, song._id);
            await QueueManager.addJob("moderation", {
                reason: "AI confidence below threshold",
                source: song.source,
                sourceUrl: song.sourceUrl || url
            }, song._id);
            return;
        }

        // Pass validation! Update the song
        song.title = payload.title;
        song.titleTamil = payload.titleTamil;
        song.titleEnglish = payload.titleEnglish;
        song.lyrics = payload.lyrics;
        song.lyricsTamil = payload.lyricsTamil;
        song.lyricsEnglish = payload.lyricsEnglish;
        song.originalLyrics = payload.originalLyrics;
        song.cleanLyrics = payload.cleanLyrics;
        song.cleanedLyrics = payload.cleanedLyrics;
        song.author = payload.author;
        song.composer = payload.composer;
        song.album = payload.album;
        song.year = payload.year;
        song.language = payload.language;
        song.keywords = payload.keywords;
        song.themes = payload.themes;
        song.bibleReferences = payload.bibleReferences;
        song.searchKey = payload.searchKey;
        song.displayTitle = payload.displayTitle;
        song.normalizedTitle = payload.normalizedTitle;
        song.normalizedDisplayTitle = payload.normalizedDisplayTitle;
        song.normalizedLyrics = payload.normalizedLyrics;
        song.slug = payload.slug || song.slug;
        song.aiStatus = payload.aiStatus;
        song.aiProvider = payload.aiProvider;
        song.aiConfidence = payload.aiConfidence;
        song.aiProcessedAt = payload.aiProcessedAt;
        song.aiMetadata = payload.aiMetadata;
        song.aiSourceHash = payload.aiSourceHash || song.aiSourceHash;
        song.aiEngineVersion = payload.aiEngineVersion || song.aiEngineVersion;
        song.aiPromptVersion = payload.aiPromptVersion || song.aiPromptVersion;
        song.aiConfidenceBand = payload.aiConfidenceBand || song.aiConfidenceBand;
        song.aiNeedsReview = !!payload.aiNeedsReview;
        song.aiReviewReasons = payload.aiReviewReasons || [];
        song.aiProcessingTimeMs = payload.aiProcessingTimeMs || song.aiProcessingTimeMs;
        song.aiSections = payload.aiSections || song.aiSections;
        song.aiSearchIndex = payload.aiSearchIndex || song.aiSearchIndex;
        song.extractionMode = payload.extractionMode || song.extractionMode || "";
        song.extractionConfidence = payload.extractionConfidence || song.extractionConfidence || 0;
        song.extractionSelectors = payload.extractionSelectors || song.extractionSelectors || [];
        song.recoveryRecommendations = payload.recoveryRecommendations || song.recoveryRecommendations;
        song.originalVersions = payload.originalVersions || song.originalVersions;
        song.mergedVersion = payload.mergedVersion || song.mergedVersion;
        song.canonicalSong = typeof payload.canonicalSong === "boolean" ? payload.canonicalSong : (typeof song.canonicalSong === "boolean" ? song.canonicalSong : true);
        song.masterLyrics = payload.masterLyrics || song.masterLyrics || "";
        song.providerVariants = payload.providerVariants || song.providerVariants || [];
        song.versionHistory = payload.versionHistory || song.versionHistory || [];
        song.changeHistory = payload.changeHistory || song.changeHistory || [];
        song.fieldConfidence = payload.fieldConfidence || song.fieldConfidence || {};
        song.fieldSources = payload.fieldSources || song.fieldSources || {};
        song.fieldVerification = payload.fieldVerification || song.fieldVerification || {};
        song.mergeSummary = payload.mergeSummary || song.mergeSummary || {};
        song.comparisonSummary = payload.comparisonSummary || song.comparisonSummary || [];
        song.canonicalHash = payload.canonicalHash || song.canonicalHash || "";
        song.masterLyricsSections = payload.masterLyricsSections || song.masterLyricsSections || [];
        song.providerReliability = payload.providerReliability || song.providerReliability || {};
        song.masterSource = payload.masterSource || song.masterSource || null;
        song.contentHash = payload.contentHash || song.contentHash || "";
        song.relatedSongs = payload.relatedSongs || song.relatedSongs || [];
        song.graphSignals = payload.graphSignals || song.graphSignals || {};
        song.moderationStatus = payload.moderationStatus || song.moderationStatus || "approved";
        song.moderationHistory = payload.moderationHistory || song.moderationHistory || [];
        song.reviewNotes = payload.reviewNotes || song.reviewNotes || [];
        song.learningFeedback = payload.learningFeedback || song.learningFeedback || [];
        song.searchRankingSignals = payload.searchRankingSignals || song.searchRankingSignals || {};
        song.revisionNumber = payload.revisionNumber || song.revisionNumber || 1;
        
        // Save youtube metadata if present in payload
        if (job.payload.metadata) {
            song.youtubeMetadata = { ...job.payload.metadata, confidenceScore: aiResult.confidenceScore, extractedFrom: aiResult.extractedFrom };
        }
        song.qualityScore = score;
        song.lyricsStatus = "found";
        song.isPendingLyrics = false;

        // Duplicate Detection BEFORE saving
        console.log(`[ValidationWorker] Checking duplicates for: ${song.title}`);
        let possibleDupe = await Song.findOne({
            ...(songId ? { _id: { $ne: song._id } } : {}),
            $or: [
                { canonicalHash: song.canonicalHash || "none" },
                { normalizedDisplayTitle: song.normalizedDisplayTitle || "none" },
                { normalizedTitle: song.normalizedTitle || "none", author: song.author || "" },
                { sourceUrl: song.sourceUrl || "none" }
            ],
            duplicateOf: null,
            status: "completed"
        });

        if (!possibleDupe) {
            const stringSimilarity = (await import('string-similarity')).default || (await import('string-similarity'));
            const candidates = await Song.find({
                ...(songId ? { _id: { $ne: song._id } } : {}),
                duplicateOf: null,
                status: "completed"
            }).select("title titleEnglish titleTamil");

            const songTitle = (song.titleEnglish || song.title || "").toLowerCase();
            
            if (songTitle && candidates.length > 0) {
                let bestMatch = null;
                let highestScore = 0;
                for (const candidate of candidates) {
                    const cTitle = (candidate.titleEnglish || candidate.title || "").toLowerCase();
                    if (!cTitle) continue;
                    const score = stringSimilarity.compareTwoStrings(songTitle, cTitle);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = candidate;
                    }
                }
                if (highestScore > 0.85) {
                    console.log(`[ValidationWorker] Fuzzy match found: ${songTitle} == ${bestMatch.titleEnglish || bestMatch.title} (${highestScore})`);
                    possibleDupe = await Song.findById(bestMatch._id);
                }
            }
        }

        let finalSongId = song._id;

        if (possibleDupe) {
            console.log(`[ValidationWorker] Found duplicate! Merging ${song.title} under ${possibleDupe._id}`);
            
            // Phase 8: Update Existing Songs
            if (song.qualityScore > (possibleDupe.qualityScore || 0)) {
                // The new version is better. Upgrade the existing one!
                possibleDupe.lyrics = song.lyrics || possibleDupe.lyrics;
                possibleDupe.cleanedLyrics = song.cleanedLyrics || possibleDupe.cleanedLyrics;
                possibleDupe.qualityScore = song.qualityScore;
            }

            if (!possibleDupe.youtubeUrl && song.youtubeUrl) possibleDupe.youtubeUrl = song.youtubeUrl;
            if (!possibleDupe.sourceUrl && song.sourceUrl) possibleDupe.sourceUrl = song.sourceUrl;
            
            if (song.providerHistory && song.providerHistory.length > 0) {
                possibleDupe.providerHistory = [...(possibleDupe.providerHistory || []), ...song.providerHistory];
            }
            
            await possibleDupe.save();
            finalSongId = possibleDupe._id;

            // If a stub existed in the DB, mark it as a duplicate
            if (songId) {
                song.duplicateOf = possibleDupe._id;
                song.status = "completed";
                await song.save();
            }
        } else {
            // Not a duplicate, insert as new
            await song.save();
            console.log(`[ValidationWorker] Validated and saved NEW lyrics for: ${song.title}`);
        }

        // Queue for indexing
        await QueueManager.addJob("indexing", { url }, finalSongId);
    }
}
