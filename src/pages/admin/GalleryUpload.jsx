import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { FaCloudUploadAlt, FaInfoCircle, FaTimes, FaCheckCircle, FaSpinner } from "react-icons/fa";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function GalleryUpload({ onSuccess }) {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("idle"); // idle, processing, done, error
  const [previewFile, setPreviewFile] = useState(null);

  const totalBytes = useMemo(
    () => files.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [files]
  );

  const totalSavedBytes = useMemo(() => {
    return files.reduce((sum, item) => {
      if (item.compressionStats?.savings) return sum + item.compressionStats.savings;
      if (item.estimatedSavings) return sum + item.estimatedSavings;
      return sum;
    }, 0);
  }, [files]);

  const totalCompressedBytes = totalBytes - totalSavedBytes;

  const onDrop = useCallback((acceptedFiles) => {
    const processed = acceptedFiles.map((file) => {
      const originalSize = file.size || 0;
      const isImage = file.type.startsWith("image/");
      const ext = file.name.split('.').pop()?.toUpperCase() || (isImage ? "IMAGE" : "VIDEO");
      
      // Rough estimation for UI feedback
      const estimatedRatio = isImage ? 0.35 : 0.45;
      const estimatedCompressedSize = originalSize * estimatedRatio;
      const estimatedSavings = originalSize - estimatedCompressedSize;

      return {
        file,
        preview: URL.createObjectURL(file),
        originalSize,
        ext,
        estimatedCompressedSize,
        estimatedSavings,
        compressionStats: null
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
      setUploadStage("processing");
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
          timeout: 5 * 60 * 1000,
          onUploadProgress: (event) => {
            if (!event.total) return;
            const currentFileLoaded = Math.min(event.loaded || 0, event.total || fileBytes || 1);
            const currentBytes = baseBytes + (currentFileLoaded / event.total) * (fileBytes || event.total);
            const nextProgress = Math.min(99, (currentBytes / grandTotalBytes) * 100);
            setUploadProgress(nextProgress);
          },
        });

        setFiles(prev => prev.map((f, i) => i === index ? { ...f, compressionStats: res.data } : f));
        
        createdItems.push(res.data.data);
        completedBytes += fileBytes;
        setUploadProgress((completedBytes / grandTotalBytes) * 100);
      }

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
        setFiles([]); // Clear UI after success delay
      }, 3000);
    } catch (err) {
      console.error(err);
      setUploadStage("error");
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 sm:space-y-5 w-full overflow-hidden">
      {/* INPUTS - Compact inline row on desktop */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Media Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
          />
        </div>
        <div className="flex-1">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
          />
        </div>
      </div>

      {/* DROPZONE */}
      {!uploading && uploadStage === "idle" && (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center w-full ${
            isDragActive 
              ? "border-[#531B24] bg-[#531B24]/5 scale-[1.01]" 
              : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
          }`}
        >
          <input {...getInputProps()} />
          <FaCloudUploadAlt className={`text-4xl mb-3 transition-transform duration-300 ${isDragActive ? "text-[#531B24] scale-110" : "text-slate-400"}`} />
          <p className="text-sm font-bold text-slate-700 mb-1">
            Drag & Drop Images / Videos
          </p>
          <p className="text-xs text-slate-500 mb-3">or tap/click to browse files</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest break-words w-full px-2">
            JPG • PNG • WEBP • MP4 • MOV • AVI • WEBM
          </p>
        </div>
      )}

      {/* FILE PREVIEW CARDS */}
      {files.length > 0 && (
        <div className="space-y-3 w-full">
          {files.map((item, index) => {
            const isVideo = item.file.type.startsWith("video");
            const isDone = item.compressionStats && uploadStage === "done";
            
            const origSizeStr = formatBytes(item.originalSize);
            const compSizeStr = item.compressionStats 
              ? formatBytes(item.compressionStats.compressedSize) 
              : formatBytes(item.estimatedCompressedSize);
            const percentStr = item.compressionStats
              ? `${item.compressionStats.savingsPercentage}%`
              : `~${Math.round((item.estimatedSavings / item.originalSize) * 100)}%`;

            return (
              <div
                key={`${item.file.name}-${index}`}
                className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-start sm:hidden w-full mb-1">
                  <p className="text-xs font-bold text-slate-800 truncate pr-4 w-full">{item.file.name}</p>
                  {!uploading && uploadStage !== "done" && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-1"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>

                <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer self-start sm:self-center" onClick={() => setPreviewFile(item)}>
                  {isVideo ? (
                    <video src={item.preview} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="hidden sm:flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-slate-800 truncate pr-4">{item.file.name}</p>
                    {!uploading && uploadStage !== "done" && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-slate-500 font-medium mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.ext}</span>
                    <span>{origSizeStr}</span>
                  </div>

                  <div className="text-[10px] flex flex-wrap items-center gap-1.5 font-semibold">
                    {isDone ? (
                      <span className="text-emerald-600 flex items-center gap-1"><FaCheckCircle /> Compressed to {compSizeStr} (Saved {percentStr})</span>
                    ) : (
                      <span className="text-[#531B24] break-words whitespace-normal">Will compress to ~{compSizeStr} (Save {percentStr})</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD & COMPRESSION PANEL */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between pt-4 border-t border-slate-100 mt-2">
          
          {/* Compression Info / Progress */}
          <div className="flex-1 w-full bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 overflow-hidden">
            {uploadStage === "idle" && (
              <>
                <div className="flex items-center gap-2 sm:contents">
                  <FaInfoCircle className="text-slate-400 text-lg shrink-0" />
                  <p className="text-xs font-bold text-slate-700 sm:hidden">Compression enabled</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 hidden sm:block">Compression enabled</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate max-w-full">Original {formatBytes(totalBytes)} → Estimated {formatBytes(totalCompressedBytes)}</p>
                </div>
              </>
            )}
            
            {uploadStage === "processing" && (
              <div className="w-full">
                <div className="flex justify-between items-end mb-1.5">
                  <p className="text-xs font-bold text-[#531B24] flex items-center gap-1.5">
                    <FaSpinner className="animate-spin" /> Compressing & Uploading...
                  </p>
                  <span className="text-[10px] font-bold text-[#531B24]">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#531B24]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#531B24] transition-all duration-300"
                    style={{ width: `${Math.min(100, uploadProgress)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mt-1.5 text-right">Optimizing {files.length} file(s)</p>
              </div>
            )}

            {uploadStage === "done" && (
              <>
                <FaCheckCircle className="text-emerald-500 text-lg shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-700">Upload Complete</p>
                  <p className="text-[10px] text-emerald-600 leading-tight mt-0.5">
                    Original {formatBytes(totalBytes)} → Stored {formatBytes(totalCompressedBytes)}
                  </p>
                </div>
              </>
            )}
            
            {uploadStage === "error" && (
              <>
                <FaTimes className="text-red-500 text-lg shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700">Upload Failed</p>
                  <p className="text-[10px] text-red-600 leading-tight mt-0.5">Check network and try again.</p>
                </div>
              </>
            )}
          </div>

          {/* Upload Button */}
          {uploadStage !== "done" && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-[#531B24] rounded-lg hover:bg-[#40151c] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 shrink-0"
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin" /> Processing
                </>
              ) : (
                <>
                  ↑ Upload {files.length} Media
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* FULLSCREEN PREVIEW */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative flex flex-col items-center justify-center max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white transition-colors"
            >
              <FaTimes size={16} />
            </button>
            {previewFile.file.type.startsWith("video") ? (
              <video src={previewFile.preview} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl" />
            ) : (
              <img src={previewFile.preview} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
