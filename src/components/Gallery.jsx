import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Gallery() {
  const [media, setMedia] = useState([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await API.get("/gallery");

        setMedia(
          Array.isArray(res.data)
            ? res.data
            : res.data?.data || []
        );
      } catch (error) {
        console.error("Gallery fetch error:", error);
        setMedia([]);
      }
    };

    fetchGallery();
  }, []);

  return (
    <section className="bg-cream py-16">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between mb-10">
          <h2 className="text-3xl font-bold text-primary">
            Gallery
          </h2>

          <button className="bg-primary text-white px-5 py-2 rounded-full">
            All Media
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {media.length > 0 ? (
            media.slice(0, 3).map((item) =>
              item.mediaType === "video" ? (
                <video
                  key={item._id}
                  controls
                  src={item.url}
                  className="h-96 w-full rounded-3xl object-cover"
                />
              ) : (
                <img
                  key={item._id}
                  src={item.url}
                  alt={item.title || "Gallery"}
                  className="h-96 w-full rounded-3xl object-cover"
                />
              )
            )
          ) : (
            <>
              <div className="h-96 bg-gray-200 rounded-3xl animate-pulse"></div>
              <div className="h-96 bg-gray-200 rounded-3xl animate-pulse"></div>
              <div className="h-96 bg-gray-200 rounded-3xl animate-pulse"></div>
            </>
          )}

        </div>

      </div>
    </section>
  );
}