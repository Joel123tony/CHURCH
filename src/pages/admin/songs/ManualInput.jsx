import { useState } from "react";
import { Save, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import API from "../../../api/axios";
import LibraryList from "./LibraryList";

export default function ManualInput() {
    const defaultForm = {
        title: "",
        author: "",
        language: "Tamil",
        category: "Tamil Christian Songs",
        source: "",
        lyrics: "",
    };

    const [form, setForm] = useState(defaultForm);
    const [isSaving, setIsSaving] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleReset = () => {
        if (!window.confirm("Are you sure you want to reset the form? Unsaved changes will be lost.")) return;
        setForm(defaultForm);
    };

    const handleEdit = (song) => {
        setForm({
            ...defaultForm,
            ...song,
            lyrics: song.lyrics || "",
            source: song.source || "Manual Input"
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            return toast.error("Song Title is required.");
        }
        if (!form.lyrics.trim()) {
            return toast.error("Song lyrics are required.");
        }

        setIsSaving(true);
        try {
            if (form._id) {
                // Update existing
                const res = await API.put(`/admin/songs/manual/${form._id}`, form);
                if (res.data.success) {
                    toast.success("Song updated successfully.");
                    setForm(defaultForm);
                    setRefreshKey(k => k + 1);
                } else {
                    toast.error(res.data.message || "Failed to update song.");
                }
            } else {
                // Create new
                const res = await API.post("/admin/songs/manual", { ...form, source: form.source || "Manual Input" });
                if (res.data.success) {
                    toast.success("Song saved successfully.");
                    setForm(defaultForm);
                    setRefreshKey(k => k + 1);
                } else {
                    toast.error(res.data.message || "Failed to save song.");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-indigo-900">
                        Manual Song Input
                    </h2>
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        <XCircle className="w-4 h-4" /> Cancel
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Song Title *</label>
                            <input 
                                type="text" 
                                name="title" 
                                value={form.title} 
                                onChange={handleChange}
                                placeholder="E.g., Ennuyir Naathan"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Author / Artist</label>
                            <input 
                                type="text" 
                                name="author" 
                                value={form.author} 
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Source (Optional)</label>
                            <input 
                                type="text" 
                                name="source" 
                                value={form.source} 
                                onChange={handleChange}
                                placeholder="E.g., worldtamilchristians.com"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                            <select 
                                name="language" 
                                value={form.language} 
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Tamil">Tamil</option>
                                <option value="English">English</option>
                                <option value="Tamil-English">Tamil-English (Tanglish)</option>
                                <option value="Hindi">Hindi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <input 
                                type="text" 
                                name="category" 
                                value={form.category} 
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Textarea for Lyrics */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Lyrics</label>
                        <textarea
                            name="lyrics"
                            value={form.lyrics}
                            onChange={handleChange}
                            rows={18}
                            placeholder="Enter song lyrics here..."
                            className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-serif"
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-colors ${isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                        >
                            <Save className="w-5 h-5" /> {isSaving ? "Saving..." : form._id ? "Update Song" : "Save Song"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Library Overview</h3>
                <LibraryList key={refreshKey} manualEditCallback={handleEdit} />
            </div>
        </div>
    );
}
