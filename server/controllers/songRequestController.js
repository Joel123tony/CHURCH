import SongRequest from "../models/SongRequest.js";

/* =========================
   CREATE SONG REQUEST (PUBLIC)
========================= */
export const createSongRequest = async (req, res) => {
  try {
    const { songName, details } = req.body;
    
    if (!songName || songName.trim() === "") {
      return res.status(400).json({ success: false, message: "Please enter the song name." });
    }

    const normalizedName = songName.trim().toLowerCase();

    // Prevent identical pending requests
    const existingRequest = await SongRequest.findOne({
      songName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      status: "pending"
    });

    if (existingRequest) {
      return res.status(409).json({ success: false, message: "This song has already been requested." });
    }

    const newRequest = await SongRequest.create({
      songName: songName.trim(),
      details: details ? details.trim() : "",
      status: "pending"
    });

    return res.status(201).json({ success: true, data: newRequest });
  } catch (err) {
    console.error("Error creating song request:", err);
    return res.status(500).json({ success: false, message: "Unable to send the request. Please try again." });
  }
};

/* =========================
   GET ALL REQUESTS (ADMIN)
========================= */
export const getSongRequests = async (req, res) => {
  try {
    const requests = await SongRequest.find().sort({ requestedAt: -1 });
    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error("Error fetching song requests:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch song requests." });
  }
};

/* =========================
   UPDATE REQUEST STATUS (ADMIN)
========================= */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "added", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const request = await SongRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    return res.status(200).json({ success: true, data: request });
  } catch (err) {
    console.error("Error updating song request:", err);
    return res.status(500).json({ success: false, message: "Failed to update song request." });
  }
};

/* =========================
   DELETE REQUEST (ADMIN)
========================= */
export const deleteSongRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await SongRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    return res.status(200).json({ success: true, message: "Request deleted successfully." });
  } catch (err) {
    console.error("Error deleting song request:", err);
    return res.status(500).json({ success: false, message: "Failed to delete song request." });
  }
};
