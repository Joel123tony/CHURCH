import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import API from "../../api/axios";
import imageCompression from "browser-image-compression";

export default function GalleryUpload({ onSuccess }) {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [uploading, setUploading] = useState(false);

  /* FULLSCREEN PREVIEW */
  const [previewFile, setPreviewFile] = useState(null);

  /* =========================
     DROP
  ========================= */
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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
      "video/*": [],
    },
  });

  /* =========================
     REMOVE FILE
  ========================= */
  const removeFile = (index) => {
    setFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* =========================
     UPLOAD ALL
  ========================= */
  const uploadAll = async () => {
    if (!files.length) {
      alert("Please select files");
      return;
    }

    try {
      setUploading(true);

      const createdItems = [];

      for (const item of files) {
        const formData = new FormData();

        formData.append("file", item.file);
        formData.append(
          "title",
          title || "Untitled"
        );
        formData.append(
          "eventDate",
          eventDate || ""
        );

        const res = await API.post(
          "/gallery",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        createdItems.push(res?.data?.data);
      }

      setFiles([]);
      setTitle("");
      setEventDate("");

      if (onSuccess) {
        onSuccess(createdItems);
      }

      alert("Upload successful");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* TITLE */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        className="w-full border rounded-lg p-3"
      />

      {/* EVENT DATE */}
      <input
        type="date"
        value={eventDate}
        onChange={(e) =>
          setEventDate(e.target.value)
        }
        className="w-full border rounded-lg p-3"
      />

      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
      >
        <input {...getInputProps()} />

        <p className="font-semibold text-lg">
          Drag & Drop Images / Videos
        </p>

        <p className="text-sm text-gray-500 mt-2">
          or click to browse files
        </p>
      </div>

      {/* PREVIEW GRID */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((item, index) => (
            <div
              key={index}
              className="relative bg-white rounded-xl overflow-hidden shadow"
            >
              {item.file.type.startsWith(
                "video"
              ) ? (
                <video
                  src={item.preview}
                  className="w-full h-32 object-cover"
                  muted
                />
              ) : (
                <img
                  src={item.preview}
                  alt=""
                  className="w-full h-32 object-cover"
                />
              )}

              {/* FULL VIEW */}
              <button
                type="button"
                onClick={() =>
                  setPreviewFile(item)
                }
                className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-3 py-1 rounded hover:bg-black"
              >
                Full View
              </button>

              {/* REMOVE */}
              <button
                type="button"
                onClick={() =>
                  removeFile(index)
                }
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD BUTTON */}
      <button
        onClick={uploadAll}
        disabled={uploading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {uploading
          ? "Uploading..."
          : `Upload ${files.length || ""} Media`}
      </button>

      {/* =========================
          FULLSCREEN PREVIEW
      ========================= */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={() =>
            setPreviewFile(null)
          }
        >
          <div
            className="relative max-w-6xl w-full"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* CLOSE */}
            <button
              onClick={() =>
                setPreviewFile(null)
              }
              className="absolute top-3 right-3 z-20 bg-white text-black px-3 py-1 rounded"
            >
              ✕
            </button>

            {previewFile.file.type.startsWith(
              "video"
            ) ? (
              <video
                src={previewFile.preview}
                controls
                autoPlay
                className="w-full max-h-[85vh] rounded-lg bg-black"
              />
            ) : (
              <img
                src={previewFile.preview}
                alt=""
                className="w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}