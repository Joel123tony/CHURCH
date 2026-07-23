import { resilientFetch } from "../../utils/resilientFetch.js";
import { getSubtitles } from "youtube-captions-scraper";

export const searchSong = async (query) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
        const encQuery = encodeURIComponent(`${query} tamil christian song lyrics official`);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encQuery}&type=video&key=${apiKey}`;
        
        const res = await resilientFetch(url, { timeout: 10000 });
        if (res.data.items && res.data.items.length > 0) {
            const videoId = res.data.items[0].id.videoId;
            return {
                sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
                source: "YouTube Search",
                lyricsTamil: "pending_fetch" // Signal that we found a result, but need to fetch it
            };
        }
    } catch (error) {
        console.error("[YouTube Search Error]:", error.message);
    }
    return null;
};

export const fetchSong = async (url) => {
    try {
        const videoId = url.split("v=")[1]?.split("&")[0];
        if (!videoId) return null;

        const apiKey = process.env.YOUTUBE_API_KEY;
        let description = "";
        let metadata = { videoId };

        if (apiKey) {
            try {
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
                const res = await resilientFetch(videoUrl, { timeout: 10000 });
                if (res.data.items && res.data.items.length > 0) {
                    const snippet = res.data.items[0].snippet;
                    const stats = res.data.items[0].statistics;
                    description = snippet.description || "";
                    
                    metadata = {
                        ...metadata,
                        channelName: snippet.channelTitle,
                        uploadDate: snippet.publishedAt,
                        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                        viewCount: stats.viewCount ? parseInt(stats.viewCount, 10) : 0
                    };
                }
            } catch (err) {
                console.error(`[YouTube] Metadata extraction failed:`, err.message);
            }
        }

        console.log(`[YouTube] Fetching captions for: ${videoId}`);
        let textPayload = "";
        try {
            const captions = await getSubtitles({
                videoID: videoId,
                lang: 'ta' // Attempt to fetch Tamil captions
            });
            if (captions && captions.length > 0) {
                textPayload = captions.map(c => c.text).join("\n");
            }
        } catch {
            console.error(`[YouTube] Caption extraction failed for ${videoId}.`);
        }

        if (!description && !textPayload) {
            return null; // Nothing found at all
        }

        // Return a structured JSON string so AiCleaningWorker can parse it easily
        return JSON.stringify({
            isYouTubeSource: true,
            description,
            captions: textPayload,
            metadata
        });
    } catch (err) {
        console.error(`[YouTube] fetchSong failed:`, err.message);
        return null;
    }
};

export const discoverLatest = async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn("[youtubeDiscovery] YOUTUBE_API_KEY is not set. Skipping discovery.");
        return [];
    }

    try {
        const query = encodeURIComponent("Latest Tamil Christian Worship");
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&order=date&q=${query}&type=video&key=${apiKey}`;
        
        const res = await resilientFetch(url, { timeout: 10000 });
        const items = res.data.items || [];
        
        const discovered = [];
        
        for (const item of items) {
            const videoId = item.id.videoId;
            // For youtube discovery, we return metadata objects instead of just URLs, 
            // but the scheduler needs to handle it correctly.
            // For now, we will just return the URLs and let the manual admin panel handle the rest.
            discovered.push(`https://www.youtube.com/watch?v=${videoId}`);
        }
        
        return discovered;
    } catch (error) {
        console.error("YouTube Discovery Error:", error.message);
        return [];
    }
};
