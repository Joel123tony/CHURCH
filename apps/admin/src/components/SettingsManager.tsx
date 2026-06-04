import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { MediaUploadField } from "./MediaUploadField";

type Settings = {
  churchName: string;
  shortName?: string;
  fullName?: string;
  address?: string;
  location?: string;
  primaryLanguage?: string;
  secondaryLanguage?: string;
  youtubeChannel?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  about?: string;
  mission?: string;
  vision?: string;
  welcomeMessage?: string;
  communityFocus?: string[];
  logoUrl?: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  heroBanner?: string;
  footer: {
    text: string;
    copyright: string;
  };
  socialLinks: Array<{ label: string; href: string }>;
  homepageLayout: string[];
  navItems: Array<{ label: string; href: string; visible: boolean }>;
  lastContentChangeAt?: string;
};

type Props = {
  title: string;
  description: string;
};

export function SettingsManager({ title, description }: Props) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["public", "site-settings"],
    queryFn: () => apiFetch<Settings>("/api/public/site")
  });

  const [form, setForm] = useState<Settings | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form) return null;
      return apiFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(form)
      });
    },
    onMutate: () => {
      setNotice(null);
      setError(null);
    },
    onSuccess: async () => {
      setNotice("Settings saved successfully.");
      await queryClient.invalidateQueries({ queryKey: ["public"] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to save settings");
    }
  });

  if (!form) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white/60">Loading settings...</div>;
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-gold/80">{title}</p>
          <h2 className="mt-3 text-3xl font-semibold">Church Settings</h2>
          <p className="mt-2 text-sm text-white/70">{description}</p>
        </div>
        <button onClick={() => mutation.mutate()} className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink">
          Save Settings
        </button>
      </div>

      {notice ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Branding</legend>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>Church Name</span>
              <input value={form.churchName} onChange={(event) => setForm({ ...form, churchName: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <MediaUploadField
              label="Logo"
              type="image"
              value={form.logoUrl ?? ""}
              onChange={(value) => setForm({ ...form, logoUrl: value })}
              helperText="Upload the church logo for the public site."
            />
            <MediaUploadField
              label="Hero Banner"
              type="image"
              value={form.heroBanner ?? ""}
              onChange={(value) => setForm({ ...form, heroBanner: value })}
              helperText="Upload the hero image shown at the top of the homepage."
            />
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Church Profile</legend>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>Short Name</span>
              <input value={form.shortName ?? ""} onChange={(event) => setForm({ ...form, shortName: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Full Name</span>
              <input value={form.fullName ?? ""} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Address</span>
              <textarea value={form.address ?? ""} onChange={(event) => setForm({ ...form, address: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Location</span>
              <input value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Primary Language</span>
              <input value={form.primaryLanguage ?? ""} onChange={(event) => setForm({ ...form, primaryLanguage: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Secondary Language</span>
              <input value={form.secondaryLanguage ?? ""} onChange={(event) => setForm({ ...form, secondaryLanguage: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Colors</legend>
          <div className="mt-4 grid gap-4">
            {(["primary", "accent", "background", "surface"] as const).map((key) => (
              <label key={key} className="grid gap-2 text-sm">
                <span className="capitalize">{key}</span>
                <input
                  value={form.colors[key]}
                  onChange={(event) => setForm({ ...form, colors: { ...form.colors, [key]: event.target.value } })}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Message & Mission</legend>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>About</span>
              <textarea value={form.about ?? ""} onChange={(event) => setForm({ ...form, about: event.target.value })} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Mission</span>
              <textarea value={form.mission ?? ""} onChange={(event) => setForm({ ...form, mission: event.target.value })} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Vision</span>
              <textarea value={form.vision ?? ""} onChange={(event) => setForm({ ...form, vision: event.target.value })} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Welcome Message</span>
              <textarea value={form.welcomeMessage ?? ""} onChange={(event) => setForm({ ...form, welcomeMessage: event.target.value })} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Community Focus</span>
              <textarea
                value={(form.communityFocus ?? []).join(", ")}
                onChange={(event) => setForm({ ...form, communityFocus: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean) })}
                className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Typography</legend>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>Heading Font</span>
              <input value={form.typography.heading} onChange={(event) => setForm({ ...form, typography: { ...form.typography, heading: event.target.value } })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Body Font</span>
              <input value={form.typography.body} onChange={(event) => setForm({ ...form, typography: { ...form.typography, body: event.target.value } })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Social Links</legend>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>YouTube Channel</span>
              <input value={form.youtubeChannel ?? ""} onChange={(event) => setForm({ ...form, youtubeChannel: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Facebook</span>
              <input value={form.facebookUrl ?? ""} onChange={(event) => setForm({ ...form, facebookUrl: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Instagram</span>
              <input value={form.instagramUrl ?? ""} onChange={(event) => setForm({ ...form, instagramUrl: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Footer</legend>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>Footer Text</span>
              <input value={form.footer.text} onChange={(event) => setForm({ ...form, footer: { ...form.footer, text: event.target.value } })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Copyright</span>
              <input value={form.footer.copyright} onChange={(event) => setForm({ ...form, footer: { ...form.footer, copyright: event.target.value } })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" />
            </label>
          </div>
        </fieldset>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Navigation</legend>
          <div className="mt-4 space-y-3">
            {form.navItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={item.label}
                  onChange={(event) => {
                    const next = [...form.navItems];
                    next[index] = { ...item, label: event.target.value };
                    setForm({ ...form, navItems: next });
                  }}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
                <input
                  value={item.href}
                  onChange={(event) => {
                    const next = [...form.navItems];
                    next[index] = { ...item, href: event.target.value };
                    setForm({ ...form, navItems: next });
                  }}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={(event) => {
                      const next = [...form.navItems];
                      next[index] = { ...item, visible: event.target.checked };
                      setForm({ ...form, navItems: next });
                    }}
                  />
                  Visible
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <legend className="px-2 text-sm font-semibold text-gold">Homepage Layout</legend>
          <textarea
            value={form.homepageLayout.join(", ")}
            onChange={(event) => setForm({ ...form, homepageLayout: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean) })}
            className="mt-4 min-h-44 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
          />
        </fieldset>
      </div>
    </div>
  );
}
