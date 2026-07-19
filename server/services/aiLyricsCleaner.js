import { GoogleGenAI } from '@google/genai';

export const cleanLyricsWithAI = async (rawText) => {
    // If no API key is provided, we must throw so the caller can fallback to regex parsing
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not found in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Check if the input is a structured YouTube JSON payload
    let isYouTube = false;
    let textToAnalyze = rawText;
    
    try {
        const parsed = JSON.parse(rawText);
        if (parsed.isYouTubeSource) {
            isYouTube = true;
            // The AI will see the structured JSON
        }
    } catch (e) {
        // Not JSON, just standard HTML text
    }

    const systemPrompt = `
You are a highly advanced lyrics extraction engine. Extract only the actual song lyrics from the provided text.
Your ONLY job is to extract the clean song title and raw body lyrics, ignoring all other clutter.

CRITICAL RULES:
1. Never return markdown, explanations, or text outside of the JSON structure.
2. Every text block should be classified. ONLY keep: TITLE, LYRICS, VERSE, CHORUS, BRIDGE, and OPTIONAL TRANSLATION. Everything else is discarded.
3. Remove all musical chords (e.g. C, G, Am, F, E, F#, G#m). Remove lines that are just chords.
4. Remove multilingual pollution (e.g. Telugu, Malayalam, Chinese). Keep ONLY Tamil and optionally English transliteration if they are paired.
5. Fix OCR/text formatting issues. Normalize line breaks. Remove duplicate choruses caused by formatting. Preserve verses and chorus order.
6. Archive Rejection: If the page is an archive, list, category, or collection (e.g. "Top 100 Songs") where it doesn't contain full lyrics, return {"valid": false, "reason": "Archive Page"}.
7. Multi-song Detection: If the page contains multiple different songs with full lyrics, you MUST extract them individually. Set "multiSong": true, and return an array of song objects under the "songs" key.
8. Confidence Scoring: Assign a "confidenceScore" (0-100) based on how sure you are that the extracted text is actual lyrics and not prose/credits/spam.

${isYouTube ? `
YOUTUBE SPECIFIC RULES:
- The input is a JSON object containing "description" and "captions".
- PRIORITIZE the "description". If the description contains valid lyrics, extract them and ignore the captions.
- If the description does NOT contain lyrics (e.g., mostly credits, links, or prose), then fallback to extracting lyrics from the "captions".
- You must indicate where you found the lyrics in the "extractedFrom" field ("description" or "captions").
- Remove YouTube spam: Subscribe, Like / Share, Follow us, Credits, Music Credits, Copyright notices, Hashtags, Social media links, Contact numbers, Email addresses, Website URLs, Streaming links, Chapters, Timestamps, Sponsor sections, Donation links, Emoji spam, and Bible verses (unless part of the song).
- Reject descriptions that contain mostly credits or mostly links (score them low and set valid: false).
` : `
WEBSITE SPECIFIC RULES:
- Ignore and delete navigation, advertisements, breadcrumbs, metadata, SEO paragraphs (e.g., "The article provides..."), related songs, trending sections, playlists, comments, article descriptions, provider branding, tags, footers, headers, pagination, and recommendations.
- Stop immediately and delete everything below if you reach: "Related songs", "Suggested Songs", "Trending", "Popular", "Categories", "Tags", "Comments", "Share", "Navigation", "Footer", "Latest posts".
- Flag Dirty Content: Set flags to true if you see SEO, provider names, social media, or metadata.
`}

You must respond in pure JSON format exactly matching this schema:
For a single song:
{
  "valid": true,
  "multiSong": false,
  "title": "Extracted Song Title",
  "lyrics": "The cleaned lyrics here, with line breaks preserved using \\n",
  "language": "ta",
  "confidenceScore": 98,
  "extractedFrom": "${isYouTube ? "description" : "website"}",
  "containsRelatedSongs": false,
  "containsSeo": false,
  "containsNavigation": false,
  "containsChords": false,
  "containsMetadata": false
}
For multiple songs:
{
  "valid": true,
  "multiSong": true,
  "songs": [
    { "title": "Song A", "lyrics": "Lyrics A...", "language": "ta", "confidenceScore": 95, "extractedFrom": "website" },
    { "title": "Song B", "lyrics": "Lyrics B...", "language": "ta", "confidenceScore": 90, "extractedFrom": "website" }
  ]
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'user', parts: [{ text: `RAW TEXT:\n${textToAnalyze}` }] }
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
