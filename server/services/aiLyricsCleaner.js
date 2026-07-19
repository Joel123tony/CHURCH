import { GoogleGenAI } from '@google/genai';

export const cleanLyricsWithAI = async (rawText) => {
    // If no API key is provided, we must throw so the caller can fallback to regex parsing
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not found in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `
You are a lyrics extraction engine. Extract only the actual song lyrics from the HTML.
Your ONLY job is to extract the clean song title and raw body lyrics, ignoring all other clutter.

CRITICAL RULES:
1. Never return markdown, explanations, or text outside of the JSON structure.
2. Every text block should be classified. ONLY keep: TITLE, LYRICS, VERSE, CHORUS, BRIDGE, and OPTIONAL TRANSLATION. Everything else is discarded.
3. Ignore and delete navigation, advertisements, breadcrumbs, metadata, SEO paragraphs (e.g., "The article provides..."), related songs, trending sections, playlists, comments, article descriptions, provider branding, tags, footers, headers, pagination, and recommendations.
4. Stop immediately and delete everything below if you reach: "Related songs", "Suggested Songs", "Trending", "Popular", "Categories", "Tags", "Comments", "Share", "Navigation", "Footer", "Latest posts".
5. Remove all musical chords (e.g. C, G, Am, F, E, F#, G#m). Remove lines that are just chords.
6. Remove multilingual pollution (e.g. Telugu, Malayalam, Chinese). If importing Tamil lyrics, keep ONLY Tamil and optionally English transliteration if they are paired.
7. Archive Rejection: If the page is an archive, list, category, or collection (e.g. "Top 100 Songs", "Trending Songs", "10 2025", "Song Collection", "Archive"), return {"valid": false, "reason": "Archive Page"}.
8. Multi-song Detection: If the page contains multiple different songs (Song A, Song B), return {"valid": false, "multiSong": true}. Do not extract them together.
9. Flag Dirty Content: If you find any of the following anywhere in the raw text, you must set their respective flags to true: 
   - Related Songs, Suggested Songs, Popular, Previous, Next
   - SEO, "The article provides...", "Written and sung by...", "Categories", "Archives"
   - Provider names: "God Medias", "Tamil Christians Songs"
   - Social media: "Share", "Facebook", "WhatsApp"
   - Metadata, Copyright, Privacy Policy

You must respond in pure JSON format exactly matching this schema (for a valid single song):
{
  "valid": true,
  "title": "Extracted Song Title",
  "lyrics": "The cleaned lyrics here, with line breaks preserved using \\n",
  "language": "ta",
  "containsRelatedSongs": false,
  "containsSeo": false,
  "containsNavigation": false,
  "containsChords": false,
  "containsMetadata": false
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'user', parts: [{ text: `RAW TEXT:\n${rawText}` }] }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        const textResponse = response.text();
        const result = JSON.parse(textResponse);
        
        return result;
    } catch (err) {
        console.error("[AI Lyrics Cleaner] Error calling Gemini API:", err.message);
        throw err;
    }
};
