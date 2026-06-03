import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

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

export function MediaUploadField({ label, value, type, onChange, helperText }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch<UploadResponse>("/api/media/upload", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: (response) => {
      const nextUrl = response.asset?.url ?? response.uploaded?.url ?? response.url ?? "";
      if (nextUrl) {
        onChange(nextUrl);
      }
    }
  });

  const accept = type === "image" ? "image/*" : "video/*";
  const preview = value;

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
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-pearl transition hover:border-gold/40"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("");
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
          uploadMutation.mutate(file);
        }}
        className="hidden"
      />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`https://.../${type}`}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none placeholder:text-white/30"
      />

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
