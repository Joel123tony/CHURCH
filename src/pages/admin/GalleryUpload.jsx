import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import API from "../../api/axios";

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getCompressionOptions = (sizeInBytes) => {
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB <= 1) {
    return {
      maxSizeMB: 0.95,
      maxWidthOrHeight: 1920,
      initialQuality: 0.95,
      useWebWorker: true,
    };
  }

  if (sizeInMB <= 5) {
    return {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2200,
      initialQuality: 0.92,
      useWebWorker: true,
    };
  }

  if (sizeInMB <= 15) {
    return {
      maxSizeMB: 2.5,
      maxWidthOrHeight: 2600,
      initialQuality: 0.9,
      useWebWorker: true,
    };
  }

  return {
    maxSizeMB: 4,
    maxWidthOrHeight: 3200,
    initialQuality: 0.88,
    useWebWorker: true,
  };
};

export default function GalleryUpload({ onSuccess }) {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("idle");
  const [previewFile, setPreviewFile] = useState(null);

  const totalBytes = useMemo(
    () => files.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [files]
  );

  const onDrop = useCallback(async (acceptedFiles) => {
    const processed = await Promise.all(
      acceptedFiles.map(async (file) => {
        const originalSize = file.size || 0;

        if (file.type.startsWith("image/")) {
          const compressed = await imageCompression(
            file,
            getCompressionOptions(originalSize)
          );

          return {
            file: compressed,
            preview: URL.createObjectURL(compressed),
            originalSize,
            compressedSize: compressed.size || originalSize,
            label:
              compressed.size && compressed.size < originalSize
                ? `Compressed ${formatBytes(originalSize)} → ${formatBytes(compressed.size)}`
                : `Image ${formatBytes(originalSize)}`,
          };
        }

        return {
          file,
          preview: URL.createObjectURL(file),
          originalSize,
          compressedSize: originalSize,
          label: `Video ${formatBytes(originalSize)}`,
        };
      })
    );

    setFiles((prev) => [...prev, ...processed]);
    toast.info(`Added ${processed.length} file(s) to the queue`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
      "video/*": [],
    },
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (!files.length) {
      toast.error("Please select files");
      return;
    }

    try {
      setUploading(true);
      setUploadStage("uploading");
      setUploadProgress(0);

      const createdItems = [];
      const grandTotalBytes = totalBytes || 1;
      let completedBytes = 0;

      for (const item of files) {
        const formData = new FormData();
        const fileBytes = item.file?.size || 0;
        const baseBytes = completedBytes;

        formData.append("file", item.file);
        formData.append("title", title || "Untitled");
        formData.append("eventDate", eventDate || "");

        const res = await API.post("/gallery", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            if (!event.total) return;

            const currentFileLoaded = Math.min(
              event.loaded || 0,
              event.total || fileBytes || 1
            );
            const currentBytes =
              baseBytes + (currentFileLoaded / event.total) * (fileBytes || event.total);
            const nextProgress = Math.min(
              99,
              (currentBytes / grandTotalBytes) * 100
            );

            setUploadProgress(nextProgress);
          },
        });

        createdItems.push(res?.data?.data);
        completedBytes += fileBytes;
        setUploadProgress((completedBytes / grandTotalBytes) * 100);
      }

      setFiles([]);
      setTitle("");
      setEventDate("");
      setUploadProgress(100);
      setUploadStage("done");

      if (onSuccess) {
        onSuccess(createdItems);
      }

      toast.success(`Uploaded ${createdItems.length} media item(s) successfully`);

      setTimeout(() => {
        setUploadStage("idle");
        setUploadProgress(0);
      }, 1200);
    } catch (err) {
      console.error(err);
      setUploadStage("error");
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded-lg p-3"
      />

      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="w-full border rounded-lg p-3"
      />

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-500 ${
          isDragActive
            ? "bg-blue-50 border-blue-400 scale-[1.01]"
            : "bg-gray-50 hover:bg-gray-100 border-gray-200"
        } ${uploading ? "animate-pulse" : ""}`}
      >
        <input {...getInputProps()} />

        <p className="font-semibold text-lg">
          Drag & Drop Images / Videos
        </p>

        <p className="text-sm text-gray-500 mt-2">
          or click to browse files
        </p>

        {!!files.length && (
          <div className="mt-4 mx-auto max-w-md">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>{files.length} file(s) ready</span>
              <span>{formatBytes(totalBytes)}</span>
            </div>

            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  uploadStage === "error"
                    ? "bg-red-500"
                    : uploadStage === "done"
                      ? "bg-green-500"
                      : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(100, uploadProgress)}%` }}
              />
            </div>

            {uploading && (
              <p className="mt-2 text-xs text-blue-700">
                Uploading based on total file size...
              </p>
            )}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="relative bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 transition-transform duration-300 hover:-translate-y-1"
            >
              {item.file.type.startsWith("video") ? (
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

              <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                {item.label}
              </div>

              <button
                type="button"
                onClick={() => setPreviewFile(item)}
                className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-3 py-1 rounded hover:bg-black"
              >
                Full View
              </button>

              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={uploadAll}
        disabled={uploading}
        className={`px-6 py-3 rounded-lg text-white transition-all duration-300 disabled:opacity-50 ${
          uploading
            ? "bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {uploading
          ? `Uploading ${Math.round(uploadProgress)}%`
          : `Upload ${files.length || ""} Media`}
      </button>

      {previewFile && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-3 right-3 z-20 bg-white text-black px-3 py-1 rounded"
            >
              ×
            </button>

            {previewFile.file.type.startsWith("video") ? (
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
