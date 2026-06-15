import Prayer from "../models/Prayer.js";
import { processPrayers } from "../utils/prayerEngine.js";

export async function formatPrayers(req, res) {
  try {
    const { requests } = req.body;

    const result = await processPrayers(requests);

    // 💾 SAVE TO DB
    for (const r of result.data) {
      await Prayer.create({
        name: r.nameEN,
        nameTamil: r.nameTA,
        request: r.reqEN,
        requestTamil: r.reqTA
      });
    }

    res.json({
      success: true,
      whatsapp: result.whatsapp,
      voice: result.voiceReady,
      data: result.data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}