import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { MediaUploadField } from "./MediaUploadField";

export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "date" | "url" | "csv" | "json" | "select" | "image" | "video";
  placeholder?: string;
  options?: string[];
};

type RecordManagerProps<T extends Record<string, any>> = {
  title: string;
  description: string;
  endpoint: string;
  itemKey: keyof T & string;
  summaryKeys: Array<keyof T & string>;
  fields: FieldSpec[];
  createDefaults?: Partial<T>;
  parse?: (value: Record<string, string | boolean>) => Partial<T>;
  format?: (item: T) => Record<string, string | boolean>;
};

function emptyForm(fields: FieldSpec[]) {
  return fields.reduce<Record<string, string | boolean>>((acc, field) => {
    acc[field.name] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});
}

function stringifyValue(value: unknown, field: FieldSpec) {
  if (field.type === "checkbox") return Boolean(value);
  if (value == null) return "";
  if (field.type === "csv" && Array.isArray(value)) return value.join(", ");
  if (field.type === "json") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseValue(value: string | boolean, field: FieldSpec) {
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "number") return value === "" ? undefined : Number(value);
  if (field.type === "csv") return String(value).split(",").map((entry) => entry.trim()).filter(Boolean);
  if (field.type === "json") {
    const text = String(value).trim();
    if (!text) return undefined;
    return JSON.parse(text);
  }
  return String(value);
}

export function RecordManager<T extends Record<string, any>>({
  title,
  description,
  endpoint,
  itemKey,
  summaryKeys,
  fields,
  createDefaults,
  parse,
  format
}: RecordManagerProps<T>) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyForm(fields));

  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => apiFetch<T[]>(endpoint)
  });

  useEffect(() => {
    if (!editing) {
      setForm({ ...emptyForm(fields), ...(createDefaults ?? {}) } as Record<string, string | boolean>);
      return;
    }

    const mapped = format
      ? format(editing)
      : fields.reduce<Record<string, string | boolean>>((acc, field) => {
          acc[field.name] = stringifyValue(editing[field.name], field);
          return acc;
        }, {});

    setForm({ ...emptyForm(fields), ...mapped });
  }, [createDefaults, editing, fields, format]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = fields.reduce<Record<string, unknown>>((acc, field) => {
        const value = form[field.name] ?? "";
        acc[field.name] = parse ? parse(form)[field.name] : parseValue(value, field);
        return acc;
      }, {});

      const body = { ...(createDefaults ?? {}), ...payload };
      if (editing) {
        return apiFetch<T>(`${endpoint}/${editing[itemKey]}`, {
          method: "PUT",
          body: JSON.stringify(body)
        });
      }

      return apiFetch<T>(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: [endpoint] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: T) => apiFetch(`${endpoint}/${item[itemKey]}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [endpoint] });
    }
  });

  const items = useMemo(() => data ?? [], [data]);

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-gold/80">{title}</p>
        <h2 className="mt-3 text-3xl font-semibold">{editing ? "Edit Item" : "Create Item"}</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>

        <div className="mt-6 grid gap-4">
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
                <span className="text-white/80">{field.label}</span>
                {field.type === "textarea" || field.type === "json" ? (
                  <textarea
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none placeholder:text-white/30"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none"
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.name])}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))}
                    className="h-5 w-5 rounded border-white/20 bg-black/20"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-pearl outline-none placeholder:text-white/30"
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02] disabled:opacity-60"
          >
            {editing ? "Update" : "Create"}
          </button>
          <button
            onClick={() => setEditing(null)}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-pearl transition hover:border-gold/40"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Records</p>
            <h3 className="mt-3 text-3xl font-semibold">{title} List</h3>
          </div>
          <p className="text-sm text-white/60">{isLoading ? "Loading..." : `${items.length} items`}</p>
        </div>

        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article key={String(item[itemKey])} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{String(item[itemKey])}</p>
                  <h4 className="mt-2 text-lg font-semibold text-pearl">
                    {summaryKeys.map((key) => String(item[key] ?? "")).filter(Boolean).join(" · ") || "Untitled"}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(item)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-pearl transition hover:border-gold/40"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item)}
                    className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/40"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-white/70">
                {fields.slice(0, 5).map((field) => (
                  <div key={field.name} className="flex items-start justify-between gap-3">
                    <span className="text-white/45">{field.label}</span>
                    <span className="max-w-[65%] text-right">{String(item[field.name] ?? "")}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!items.length ? <p className="text-sm text-white/50">No items yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
