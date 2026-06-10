import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import API from "../../api/axios";
import imageCompression from "browser-image-compression";

export default function GalleryUpload({ onUpload }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [event, setEvent] = useState("");

  /* ================= DROP ================= */
  const onDrop = useCallback(async (acceptedFiles) => {
    const processed = await Promise.all(
      acceptedFiles.map(async (file) => {
        if (file.type.startsWith("image")) {
          const compressed = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          });

          return {
            file: compressed,
            preview: URL.createObjectURL(compressed),
          };
        }

        return {
          file,
          preview: URL.createObjectURL(file),
        };
      })
    );

    setFiles((prev) => [...prev, ...processed]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
      "video/*": [],
    },
  });

  /* ================= REMOVE ================= */
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= UPLOAD ================= */
  const uploadAll = async () => {
    if (!files.length) return;

    try {
      setUploading(true);

      const uploadedResults = [];

      for (const item of files) {
        const formData = new FormData();
        formData.append("file", item.file);

        const res = await API.post("/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedResults.push({
          ...res.data,
          title,
          date,
          event,
        });
      }

      onUpload(uploadedResults);

      setFiles([]);
      setTitle("");
      setDate("");
      setEvent("");
    } catch (err) {
      console.log("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* METADATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="Event (optional)"
          className="border p-2 rounded"
        />
      </div>

      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <p>Drag & drop images/videos OR click to select</p>
      </div>

      {/* PREVIEW */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((item, index) => (
            <div key={index} className="relative">

              {item.file.type.startsWith("video") ? (
                <video
                  src={item.preview}
                  className="h-24 w-full object-cover rounded"
                />
              ) : (
                <img
                  src={item.preview}
                  className="h-24 w-full object-cover rounded"
                />
              )}

              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white px-2 rounded"
              >
                X
              </button>

            </div>
          ))}
        </div>
      )}

      {/* UPLOAD BUTTON */}
      <button
        onClick={uploadAll}
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {uploading ? "Uploading..." : "Upload All"}
      </button>

    </div>
  );
}