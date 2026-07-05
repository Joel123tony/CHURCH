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
  FaSpinner,
  FaList,
  FaCommentDots
} from "react-icons/fa";

export default function PastorMessage() {
  const confirm = useConfirm();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState("add"); // "add" | "list"
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
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

  const resetForm = () => {
    setEditingIndex(null);
    setFormAuthor("");
    setFormQuote("");
    setFormRole("Pastor");
    setFormVisible(true);
  };

  // Open Edit Form
  const handleOpenEdit = (index) => {
    const item = messages[index];
    setEditingIndex(index);
    setFormAuthor(item.author || "");
    setFormQuote(item.quote || "");
    setFormRole(item.role || "");
    setFormVisible(item.visible !== false);
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
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

    await saveToDb(updated);
    resetForm();
    setActiveTab("list");
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
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen w-full">
      {/* HEADER SECTION - strictly functional, no descriptions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#54091b] flex items-center gap-3 tracking-tight">
            <FaCommentDots className="text-[#ee0039]" />
            Pastor's Messages
          </h1>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm w-max border border-slate-100">
        <button
          onClick={() => { 
            if (activeTab !== "add") resetForm(); 
            setActiveTab("add"); 
          }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "add" 
              ? "bg-[#ee0039] text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {editingIndex !== null ? <FaEdit /> : <FaPlus />}
          {editingIndex !== null ? "Edit Message" : "Add Message"}
        </button>
        <button
          onClick={() => { resetForm(); setActiveTab("list"); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "list" 
              ? "bg-[#54091b] text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <FaList />
          Message List
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <FaSpinner className="animate-spin text-[#54091b]" size={36} />
        </div>
      ) : (
        <div className="relative w-full">
          {/* LIST TAB */}
          {activeTab === "list" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm w-full">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 font-medium">
                    No pastor messages found. Click "Add Message" to create your first item.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-4 tracking-wider">Author</th>
                          <th className="px-5 py-4 tracking-wider">Role</th>
                          <th className="px-5 py-4 tracking-wider">Quote</th>
                          <th className="px-5 py-4 text-center tracking-wider">Status</th>
                          <th className="px-5 py-4 text-right tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {messages.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-800">{item.author}</td>
                            <td className="px-5 py-4 font-medium text-slate-500">{item.role || "-"}</td>
                            <td className="px-5 py-4 italic truncate max-w-[250px] text-slate-500" title={item.quote}>
                              "{item.quote}"
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleToggleVisibility(index)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${item.visible !== false
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEdit(index)}
                                  className="w-8 h-8 rounded-full bg-slate-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm"
                                  title="Edit"
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(index)}
                                  className="w-8 h-8 rounded-full bg-slate-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm"
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

          {/* ADD/EDIT TAB */}
          {activeTab === "add" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 max-w-3xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingIndex !== null ? "Edit Pastor Message" : "Add Pastor Message"}
                  </h2>
                  {editingIndex !== null && (
                    <button 
                      onClick={() => { resetForm(); setActiveTab("list"); }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-bold flex items-center gap-2"
                    >
                      <FaTimes /> Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Author Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rev. Moses Selvaraj"
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Role / Position
                      </label>
                      <select
                        value={formRole || "Pastor"}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium appearance-none"
                      >
                        <option value="Pastor">Pastor</option>
                        <option value="Member">Member</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Quote Message *
                      </label>
                      <span className={`text-[11px] font-bold ${formQuote.length >= 120 ? 'text-red-500' : 'text-slate-400'}`}>
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
                      className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={formVisible}
                      onChange={(e) => setFormVisible(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-[#ee0039] focus:ring-[#ee0039]/30 transition-all cursor-pointer"
                    />
                    <label htmlFor="visible" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                      Make visible on the website immediately
                    </label>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3.5 rounded-xl text-white bg-[#ee0039] hover:bg-[#d00030] transition-colors font-bold disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-[#ee0039]/30"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving Message...
                        </>
                      ) : (
                        <>
                          <FaSave size={14} /> 
                          {editingIndex !== null ? "Save Changes" : "Publish Message"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

