import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

export default function Gallery() {
  const { t } = useLanguage();
  const [featuredMedia, setFeaturedMedia] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);

        const [featuredRes, allRes] = await Promise.all([
          API.get("/gallery/client"),
          API.get("/gallery"),
        ]);

        setFeaturedMedia(featuredRes?.data?.data || []);
        setAllMedia(allRes?.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const filteredMedia = useMemo(() => {
    return allMedia.filter((item) =>
      item.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [allMedia, search]);

  return (
    <>
      <section className="py-16 bg-[#F4EFE7]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#54091b]">{t("gallery.title")}</h2>

            <button
              onClick={() => setOpenModal(true)}
              className="bg-[#54091b] text-white px-5 py-2 rounded-lg"
            >
              {t("gallery.allMedia")}
            </button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-5">
              {featuredMedia.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl overflow-hidden shadow-lg"
                >
                  {item.mediaType === "video" ? (
                    <video
                      src={item.url}
                      controls
                      className="w-full h-72 object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-72 object-cover cursor-pointer"
                      onClick={() => setSelectedMedia(item)}
                    />
                  )}

                  <div className="p-3">
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {openModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-6">
              <h2 className="text-white text-3xl font-bold">{t("gallery.title")}</h2>

              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder={t("gallery.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-4 py-2 rounded-lg w-full md:w-80"
                />

                <button
                  onClick={() => setOpenModal(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  {t("gallery.close")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredMedia.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl overflow-hidden shadow"
                >
                  {item.mediaType === "video" ? (
                    <video
                      src={item.url}
                      controls
                      className="w-full h-60 object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-60 object-cover cursor-pointer"
                      onClick={() => setSelectedMedia(item)}
                    />
                  )}

                  <div className="p-3">
                    <h3 className="font-semibold">{item.title}</h3>

                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-3 right-3 bg-white text-black px-3 py-1 rounded z-20"
            >
              {t("gallery.closeViewer")}
            </button>

            {selectedMedia.mediaType === "video" ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="w-full max-h-[85vh]"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.title}
                className="w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
