import Song from "../models/Song.js";
import SongAuditLog from "../models/SongAuditLog.js";
import { refreshSongRelationships } from "./knowledgeGraph.js";

const pushHistory = (song, action, notes = [], actor = "system", before = {}, after = {}) => {
  const entry = {
    action,
    actor,
    notes,
    before,
    after,
    at: new Date()
  };
  song.moderationHistory = [...(song.moderationHistory || []), entry].slice(-50);
  return entry;
};

export const queueSongForReview = async (songId, { reason = "", notes = [], actor = "system" } = {}) => {
  const song = await Song.findById(songId);
  if (!song) return null;

  const before = { moderationStatus: song.moderationStatus, aiNeedsReview: song.aiNeedsReview };
  song.moderationStatus = "pending";
  song.aiNeedsReview = true;
  song.aiReviewReasons = Array.from(new Set([...(song.aiReviewReasons || []), reason].filter(Boolean)));
  song.reviewNotes = Array.from(new Set([...(song.reviewNotes || []), ...notes].filter(Boolean)));
  pushHistory(song, "queued_for_review", [reason, ...notes].filter(Boolean), actor, before, {
    moderationStatus: song.moderationStatus,
    aiNeedsReview: song.aiNeedsReview
  });
  await song.save();

  await SongAuditLog.create({
    songId: song._id,
    action: "queued_for_review",
    actor,
    before,
    after: { moderationStatus: song.moderationStatus, aiNeedsReview: song.aiNeedsReview },
    notes: [reason, ...notes].filter(Boolean),
    source: song.source || "",
    sourceUrl: song.sourceUrl || song.url || ""
  });

  return song.toObject();
};

export const approveSongRevision = async (songId, { actor = "system", notes = [] } = {}) => {
  const song = await Song.findById(songId);
  if (!song) return null;

  const before = { moderationStatus: song.moderationStatus };
  song.moderationStatus = "approved";
  song.aiNeedsReview = false;
  song.moderationHistory = [...(song.moderationHistory || []), {
    action: "approved",
    actor,
    notes,
    before,
    after: { moderationStatus: "approved" },
    at: new Date()
  }].slice(-50);
  await song.save();
  await refreshSongRelationships(song._id);

  await SongAuditLog.create({
    songId: song._id,
    action: "approved",
    actor,
    before,
    after: { moderationStatus: "approved" },
    notes,
    source: song.source || "",
    sourceUrl: song.sourceUrl || song.url || ""
  });

  return song.toObject();
};

export const rejectSongRevision = async (songId, { actor = "system", notes = [] } = {}) => {
  const song = await Song.findById(songId);
  if (!song) return null;

  const before = { moderationStatus: song.moderationStatus };
  song.moderationStatus = "rejected";
  song.aiNeedsReview = true;
  song.moderationHistory = [...(song.moderationHistory || []), {
    action: "rejected",
    actor,
    notes,
    before,
    after: { moderationStatus: "rejected" },
    at: new Date()
  }].slice(-50);
  await song.save();

  await SongAuditLog.create({
    songId: song._id,
    action: "rejected",
    actor,
    before,
    after: { moderationStatus: "rejected" },
    notes,
    source: song.source || "",
    sourceUrl: song.sourceUrl || song.url || ""
  });

  return song.toObject();
};

export const recordSongCorrection = async (songId, { actor = "system", notes = [], before = {}, after = {} } = {}) => {
  const song = await Song.findById(songId);
  if (!song) return null;

  song.learningFeedback = [
    ...(song.learningFeedback || []),
    {
      actor,
      notes,
      before,
      after,
      at: new Date()
    }
  ].slice(-100);
  song.moderationHistory = [...(song.moderationHistory || []), {
    action: "corrected",
    actor,
    notes,
    before,
    after,
    at: new Date()
  }].slice(-50);
  await song.save();

  await SongAuditLog.create({
    songId: song._id,
    action: "corrected",
    actor,
    before,
    after,
    notes,
    source: song.source || "",
    sourceUrl: song.sourceUrl || song.url || ""
  });

  return refreshSongRelationships(song._id);
};
