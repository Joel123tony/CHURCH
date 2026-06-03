import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

type MediaAsset = {
  id: string;
  type: "image" | "video";
  url: string;
  publicId: string;
  thumbUrl?: string;
};

export function MediaManager() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ["media"],
    queryFn: () => apiFetch<MediaAsset[]>("/api/media")
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        return apiFetch("/api/media/upload", {
          method: "POST",
          body: formData
        });
      }

      return apiFetch("/api/media", {
        method: "POST",
        body: JSON.stringify({
          type: "image",
          url,
          publicId: url || "manual-upload",
          thumbUrl: url
        })
      });
    },
    onSuccess: async () => {
      setUrl("");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["media"] });
    }
  });

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Media Manager</p>
          <h2 className="mt-3 text-3xl font-semibold">Cloudinary Assets</h2>
          <p className="mt-2 text-sm text-white/70">Upload images and videos, or register a URL manually for mock/local testing.</p>
        </div>
        <button onClick={() => uploadMutation.mutate()} className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink">
          Upload
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <label className="grid gap-2 text-sm">
          <span>Asset URL</span>
          <input value={url} onChange={(event) => setUrl(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="https://..." />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Or upload file</span>
          <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
            {asset.type === "image" ? <img src={asset.thumbUrl ?? asset.url} alt={asset.publicId} className="h-52 w-full object-cover" /> : <video src={asset.url} controls className="h-52 w-full object-cover" />}
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{asset.type}</p>
              <p className="mt-2 break-all text-xs text-white/60">{asset.url}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

