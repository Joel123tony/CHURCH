import { useRef, useState } from "react";
import { getStoredAuthTokens } from "../lib/auth";

type MediaUploadFieldProps = {
  label: string;
  value: string;
  type: "image" | "video";
  onChange: (value: string) => void;
  helperText?: string;
};

type UploadResponse = {
  asset?: { url?: string; type?: "image" | "video"; thumbUrl?: string };
  uploaded?: { url?: string; type?: "image" | "video"; thumbUrl?: string };
  url?: string;
};

function uploadFileWithProgress(file: File, onProgress: (progress: number) => void) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
  const tokens = getStoredAuthTokens();

  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/media/upload`);
    xhr.withCredentials = true;

    if (tokens?.accessToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${tokens.accessToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || `Upload failed with ${xhr.status}`));
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText) as UploadResponse);
      } catch {
        reject(new Error("Upload response was not valid JSON"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export function MediaUploadField({ label, value, type, onChange, helperText }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const accept = type === "image" ? "image/*" : "video/*";
  const preview = value;

  function validate(file: File) {
    if (type === "image" && !file.type.startsWith("image/")) {
      return "Please choose an image file.";
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      return "Please choose a video file.";
    }
    const maxSize = type === "video" ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${type === "video" ? "100 MB" : "15 MB"}.`;
    }
    return null;
  }

  async function handleFile(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      setStatus(null);
      setProgress(0);
      return;
    }

    setUploading(true);
    setError(null);
    setStatus("Uploading...");
    setProgress(0);

    try {
      const response = await uploadFileWithProgress(file, setProgress);
      const nextUrl = response.asset?.url ?? response.uploaded?.url ?? response.url ?? "";
      if (nextUrl) {
        onChange(nextUrl);
        setStatus("Upload complete.");
      } else {
        setError("Upload succeeded but no file URL was returned.");
        setStatus(null);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      setStatus(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/85">{label}</p>
          {helperText ? <p className="mt-1 text-xs text-white/50">{helperText}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-pearl transition hover:border-gold/40 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setStatus(null);
              setError(null);
              setProgress(0);
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-pearl transition hover:border-gold/40"
          >
            Clear
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void handleFile(file);
        }}
        className="hidden"
      />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`https://.../${type}`}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none placeholder:text-white/30"
      />

      {uploading ? (
        <div className="overflow-hidden rounded-full border border-white/10 bg-white/5">
          <div className="h-2 bg-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
      {error ? <p className="text-xs text-red-200">{error}</p> : null}

      {preview ? (
        type === "image" ? (
          <img src={preview} alt={label} className="h-40 w-full rounded-2xl object-cover" />
        ) : (
          <video src={preview} controls className="h-40 w-full rounded-2xl object-cover" />
        )
      ) : null}
    </div>
  );
}
