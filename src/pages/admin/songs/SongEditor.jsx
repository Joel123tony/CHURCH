import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../../api/axios";
import { Save, ArrowLeft, Loader, CheckCircle, XCircle } from "lucide-react";

const SongEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSong = async () => {
            try {
                // Currently reusing a public endpoint for fetching song by ID, or we could use the admin library search with ID
                // Wait, we don't have GET /admin/songs/library/:id. Let's use the public one or generic one.
                const res = await API.get(`/admin/songs/song-debug/${id}`);
                if (res.data.success) {
                    // We can just fetch via standard song API since we only need the document.
                    // The debug endpoint just returns some fields. Let's fetch from the public API or add one.
                    // For now, assume a standard fetch. Actually, public API is /api/songs/:id
                    const songRes = await API.get(`/songs/${id}`);
                    setSong(songRes.data.song);
                }
            } catch (err) {
                console.error("Failed to load song", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSong();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put(`/admin/songs/library/${id}`, song);
            alert("Saved successfully!");
        } catch (err) {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader className="animate-spin w-6 h-6" /></div>;
    if (!song) return <div className="p-8">Song not found.</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Edit Song: {song.title}</h2>
                        <p className="text-xs text-slate-500">ID: {song._id} • Source: {song.source}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setSong({...song, isPublished: !song.isPublished})}
                        className={`px-4 py-2 rounded-lg font-medium border ${song.isPublished ? 'bg-white text-slate-700 border-slate-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                    >
                        {song.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metadata Column */}
                <div className="space-y-4 lg:col-span-1">
                    <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Metadata</h3>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Title</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg p-2 outline-none cursor-not-allowed"
                            value={song.displayTitle || song.title || ''}
                            readOnly
                            disabled
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Auto-generated format: "Song Name by Author"</p>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (English)</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={song.title || ''}
                            onChange={(e) => setSong({...song, title: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (Tamil)</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-tamil"
                            value={song.titleTamil || ''}
                            onChange={(e) => setSong({...song, titleTamil: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Author / Artist</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={song.author || song.artist || ''}
                            onChange={(e) => setSong({...song, author: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Album</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={song.album || ''}
                            onChange={(e) => setSong({...song, album: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={song.category || ''}
                            onChange={(e) => setSong({...song, category: e.target.value})}
                        />
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-6">
                        <p className="text-xs text-slate-500">Quality Score</p>
                        <p className={`text-xl font-bold ${song.qualityScore >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{song.qualityScore || 0}/100</p>
                    </div>
                </div>

                {/* Lyrics Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Lyrics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
                        <div className="flex flex-col h-full">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                                Editor 
                                <span className="text-indigo-500 lowercase cursor-pointer">auto-format blocks</span>
                            </label>
                            <textarea 
                                className="flex-1 w-full border border-slate-200 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                                value={song.lyrics || ''}
                                onChange={(e) => setSong({...song, lyrics: e.target.value})}
                                placeholder="Enter lyrics here..."
                            />
                        </div>
                        
                        <div className="flex flex-col h-full hidden md:flex">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Live Preview</label>
                            <div className="flex-1 w-full border border-slate-200 rounded-lg p-4 overflow-y-auto bg-white whitespace-pre-wrap font-tamil text-slate-800 shadow-inner">
                                {song.lyrics}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SongEditor;
