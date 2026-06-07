router.get("/search", async (req, res) => {
  const { name, year } = req.query;

  let filter = {};

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  if (year) {
    filter.$or = [
      { joinedYear: year },
      { leftYear: year }
    ];
  }

  const data = await Pastor.find(filter);

  if (data.length === 0) {
    return res.json({ message: "NO_PASTOR_FOUND" });
  }

  res.json(data);
});