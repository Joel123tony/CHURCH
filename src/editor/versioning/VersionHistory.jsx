import React, { useEffect, useState } from "react";
import { FaHistory, FaUndo, FaEye, FaSpinner } from "react-icons/fa";
import { getBlock, saveBlock } from "../../services/api";
import { useConfirm } from "../../context/ConfirmContext";

export default function VersionHistory({ section, activeData, onRestore, onPreviewVersion }) {
  const confirm = useConfirm();
  const [historyData, setHistoryData] = useState({ section, versions: [] });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getBlock(`history-${section}`);
      if (res && res.data && Array.isArray(res.data.versions)) {
        setHistoryData(res.data);
      } else {
        setHistoryData({ section, versions: [] });
      }
    } catch (err) {
      console.warn("No version history found for", section, err);
      setHistoryData({ section, versions: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [section]);

  // Public method to record a new version, to be called when Publishing
  // Stored in backend as: { section: "hero", versions: [] }
  const createNewVersion = async (newData) => {
    try {
      // 1. Fetch current history
      let currentVersions = [];
      try {
        const res = await getBlock(`history-${section}`);
        if (res && res.data && Array.isArray(res.data.versions)) {
          currentVersions = res.data.versions;
        }
      } catch (err) {
        // Safe to ignore if doesn't exist yet
      }

      // 2. Add current data as a version
      const newVersion = {
        timestamp: new Date().toISOString(),
        data: newData,
      };

      // 3. Unshift and limit to 10 versions
      const updatedVersions = [newVersion, ...currentVersions].slice(0, 10);

      // 4. Save back to backend
      const payload = {
        section,
        versions: updatedVersions,
      };
      await saveBlock(`history-${section}`, payload);
      setHistoryData(payload);
    } catch (err) {
      console.error("Failed to create version record:", err);
    }
  };

  // Expose this method globally if needed
  window[`__cms_record_version_${section}`] = createNewVersion;

  const handleRestore = async (version) => {
    const ok = await confirm({
      title: "Restore Version",
      message: `Are you sure you want to restore the version from ${new Date(version.timestamp).toLocaleString()}?`,
      confirmText: "Restore",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) return;

    onRestore(version.data);
    setStatus("Version loaded! Press Publish to apply.");
    setTimeout(() => setStatus(""), 3000);
  };

  const getRelativeTime = (timestamp) => {
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const sec = Math.floor(elapsed / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b pb-3">
        <FaHistory className="text-[#54091b]" />
        <div>
          <h3 className="text-base font-bold text-slate-800">Version History</h3>
          <p className="text-xs text-slate-400">Restore last 5-10 revisions.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-500">
          <FaSpinner className="animate-spin" /> Loading revisions...
        </div>
      ) : historyData.versions.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-400">
          No published revisions found. Versions are recorded when you "Publish".
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
          {historyData.versions.map((ver, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between group">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(ver.timestamp).toLocaleDateString()} • {getRelativeTime(ver.timestamp)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onPreviewVersion(ver.data)}
                  className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Preview this state"
                >
                  <FaEye size={10} /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(ver)}
                  className="flex items-center gap-1 rounded-lg bg-[#54091b]/5 px-2 py-1 text-xs font-semibold text-[#54091b] hover:bg-[#54091b]/10 transition"
                  title="Restore this version"
                >
                  <FaUndo size={10} /> Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {status && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-600">
          {status}
        </div>
      )}
    </div>
  );
}
