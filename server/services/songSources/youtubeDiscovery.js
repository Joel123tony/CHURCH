import axios from "axios";

export const searchSong = async (query) => {
    // YouTube is for discovery only, not lyrics search.
    return null;
};

export const fetchSong = async (url) => {
    // YouTube does not provide lyrics extraction yet.
    return null;
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
        
        const res = await axios.get(url, { timeout: 10000 });
        const items = res.data.items || [];
        
        const discovered = [];
        
        for (const item of items) {
            const videoId = item.id.videoId;
            const snippet = item.snippet;
            
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
