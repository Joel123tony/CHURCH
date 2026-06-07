import { useState } from "react";
import axios from "axios";

export default function PastorSearch() {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [result, setResult] = useState([]);
  const [msg, setMsg] = useState("");

  const search = async () => {
    try {
      const res = await axios.get("/api/pastors/search", {
        params: { name, year },
      });

      const data = res.data;

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

  return (
    <div className="space-y-3">
      <input
        className="border p-2 rounded w-full"
        placeholder="Search by name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 rounded w-full"
        placeholder="Search by year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />

      <button
        type="button"
        onClick={search}
        className="bg-[#5b1320] text-white px-4 py-2 rounded-full"
      >
        Search
      </button>

      {msg && <p className="text-sm text-[#5b1320]">{msg}</p>}

      <div className="space-y-2">
        {result.map((pastor) => (
          <div key={pastor._id} className="border rounded p-3">
            <p className="font-semibold">{pastor.name}</p>
            <p className="text-sm">
              {pastor.joinedYear} - {pastor.leftYear || "Present"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
