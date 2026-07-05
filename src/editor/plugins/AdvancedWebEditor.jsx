import React, { useEffect, useState, useRef } from "react";
import schemas from "../schemas";

// Standard fields
import TextField from "../fields/TextField";
import TextareaField from "../fields/TextareaField";
import ImageField from "../fields/ImageField";
import UrlField from "../fields/UrlField";

// New modules
import ArrayField from "./ArrayField";
import DragDropSections from "../dragdrop/DragDropSections";
import VersionHistory from "../versioning/VersionHistory";
// API & Context
import { getBlock, saveBlock } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useConfirm } from "../../context/ConfirmContext";

// Icons
import {
  FaGlobe,
  FaListOl,
  FaHistory,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaEdit,
  FaPalette,
  FaEye,
  FaChevronDown,
  FaSave,
  FaLayerGroup,
} from "react-icons/fa";

// ─── Section registry ─────────────────────────────────────────────
// Master list of all sections in homepage order (Hero first, Footer last)
const ALL_SECTIONS = [
  { key: "hero", label: "Hero Section" },
  { key: "history", label: "Church History" },
  { key: "events", label: "Events" },
  { key: "gallery", label: "Gallery" },
  { key: "pastor", label: "Pastor" },
  { key: "prayer", label: "Prayer Requests" },
  { key: "testimonials", label: "Pastor's Message" },
  { key: "youtube", label: "YouTube" },
  { key: "books", label: "Books & Pamphlets" },
  { key: "contact", label: "Contact" },
  { key: "footer", label: "Footer" },
];

// Sections managed in dedicated admin panels — show info card in Content tab alongside fields
const ADMIN_MANAGED_SECTIONS = {
  events: { label: "Events", adminUrl: "/admin/events", message: "Events content is managed in the dedicated Events Admin Panel." },
  gallery: { label: "Gallery", adminUrl: "/admin/gallery", message: "Gallery content is managed in the dedicated Gallery Admin Panel." },
  pastor: { label: "Pastor", adminUrl: "/admin/pastor", message: "Pastor information is managed in the dedicated Pastor Admin Panel." },
  prayer: { label: "Prayer Requests", adminUrl: "/admin/prayer-requests", message: "Prayer Requests are managed in the dedicated Prayer Requests Admin Panel." },
  testimonials: { label: "Pastor's Message", adminUrl: "/admin/pastor-message", message: "Pastor's Messages are managed in the dedicated Pastor's Message Admin Panel." },
  youtube: { label: "YouTube", adminUrl: "/admin/youtube", message: "YouTube content is managed in the dedicated YouTube Admin Panel." },
  books: { label: "Books & Pamphlets", adminUrl: "/admin/books", message: "Books & Pamphlets are managed in the dedicated Books Admin Panel." },
};

// ─── Status badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Published: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    "Draft Saved": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
    "Typing...": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500 animate-pulse" },
    "Saving Draft...": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500 animate-pulse" },
    "Publishing...": { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500 animate-pulse" },
    "Draft Failed": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    "Publish Failed": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    "Loading...": { bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400 animate-pulse" },
    Ready: { bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400" },
  };
  const c = map[status] || map["Ready"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

// ─── Component ─────────────────────────────────────────────────────
export default function AdvancedWebEditor() {
  const confirm = useConfirm();

  const [selectedSection, setSelectedSection] = useState("hero");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Published");
  const [activeTab, setActiveTab] = useState("fields");
  const [sectionOrder, setSectionOrder] = useState([
    "hero", "history", "events", "gallery", "pastor", "prayer", "testimonials", "youtube", "books", "contact", "footer",
  ]);

  const { cmsData, setCmsData } = useLanguage();
  const currentSchema = schemas?.[selectedSection];
  const currentSection = ALL_SECTIONS.find((s) => s.key === selectedSection);

  // Build dropdown list sorted by current section order
  const activeSectionList = sectionOrder
    .map((key) => ALL_SECTIONS.find((s) => s.key === key))
    .filter(Boolean);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load data ────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setSaveStatus("Loading...");

      try {
        const prodRes = await getBlock(selectedSection);
        const prodData = prodRes?.data || {};
        setFormData(prodData);
        setSaveStatus("Published");
      } catch (err) {
        setFormData({});
        setSaveStatus("Ready");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSection]);

  // ── Field change ─────────────────────────────────────────────────
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  // ── Publish ──────────────────────────────────────────────────────
  const handlePublish = async () => {
    setLoading(true);
    setSaveStatus("Publishing...");

    try {
      await saveBlock(selectedSection, formData);

      // Publish Pastor Message if this is the testimonials section
      if (selectedSection === "testimonials") {
        try {
          const draft = await getBlock("pastor-messages-draft");
          if (draft && draft.data && Object.keys(draft.data).length > 0) {
            await saveBlock("pastor-messages", draft.data);
          }
        } catch (e) {
          console.warn("No pastor-messages-draft found or failed to publish pastor-messages");
        }
      }

      // Record version for history
      if (window[`__cms_record_version_${selectedSection}`]) {
        window[`__cms_record_version_${selectedSection}`](formData);
      }

      setSaveStatus("Published");
      alert("✅ Changes published successfully.");
    } catch (err) {
      setSaveStatus("Publish Failed");
      alert("Publish Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Field renderer ────────────────────────────────────────────────
  const renderField = (field) => {
    const value = formData?.[field.name] ?? "";

    switch (field.type || "text") {
      case "text":
        return <TextField value={value} onChange={(v) => handleChange(field.name, v)} />;
      case "textarea":
        return <TextareaField value={value} onChange={(v) => handleChange(field.name, v)} />;
      case "image":
        return <ImageField value={value} onChange={(v) => handleChange(field.name, v)} />;
      case "url":
        return <UrlField value={value} onChange={(v) => handleChange(field.name, v)} />;
      case "array":
        return <ArrayField value={value} onChange={(v) => handleChange(field.name, v)} field={field} />;
      default:
        return (
          <input
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-[#54091b] transition"
          />
        );
    }
  };



  // ─── JSX ──────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── MOBILE LAYOUT (<768px) ──────────────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen bg-slate-50 pb-[88px]">
        {/* Top Sticky Dropdown */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 p-4 shadow-sm">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Section
          </label>
          <div className="relative">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 p-4 pr-10 text-lg font-black text-[#54091b] outline-none transition focus:border-[#54091b]"
            >
              {activeSectionList.map((sec) => (
                <option key={sec.key} value={sec.key}>
                  {sec.label}
                </option>
              ))}
            </select>
            <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        {/* Content Form */}
        <div className="p-4 space-y-6">
          {(() => {
            const adminInfo = ADMIN_MANAGED_SECTIONS[selectedSection];
            if (adminInfo) {
              return (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <FaExclamationTriangle className="mx-auto mb-3 text-amber-500" size={28} />
                  <h2 className="text-lg font-extrabold text-slate-800">No Content Fields Here</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {adminInfo.message}
                  </p>
                </div>
              );
            }

            const schema = schemas?.[selectedSection];
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                  <FaSpinner className="animate-spin" size={24} />
                  <span className="text-sm font-semibold">Loading data...</span>
                </div>
              );
            }

            if (!schema?.fields?.length) {
              return (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                  No editable fields defined.
                </div>
              );
            }

            return (
              <>
                {schema?.fields?.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {field.description && <p className="text-[11px] leading-tight text-slate-400">{field.description}</p>}
                    {renderField(field)}
                  </div>
                ))}
              </>
            );
          })()}
        </div>



        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 pb-safe shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)]">
          <button
            type="button"
            onClick={() => window.open(`/#${selectedSection}`, "_blank")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white h-14 text-[15px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaEye size={16} /> Preview
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#54091b] h-14 text-[15px] font-bold text-white shadow-md transition hover:bg-[#6b0c22] disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaGlobe size={16} />}
            Publish
          </button>
        </div>
      </div>

      {/* ─── DESKTOP LAYOUT (≥768px) ────────────────────────────────────── */}
      <div className="hidden md:block mx-auto max-w-full space-y-4">

      {/* ═══ HEADER ═══════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#54091b]/10 text-[#54091b]">
            <FaGlobe />
          </span>
          <div>
            <h1 className="text-xl font-extrabold leading-none text-[#54091b]">Web CMS Editor</h1>
            <p className="mt-0.5 text-xs text-slate-400">Manage website content &amp; styles</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={saveStatus} />

          {/* Preview */}
          <button
            type="button"
            onClick={() => window.open(`/#${selectedSection}`, "_blank")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
            title="Open published site in new tab"
          >
            <FaEye className="text-slate-400" /> Preview
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-[#54091b] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#6b0c22] disabled:opacity-50 transition"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaGlobe />}
            {loading ? "Publishing..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {/* ═══ SECTION SELECTOR ════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
        <FaLayerGroup className="text-[#54091b] flex-shrink-0" />
        <span className="text-sm font-bold text-slate-700 flex-shrink-0">Section:</span>

        {/* Custom dropdown */}
        <div className="relative flex-1 min-w-[220px] max-w-xs" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#54091b]/40 hover:shadow focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#54091b]" />
              {currentSection?.label || selectedSection}
            </span>
            <FaChevronDown
              className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              size={12}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {activeSectionList.map((sec) => (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => {
                    setSelectedSection(sec.key);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold transition-colors ${selectedSection === sec.key
                    ? "bg-[#54091b]/5 text-[#54091b]"
                    : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {selectedSection === sec.key && (
                    <FaCheckCircle className="flex-shrink-0 text-[#54091b]" size={12} />
                  )}
                  {selectedSection !== sec.key && (
                    <span className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-slate-200" />
                  )}
                  {sec.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section subtitle */}
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          Editing:&nbsp;<span className="text-[#54091b]">{currentSection?.label}</span>
        </span>


      </div>

      {/* ═══ TABS ════════════════════════════════════════════════════ */}
      <div className="rounded-t-2xl border border-b-0 border-slate-200 bg-white px-2">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {[
            { tab: "fields", Icon: FaEdit, label: "Content" },
            { tab: "reorder", Icon: FaListOl, label: "Reorder" },
            { tab: "history", Icon: FaHistory, label: "History" },
          ].map(({ tab, Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${activeTab === tab
                ? "border-[#54091b] text-[#54091b]"
                : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PANELS ══════════════════════════════════════════════════ */}

      {/* ─── CONTENT TAB ─────────────────────────────────────────── */}
      {activeTab === "fields" && (() => {
        // Sections managed by dedicated admin panels — show a consistent info card
        const adminInfo = ADMIN_MANAGED_SECTIONS[selectedSection];
        if (adminInfo) {
          return (
            <div className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <FaExclamationTriangle size={22} />
              </div>
              <h2 className="text-base font-extrabold text-slate-800">No Content Fields Here</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                {adminInfo.message}
              </p>
            </div>
          );
        }

        const schema = schemas?.[selectedSection];
        return (
          <div className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Field Editor{" "}
                  <span className="text-[#54091b]">
                    — {currentSection?.label || selectedSection}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Edit content fields for this section. Changes auto-save as drafts.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
                <FaSpinner className="animate-spin" />
                <span className="text-sm">Loading section data...</span>
              </div>
            ) : !schema?.fields?.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                <FaExclamationTriangle className="mx-auto mb-2 text-slate-300" size={24} />
                No editable fields defined for this section.
              </div>
            ) : (
              <div className="space-y-6">
                {schema.fields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-400">*</span>}
                    </label>
                    {field.description && (
                      <p className="text-xs text-slate-400">{field.description}</p>
                    )}
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}



      {/* ─── REORDER TAB ─────────────────────────────────────────── */}
      {activeTab === "reorder" && (
        <div className="rounded-b-2xl rounded-tr-2xl">
          <DragDropSections onOrderChange={(newOrder) => setSectionOrder(newOrder)} />
        </div>
      )}

      {/* ─── HISTORY TAB ─────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="rounded-b-2xl rounded-tr-2xl">
          <VersionHistory
            section={selectedSection}
            activeData={formData}
            onRestore={(data) => {
              setFormData(data);
            }}
            onPreviewVersion={(snap) => {
              setFormData(snap);
              setSaveStatus("Previewing Version");
            }}
          />
        </div>
      )}

    </div>
    </>
  );
}