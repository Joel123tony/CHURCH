import React, { useEffect, useState } from "react";
import { getBlock, saveBlock } from "../../services/api";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaTimes,
  FaSpinner
} from "react-icons/fa";

export default function PastorMessage() {
  const confirm = useConfirm();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null if adding new
  const [formAuthor, setFormAuthor] = useState("");
  const [formQuote, setFormQuote] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formVisible, setFormVisible] = useState(true);

  // Load pastor messages data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let res = await getBlock("pastor-messages-draft");
        if (!res?.data || Object.keys(res.data).length === 0) {
          res = await getBlock("pastor-messages");
        }
        
        if (res && res.data) {
          setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
        }
      } catch (err) {
        console.error("Failed to load pastor messages", err);
        toast.error("Failed to load pastor messages.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to DB
  const saveToDb = async (newMessages) => {
    setSaving(true);
    try {
      const payload = {
        messages: newMessages
      };
      // Save to draft for the editor state
      await saveBlock("pastor-messages-draft", payload);
      // Immediately publish to live client state
      await saveBlock("pastor-messages", payload);

      setMessages(newMessages);
      toast.success("Pastor's Message updated successfully!");
    } catch (err) {
      console.error("Failed to save pastor messages", err);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormAuthor("");
    setFormQuote("");
    setFormRole("Pastor");
    setFormVisible(true);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (index) => {
    const item = messages[index];
    setEditingIndex(index);
    setFormAuthor(item.author || "");
    setFormQuote(item.quote || "");
    setFormRole(item.role || "");
    setFormVisible(item.visible !== false);
    setShowModal(true);
  };

  // Submit Modal Form
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formAuthor.trim() || !formQuote.trim()) {
      toast.warn("Author name and quote message are required.");
      return;
    }

    if (formQuote.trim().length > 120) {
      toast.error("Quote message exceeds the limit of 120 characters.");
      return;
    }

    const item = {
      id: editingIndex !== null ? messages[editingIndex].id : "msg_" + Date.now(),
      author: formAuthor,
      quote: formQuote.trim(),
      role: formRole || "Pastor",
      visible: formVisible
    };

    let updated = [...messages];
    if (editingIndex !== null) {
      updated[editingIndex] = item;
    } else {
      updated.push(item);
    }

    saveToDb(updated);
    setShowModal(false);
  };

  // Toggle Visibility
  const handleToggleVisibility = (index) => {
    const updated = [...messages];
    updated[index] = {
      ...updated[index],
      visible: updated[index].visible === false ? true : false
    };
    saveToDb(updated);
  };

  // Delete Message
  const handleDelete = async (index) => {
    const ok = await confirm({
      title: "Delete Message",
      message: "Are you sure you want to delete this pastor message?",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
    if (!ok) return;
    const updated = messages.filter((_, i) => i !== index);
    saveToDb(updated);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-3 py-4 sm:px-6">
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#54091b] sm:text-3xl">
            Pastor's Message Module
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dedicated system to manage individual pastor messages and testimonials visible on the home site.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ee0039] px-6 py-3 font-semibold text-white transition hover:bg-red-700 hover:scale-[1.02] shadow"
        >
          <FaPlus size={14} />
          Add Message
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <FaSpinner className="animate-spin text-[#54091b]" size={36} />
        </div>
      ) : (
        <div className="w-full">
          {/* MESSAGES LIST TABLE */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md w-full">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Pastor Messages ({messages.length})</h2>

            {messages.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                No pastor messages found. Click "Add Message" to create your first item.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Role / Position</th>
                      <th className="px-4 py-3">Quote</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {messages.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-bold text-slate-900">{item.author}</td>
                        <td className="px-4 py-4 text-slate-500">{item.role || "-"}</td>
                        <td className="px-4 py-4 italic truncate max-w-[200px]" title={item.quote}>
                          "{item.quote}"
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleVisibility(index)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.visible !== false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                              }`}
                            title="Click to toggle visibility"
                          >
                            {item.visible !== false ? (
                              <>
                                <FaEye size={12} /> Visible
                              </>
                            ) : (
                              <>
                                <FaEyeSlash size={12} /> Hidden
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(index)}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <FaTimes size={16} />
            </button>

            <h2 className="mb-4 text-xl font-extrabold text-[#54091b]">
              {editingIndex !== null ? "Edit Pastor Message" : "Add Pastor Message"}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Author Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rev. Moses Selvaraj"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#54091b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Role / Position
                </label>
                <select
                  value={formRole || "Pastor"}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none bg-white focus:border-[#54091b]"
                >
                  <option value="Pastor">Pastor</option>
                  <option value="Member">Member</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quote Message
                  </label>
                  <span className={`text-[11px] font-semibold ${formQuote.length >= 120 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {formQuote.length}/120
                  </span>
                </div>
                <textarea
                  required
                  rows="4"
                  maxLength={120}
                  placeholder="Enter the quote message or testimony content here (max 120 characters)..."
                  value={formQuote}
                  onChange={(e) => setFormQuote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#54091b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formVisible}
                  onChange={(e) => setFormVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 text-[#ee0039] focus:ring-[#54091b]"
                />
                <label htmlFor="visible" className="text-sm font-bold text-slate-700 select-none">
                  Make visible on the website immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ee0039] px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    <>
                      <FaSave size={14} /> Save Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
