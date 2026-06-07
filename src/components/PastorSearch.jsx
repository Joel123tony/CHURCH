const search = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/pastors/search",
      {
        params: { name, year }
      }
    );

    const data = res.data;

    // ✅ backend now returns array always
    if (Array.isArray(data) && data.length === 0) {
      setResult([]);
      setMsg("No pastor found");
    } else {
      setResult(data);
      setMsg("");
    }

  } catch (err) {
    console.log(err);
    setMsg("Server error");
  }
};