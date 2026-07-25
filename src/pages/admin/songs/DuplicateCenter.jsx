import { useState, useEffect } from "react";
import API from "../../../api/axios";
import { Copy, Merge, ArrowRight, Loader } from "lucide-react";

const DuplicateCenter = () => {
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDuplicates = async () => {
        try {
            const res = await API.get("/admin/songs/duplicates");
            if (res.data.success) setDuplicates(res.data.duplicates);
        } catch (err) {
            console.error("Failed to fetch duplicates", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDuplicates();
    }, []);

    const handleMerge = async (primaryId, duplicateIds) => {
        if (!confirm("Are you sure you want to merge these songs? The duplicates will be unpublished and marked as duplicates of the primary song.")) return;
        
        try {
            const res = await API.post("/admin/songs/duplicates/merge", { primaryId, duplicateIds });
            if (res.data.success) {
                alert("Merged successfully");
                fetchDuplicates();
            }
        } catch (err) {
            alert("Merge failed");
        }
    };

    if (loading) return <div className="p-8"><Loader className="animate-spin w-6 h-6" /></div>;

    if (duplicates.length === 0) return (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
            <Copy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Duplicates Found</h3>
            <p className="text-slate-500 mt-2">Your library looks clean!</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {duplicates.map((group, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Group: {group._id}</h3>
                            <p className="text-sm text-slate-500">{group.count} similar songs found</p>
                        </div>
                        <button 
                            onClick={() => handleMerge(group.songs[0]._id, group.songs.slice(1).map(s => s._id))}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                        >
                            <Merge className="w-4 h-4" />
                            Auto-Merge to 1st
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                        {group.songs.map((song, sIdx) => (
                            <div key={song._id} className={`p-6 ${sIdx === 0 ? 'bg-indigo-50/30' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{sIdx === 0 ? 'Primary Candidate' : `Duplicate ${sIdx}`}</span>
                                    <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">{song.source}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 mb-1">{song.displayTitle || song.titleTamil || song.title}</h4>
                                <p className="text-sm text-slate-600 mb-4">{song.titleEnglish}</p>
                                
                                <div className="text-xs text-slate-500 space-y-1 mb-6">
                                    <p>Score: <span className="font-bold">{song.qualityScore || 0}</span></p>
                                    <p>Words: {song.lyricsLength || (song.lyrics || "").length}</p>
                                    <p>Imported: {new Date(song.importedAt || song.createdAt).toLocaleDateString()}</p>
                                </div>
                                
                                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-100">
                                    {(song.lyrics || "").substring(0, 300)}...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DuplicateCenter;
