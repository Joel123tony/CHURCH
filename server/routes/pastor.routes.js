import express from "express";
import Pastor from "../models/Pastor.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = express.Router();

const buildImage = (image, fallback = false) => {
  if (image && typeof image === "object") {
    return {
      url: image.url || "",
      public_id: image.public_id || null,
    };
  }

  return fallback
    ? {
        url: "",
        public_id: null,
      }
    : undefined;
};

router.get("/", async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ joinedYear: 1 });
    res.json(pastors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { name = "", year = "" } = req.query;
    const filters = [];

    if (name.trim()) {
      filters.push({
        name: { $regex: name.trim(), $options: "i" },
      });
    }

    if (year.trim()) {
      const numericYear = Number(year);

      filters.push(
        Number.isFinite(numericYear)
          ? {
              $or: [
                { joinedYear: numericYear },
                { leftYear: numericYear },
              ],
            }
          : {
              $or: [
                { joinedYear: { $regex: year.trim(), $options: "i" } },
                { leftYear: { $regex: year.trim(), $options: "i" } },
              ],
            }
      );
    }

    const query = filters.length > 0 ? { $and: filters } : {};
    const pastors = await Pastor.find(query).sort({ joinedYear: 1 });

    res.json(pastors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware, allowRoles("developer"));

router.post("/", async (req, res) => {
  try {
    const pastor = await Pastor.create({
      name: req.body.name,
      joinedYear: req.body.joinedYear,
      leftYear: req.body.leftYear ?? null,
      details: req.body.details,
      image: buildImage(req.body.image, true),
      isCurrent: Boolean(req.body.isCurrent),
    });

    res.json(pastor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/current/:id", async (req, res) => {
  try {
    await Pastor.updateMany({}, { isCurrent: false });

    const pastor = await Pastor.findByIdAndUpdate(
      req.params.id,
      { isCurrent: true },
      { new: true, runValidators: true }
    );

    res.json(pastor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      joinedYear: req.body.joinedYear,
      leftYear: req.body.leftYear ?? null,
      details: req.body.details,
    };

    const image = buildImage(req.body.image);
    if (image) {
      updateData.image = image;
    }

    const updated = await Pastor.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Pastor.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
