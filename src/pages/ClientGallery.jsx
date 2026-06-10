import { useEffect, useState } from "react";
import API from "../api/axios";

export default function ClientGallery() {
  const [media, setMedia] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

useEffect(() => {
  const fetch = async () => {
    const res = await API.get("/gallery/client");
    setMedia(res?.data?.data || []);
  };
  fetch();
}, []);

  const filtered = media.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">

      {/* HERO STRIP */}
      <h2 className="text-2xl font-bold mb-4">Latest Gallery</h2>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {media.slice(0, 4).map((item) => (
          <img
            key={item._id}
            src={item.url}
            className="h-24 w-24 object-cover rounded-lg flex-shrink-0"
          />
        ))}
      </div>

      {/* VIEW ALL BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="mt-4 bg-black text-white px-4 py-2 rounded"
      >
        View All Gallery
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 p-6 overflow-auto">

          <div className="bg-white p-4 rounded mb-4 flex justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border p-2 w-full"
            />

            <button
              onClick={() => setOpen(false)}
              className="ml-3 px-3 bg-red-500 text-white rounded"
            >
              X
            </button>
          </div>

          {/* MASONRY GRID */}
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {filtered.map((item) => (
              <div key={item._id} className="break-inside-avoid">

                {item.mediaType === "video" ? (
                  <video
                    src={item.url}
                    controls
                    className="rounded-lg w-full"
                  />
                ) : (
                  <img
                    src={item.url}
                    className="rounded-lg w-full"
                  />
                )}

                <p className="text-sm mt-1">{item.title}</p>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}