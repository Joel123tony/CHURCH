import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { MediaUploadField } from "./MediaUploadField";
import type { FieldSpec } from "./RecordManager";

type Section = {
  id: string;
  pageSlug: string;
  key: string;
  title: string;
  subtitle?: string;
  description?: string;
  richText?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  ctaButtons: Array<{ label: string; link: string }>;
  blocks: Array<Record<string, unknown>>;
  order: number;
  hidden: boolean;
  published: boolean;
};

const fields: FieldSpec[] = [
  { name: "pageSlug", label: "Page Slug", type: "text", placeholder: "home" },
  { name: "key", label: "Section Key", type: "text", placeholder: "hero" },
  { name: "title", label: "Title", type: "text" },
  { name: "subtitle", label: "Subtitle", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "richText", label: "Rich Text", type: "textarea" },
  { name: "backgroundImage", label: "Background Image", type: "image", placeholder: "Upload or paste an image URL" },
  { name: "backgroundVideo", label: "Background Video", type: "video", placeholder: "Upload or paste a video URL" },
  { name: "ctaButtons", label: "CTA Buttons JSON", type: "json" },
  { name: "blocks", label: "Blocks JSON", type: "json" },
  { name: "order", label: "Order", type: "number" },
  { name: "hidden", label: "Hidden", type: "checkbox" },
  { name: "published", label: "Published", type: "checkbox" }
];

const defaultItem = {
  pageSlug: "home",
  order: "0",
  hidden: false,
  published: false,
  ctaButtons: "[]",
  blocks: "[]"
};

function parseJsonList(value: string | boolean) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  return JSON.parse(text);
}

export function SectionManager() {
  const queryClient = useQueryClient();
  const [pageSlug, setPageSlug] = useState("home");
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({ ...defaultItem });
  const [ordered, setOrdered] = useState<Section[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["sections", pageSlug],
    queryFn: () => apiFetch<Section[]>(`/api/sections?pageSlug=${encodeURIComponent(pageSlug)}`)
  });

  useEffect(() => {
    setOrdered(data ?? []);
  }, [data]);

  useEffect(() => {
    if (!editing) {
      setForm({ ...defaultItem });
      return;
    }

    setForm({
      pageSlug: editing.pageSlug,
      key: editing.key,
      title: editing.title,
      subtitle: editing.subtitle ?? "",
      description: editing.description ?? "",
      richText: editing.richText ?? "",
      backgroundImage: editing.backgroundImage ?? "",
      backgroundVideo: editing.backgroundVideo ?? "",
      ctaButtons: JSON.stringify(editing.ctaButtons ?? [], null, 2),
      blocks: JSON.stringify(editing.blocks ?? [], null, 2),
      order: String(editing.order ?? 0),
      hidden: Boolean(editing.hidden),
      published: Boolean(editing.published)
    });
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pageSlug: String(form.pageSlug ?? "home"),
        key: String(form.key ?? ""),
        title: String(form.title ?? ""),
        subtitle: String(form.subtitle ?? ""),
        description: String(form.description ?? ""),
        richText: String(form.richText ?? ""),
        backgroundImage: String(form.backgroundImage ?? ""),
        backgroundVideo: String(form.backgroundVideo ?? ""),
        ctaButtons: parseJsonList(form.ctaButtons),
        blocks: parseJsonList(form.blocks),
        order: Number(form.order ?? 0),
        hidden: Boolean(form.hidden),
        published: Boolean(form.published)
      };

      if (editing) {
        return apiFetch<Section>(`/api/sections/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }

      return apiFetch<Section>("/api/sections", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["sections", pageSlug] });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: Section[]) =>
      apiFetch("/api/sections/reorder", {
        method: "PUT",
        body: JSON.stringify({
          items: items.map((item, index) => ({ id: item.id, order: index }))
        })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sections", pageSlug] });
    }
  });

  const summary = useMemo(() => ordered, [ordered]);

  function moveSection(fromId: string, toId: string) {
    const fromIndex = ordered.findIndex((item) => item.id === fromId);
    const toIndex = ordered.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const next = [...ordered];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrdered(next);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Section Builder</p>
            <h2 className="mt-3 text-3xl font-semibold">Homepage and Page Sections</h2>
            <p className="mt-2 text-sm text-white/70">
              Create sections, upload images or videos for backgrounds, hide/publish them, and reorder with drag and drop.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="grid gap-2 text-sm">
              <span className="text-white/60">Page</span>
              <select
                value={pageSlug}
                onChange={(event) => setPageSlug(event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none"
              >
                {["home", "about", "ministries", "events", "gallery", "pastors", "contact", "sermons"].map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => setEditing(null)} className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink">
              New Section
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-gold/80">{editing ? "Edit Section" : "Create Section"}</p>
          <div className="mt-5 grid gap-4">
            {fields.map((field) => {
              if (field.type === "image" || field.type === "video") {
                return (
                  <MediaUploadField
                    key={field.name}
                    label={field.label}
                    type={field.type}
                    value={String(form[field.name] ?? "")}
                    onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                    helperText={field.placeholder}
                  />
                );
              }

              return (
                <label key={field.name} className="grid gap-2 text-sm">
                  <span className="text-white/75">{field.label}</span>
                  {field.type === "textarea" || field.type === "json" ? (
                    <textarea
                      value={String(form[field.name] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none"
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.name])}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))}
                      className="h-5 w-5 rounded border-white/20 bg-black/20"
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={String(form[field.name] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(form[field.name] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none"
                    />
                  )}
                </label>
              );
            })}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => saveMutation.mutate()} className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink">
              {editing ? "Update" : "Create"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-pearl"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Order</p>
              <h3 className="mt-3 text-3xl font-semibold">Drag and Drop</h3>
            </div>
            <button
              onClick={() => reorderMutation.mutate(ordered)}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-pearl"
            >
              Save Order
            </button>
          </div>
          <div className="mt-6 grid gap-4">
            {summary.map((section) => (
              <article
                key={section.id}
                draggable
                onDragStart={() => setDragId(section.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dragId && moveSection(dragId, section.id)}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
                      {section.pageSlug} · {section.key}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-pearl">{section.title}</h4>
                    <p className="mt-2 text-sm text-white/65">
                      {section.subtitle} {section.hidden ? "· Hidden" : ""} {section.published ? "· Published" : "· Draft"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditing(section)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await apiFetch(`/api/sections/${section.id}/duplicate`, { method: "POST" });
                        await queryClient.invalidateQueries({ queryKey: ["sections", pageSlug] });
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={async () => {
                        await apiFetch(`/api/sections/${section.id}/publish`, { method: "POST" });
                        await queryClient.invalidateQueries({ queryKey: ["sections", pageSlug] });
                      }}
                      className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200"
                    >
                      Publish
                    </button>
                    <button
                      onClick={async () => {
                        await apiFetch(`/api/sections/${section.id}/hide`, { method: "POST" });
                        await queryClient.invalidateQueries({ queryKey: ["sections", pageSlug] });
                      }}
                      className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200"
                    >
                      Hide
                    </button>
                    <button
                      onClick={async () => {
                        await apiFetch(`/api/sections/${section.id}`, { method: "DELETE" });
                        await queryClient.invalidateQueries({ queryKey: ["sections", pageSlug] });
                      }}
                      className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
