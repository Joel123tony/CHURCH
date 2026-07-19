import { BaseWorker } from "./BaseWorker.js";
import Song from "../models/Song.js";
import { normalizeTanglish } from "../utils/searchNormalizer.js";

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

        // Normalize Tanglish permutations (yesu, yeshu, iyesu -> iyesu)
        let searchKey = normalizeTanglish(song.titleEnglish || song.title);
        
        // Include partial lyrics for deep search
        const shortLyrics = (song.lyricsEnglish || "").substring(0, 500);
        const searchLyrics = normalizeTanglish(shortLyrics);

        song.searchKey = `${searchKey} ${searchLyrics}`.trim();
        await song.save();

        console.log(`[IndexWorker] Successfully indexed: ${song.title}`);
    }
}
