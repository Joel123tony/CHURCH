router.get("/search", async (req, res) => {
  try {
    const { name, year } = req.query;

    let filter = {};

    // NAME FILTER
    if (name && name.trim() !== "") {
      filter.name = { $regex: name, $options: "i" };
    }

    // YEAR FILTER
    if (year && year.trim() !== "") {
      filter.$or = [
        { joinedYear: year },
        { leftYear: year }
      ];
    }

    const data = await Pastor.find(filter);

    // ALWAYS return array (IMPORTANT)
    if (!data || data.length === 0) {
      return res.json([]);
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});