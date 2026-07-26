const COMMON_ARTISTS = [
    "stella ramola",
    "gersson edinbaro",
    "john jebaraj",
    "giftson durai",
    "wesley maxwell",
    "kester",
    "robert roy",
    "jollee abraham",
    "judah benhur",
    "stephen renwick",
    "albert solomon",
    "joel thomas",
    "hema john",
    "issac joe",
    "rebekah dawson"
];

/**
 * Extracts the title and artist from a raw search query.
 * @param {string} query The raw search query
 * @returns {{ title: string, artist: string }}
 */
export const extractArtistAndTitle = (query) => {
    if (!query) return { title: "", artist: "" };

    const lowerQuery = query.toLowerCase().trim();
    let title = query;
    let artist = "";

    for (const commonArtist of COMMON_ARTISTS) {
        if (lowerQuery.includes(commonArtist)) {
            artist = commonArtist;
            // Remove the artist from the query, case insensitively
            const regex = new RegExp(commonArtist, "ig");
            title = query.replace(regex, "").trim();
            
            // Clean up any stray hyphens or punctuation left behind (e.g. "Song - ")
            title = title.replace(/^[-\s]+|[-\s]+$/g, "");
            break;
        }
    }

    return { title: title || query, artist };
};
