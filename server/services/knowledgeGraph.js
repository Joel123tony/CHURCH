import stringSimilarity from "string-similarity";
import Song from "../models/Song.js";
import SongRelationship from "../models/SongRelationship.js";
import { normalizeTanglish } from "../utils/searchNormalizer.js";
import { cleanLyricsText } from "./ai/cleaner.js";

const normalize = (value = "") => normalizeTanglish(cleanLyricsText(value)).toLowerCase().trim();

const overlapScore = (a = [], b = []) => {
  const setB = new Set((b || []).map((item) => normalize(item)).filter(Boolean));
  const overlap = (a || []).map((item) => normalize(item)).filter(Boolean).filter((item) => setB.has(item));
  const denominator = Math.max(1, Math.max((a || []).length, (b || []).length));
  return Math.min(1, overlap.length / denominator);
};

const buildEdges = (song, candidate) => {
  const edges = [];
  const titleA = normalize(song.titleTamil || song.titleEnglish || song.title || "");
  const titleB = normalize(candidate.titleTamil || candidate.titleEnglish || candidate.title || "");
  const titleSimilarity = stringSimilarity.compareTwoStrings(titleA, titleB);

  if (titleSimilarity >= 0.7) {
    edges.push({
      relationType: "similar_title",
      score: Math.round(titleSimilarity * 100),
      reasons: ["title similarity"]
    });
  }

  if (normalize(song.titleEnglish) && normalize(candidate.titleEnglish) && normalize(song.titleEnglish) === normalize(candidate.titleEnglish)) {
    edges.push({
      relationType: "alternate_title",
      score: 95,
      reasons: ["alternate title match"]
    });
  }

  const scriptureOverlap = overlapScore(song.bibleReferences, candidate.bibleReferences);
  if (scriptureOverlap > 0) {
    edges.push({
      relationType: "same_scripture",
      score: Math.round(scriptureOverlap * 100),
      reasons: ["shared scripture references"]
    });
  }

  const themeOverlap = overlapScore(song.themes, candidate.themes);
  if (themeOverlap > 0) {
    edges.push({
      relationType: "same_theme",
      score: Math.round(themeOverlap * 100),
      reasons: ["shared themes"]
    });
  }

  const composerA = normalize(song.composer);
  const composerB = normalize(candidate.composer);
  if (composerA && composerA === composerB) {
    edges.push({
      relationType: "same_composer",
      score: 100,
      reasons: ["same composer"]
    });
  }

  const authorA = normalize(song.author);
  const authorB = normalize(candidate.author);
  if (authorA && authorA === authorB) {
    edges.push({
      relationType: "same_author",
      score: 100,
      reasons: ["same author"]
    });
  }

  const albumA = normalize(song.album);
  const albumB = normalize(candidate.album);
  if (albumA && albumA === albumB) {
    edges.push({
      relationType: "same_album",
      score: 100,
      reasons: ["same album"]
    });
  }

  return edges;
};

export const refreshSongRelationships = async (songId, limit = 40) => {
  const song = await Song.findById(songId).lean();
  if (!song) return { edges: [], relatedSongs: [] };

  const candidates = await Song.find({
    _id: { $ne: song._id },
    isPublished: true
  })
    .select("title titleTamil titleEnglish author composer album themes bibleReferences source url sourceUrl aiConfidence canonicalSong masterLyrics lyrics")
    .limit(limit * 6)
    .lean();

  const edges = [];
  for (const candidate of candidates) {
    const candidateEdges = buildEdges(song, candidate);
    candidateEdges.forEach((edge) => {
      if (edge.score >= 60) {
        edges.push({
          fromSong: song._id,
          toSong: candidate._id,
          relationType: edge.relationType,
          score: edge.score,
          reasons: edge.reasons,
          canonical: !!song.canonicalSong,
          source: song.source || ""
        });
      }
    });
  }

  const topRelated = edges
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  await SongRelationship.deleteMany({ fromSong: song._id });
  if (topRelated.length > 0) {
    await SongRelationship.insertMany(topRelated, { ordered: false }).catch(() => {});
  }

  await Song.findByIdAndUpdate(song._id, {
    $set: {
      relatedSongs: topRelated.map((edge) => ({
        songId: edge.toSong,
        relationType: edge.relationType,
        score: edge.score,
        source: edge.source
      })),
      graphSignals: {
        relationshipCount: topRelated.length,
        lastGraphRefreshAt: new Date()
      },
      searchRankingSignals: {
        relationshipCount: topRelated.length,
        lastGraphRefreshAt: new Date()
      }
    }
  });

  return {
    edges: topRelated,
    relatedSongs: topRelated.map((edge) => edge.toSong)
  };
};

export const refreshGraphForLibrary = async (limit = 100) => {
  const songs = await Song.find({ isPublished: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("_id")
    .lean();

  const results = [];
  for (const song of songs) {
    results.push(await refreshSongRelationships(song._id));
  }
  return results;
};
