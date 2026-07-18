import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { Music, UploadCloud, CheckCircle, Search, Save, AlertCircle } from "lucide-react";

export default function AdminSongs() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [status, setStatus] = useState({ totalSongs: 0, sources: [] });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await API.get("/admin/songs/status");
      if (res.data.success) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setSuccessMsg("");

    try {
      const res = await API.post("/admin/songs/import-url", { url });
      if (res.data.success) {
        setPreview(res.data.preview);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to extract lyrics. Invalid URL or provider error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    
    try {
      const res = await API.post("/admin/songs/save", preview);
      if (res.data.success) {
        setSuccessMsg(`Successfully saved: ${preview.titleTamil}`);
        setPreview(null);
        setUrl("");
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save song");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 text-[#54091b]">
              <Music size={24} />
            </div>
            Songs Library
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage lyrics, imports, and multi-source providers.</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-black text-[#54091b]">{status.totalSongs}</div>
            <div className="text-xs font-bold text-slate-400 uppercase">Total Songs</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-center">
            <div className="text-2xl font-black text-slate-700">{status.sources?.length || 0}</div>
            <div className="text-xs font-bold text-slate-400 uppercase">Active Sources</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <UploadCloud className="text-[#54091b]" size={20} />
          Import from URL
        </h2>
        
        <form onSubmit={handlePreview} className="flex gap-3">
          <input
            type="url"
            placeholder="Paste URL from World Tamil Christians or TamilChristianSongs.in..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#54091b] focus:ring-1 focus:ring-[#54091b] transition-all"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#54091b] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#6a0b22] transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
            {loading ? "Extracting..." : "Preview"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-start gap-3">
            <CheckCircle size={20} className="shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{successMsg}</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="bg-white rounded-3xl overflow-hidden border border-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/5 relative animate-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-r from-[#F4EFE7] to-white p-6 border-b border-[#E8DCCB] flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle size={14} /> Import Ready
              </div>
              <h3 className="text-2xl font-black text-slate-900">{preview.titleTamil}</h3>
              {preview.titleEnglish && <p className="text-slate-500 font-medium">{preview.titleEnglish}</p>}
              <div className="mt-2 text-sm text-slate-500 flex items-center gap-2">
                <span className="font-bold text-slate-700">Source:</span> {preview.source}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#D4AF37] text-white px-8 py-4 rounded-xl font-black hover:bg-[#c39b26] transition-all shadow-md shadow-[#D4AF37]/30 flex items-center gap-2 hover:-translate-y-0.5"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              {saving ? "Saving..." : "Approve & Save"}
            </button>
          </div>
          
          <div className="p-8 grid md:grid-cols-2 gap-8 bg-[#FAFAFA]">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tamil Lyrics</h4>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap font-serif text-lg leading-loose text-slate-800">
                {preview.lyricsTamil}
              </div>
            </div>
            
            {preview.lyricsEnglish && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">English Transliteration</h4>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap font-serif text-lg leading-loose text-slate-800">
                  {preview.lyricsEnglish}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
