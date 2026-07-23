import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import API from "../../api/axios";
import CompressionBadge from "../../components/CompressionBadge";

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

// Compression is now handled on the backend

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

  const onDrop = useCallback((acceptedFiles) => {
    const processed = acceptedFiles.map((file) => {
      const originalSize = file.size || 0;
      const isImage = file.type.startsWith("image/");
      
      return {
        file,
        preview: URL.createObjectURL(file),
        originalSize,
        label: `${isImage ? "Image" : "Video"} ${formatBytes(originalSize)} (Will compress on upload)`,
      };
    });

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

      for (let index = 0; index < files.length; index++) {
        const item = files[index];
        const formData = new FormData();
        const fileBytes = item.file?.size || 0;
        const baseBytes = completedBytes;

        formData.append("file", item.file);
        formData.append("title", title || "Untitled");
        formData.append("eventDate", eventDate || "");

        const res = await API.post("/gallery", formData, {
          timeout: 5 * 60 * 1000, // 5 minutes max per file
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

        // Keep the file in the UI but update its stats
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, compressionStats: res.data } : f));
        
        createdItems.push(res.data.data);
        completedBytes += fileBytes;
        setUploadProgress((completedBytes / grandTotalBytes) * 100);
      }

      // DO NOT setFiles([]) so the badges remain visible
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
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="admin-input"
      />

      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="admin-input"
      />

      <div
        {...getRootProps()}
        className={`admin-upload-box ${isDragActive ? "border-[#531B24] bg-[#531B24]/5 scale-[1.01]" : ""} ${uploading ? "animate-pulse" : ""}`}
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

              <CompressionBadge stats={item.compressionStats} />
              <div className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur-sm z-10">
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
        className={`admin-btn-primary disabled:opacity-50 ${uploading ? "animate-pulse" : ""}`}
      >
        {uploading
          ? `Uploading ${Math.round(uploadProgress)}%`
          : `Upload ${files.length || ""} Media`}
      </button>

      {previewFile && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative flex flex-col items-center justify-center max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute -top-12 right-0 md:-right-12 md:top-0 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition-colors backdrop-blur-sm z-[110]"
              title="Close Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {previewFile.file.type.startsWith("video") ? (
              <video
                src={previewFile.preview}
                controls
                autoPlay
                className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-xl bg-black object-contain shadow-2xl ring-1 ring-white/20"
              />
            ) : (
              <img
                src={previewFile.preview}
                alt=""
                className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-xl object-contain shadow-2xl ring-1 ring-white/20"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
