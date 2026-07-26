import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../../api/axios";
import { Search, Filter, MoreVertical, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const LibraryList = ({ manualEditCallback }) => {
    const [songs, setSongs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(50);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [isPublished, setIsPublished] = useState("");
    const [missing, setMissing] = useState("");
    const [provider, setProvider] = useState("");
    const [language, setLanguage] = useState("");
    const [sourceType, setSourceType] = useState("");
    const [sort, setSort] = useState("-createdAt");

    const [selectedIds, setSelectedIds] = useState([]);

    const fetchSongs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (q) params.q = q;
            if (status) params.status = status;
            if (isPublished) params.isPublished = isPublished;
            if (missing) params.missing = missing;
            if (provider) params.provider = provider;
            if (language) params.language = language;
            if (sourceType) params.sourceType = sourceType;
            if (sort) params.sort = sort;

            const res = await API.get("/admin/songs/library", { params });
            if (res.data.success) {
                setSongs(res.data.songs);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error("Failed to fetch library", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, q, status, isPublished, missing, provider, language, sourceType, sort]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSongs();
        }, 500); // debounce search
        return () => clearTimeout(timeoutId);
    }, [fetchSongs]);

    // Listen for custom event from ManualInput
    useEffect(() => {
        const handleRefresh = () => fetchSongs();
        window.addEventListener("refreshLibrary", handleRefresh);
        return () => window.removeEventListener("refreshLibrary", handleRefresh);
    }, [fetchSongs]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(songs.map(s => s._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} songs?`)) return;

        try {
            if (action === 'publish' || action === 'unpublish') {
                await API.post("/admin/songs/bulk/publish", { ids: selectedIds, publish: action === 'publish' });
            } else if (action === 'delete') {
                await API.post("/admin/songs/bulk/delete", { ids: selectedIds });
            }
            setSelectedIds([]);
            fetchSongs();
        } catch (err) {
            alert("Bulk action failed");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search songs, lyrics, authors..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    />
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={isPublished} onChange={e => { setIsPublished(e.target.value); setPage(1); }}>
                        <option value="">All Publishing</option>
                        <option value="true">Published</option>
                        <option value="false">Draft</option>
                    </select>

                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="recovering">Recovering</option>
                    </select>

                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={missing} onChange={e => { setMissing(e.target.value); setPage(1); }}>
                        <option value="">Quality Filter</option>
                        <option value="lyrics">Missing Lyrics</option>
                        <option value="metadata">Missing Metadata</option>
                    </select>

                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={sourceType} onChange={e => { setSourceType(e.target.value); setPage(1); }}>
                        <option value="">All Sources</option>
                        <option value="manual">Manual Input</option>
                        <option value="imported">Imported</option>
                    </select>

                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={language} onChange={e => { setLanguage(e.target.value); setPage(1); }}>
                        <option value="">All Languages</option>
                        <option value="Tamil">Tamil</option>
                        <option value="English">English</option>
                    </select>

                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
                        <option value="-createdAt">Newest First</option>
                        <option value="createdAt">Oldest First</option>
                        <option value="title">A-Z</option>
                        <option value="-title">Z-A</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between border-b border-indigo-100">
                    <span className="text-sm font-semibold text-indigo-700">{selectedIds.length} selected</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkAction('publish')} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium hover:bg-slate-50">Publish</button>
                        <button onClick={() => handleBulkAction('unpublish')} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium hover:bg-slate-50">Unpublish</button>
                        <button onClick={() => handleBulkAction('delete')} className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded text-sm font-medium hover:bg-rose-100">Delete</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 w-10">
                                <input type="checkbox" className="rounded text-indigo-600" onChange={handleSelectAll} checked={songs.length > 0 && selectedIds.length === songs.length} />
                            </th>
                            <th className="p-4">Title & Author</th>
                            <th className="p-4 hidden md:table-cell">Language</th>
                            <th className="p-4 hidden lg:table-cell">Source</th>
                            <th className="p-4 hidden md:table-cell">Status</th>
                            <th className="p-4 hidden lg:table-cell">Updated</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : songs.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">No songs found.</td></tr>
                        ) : (
                            songs.map(song => (
                                <tr key={song._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded text-indigo-600" onChange={(e) => handleSelectOne(e, song._id)} checked={selectedIds.includes(song._id)} />
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">
                                        <div>{song.displayTitle || song.title || "Untitled"}</div>
                                        {song.author && <div className="text-xs text-slate-500 font-normal">{song.author}</div>}
                                        {!song.isPublished && <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">Draft</span>}
                                    </td>
                                    <td className="p-4 text-slate-600 hidden md:table-cell">{song.language || "Tamil"}</td>
                                    <td className="p-4 text-slate-500 text-sm hidden lg:table-cell">
                                        {song.source === 'Manual' ? <span className="text-indigo-600 font-medium">Manual</span> : song.source}
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${song.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                song.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {song.status}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell text-sm text-slate-500">
                                        {new Date(song.updatedAt || song.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        {manualEditCallback ? (
                                            <button onClick={() => manualEditCallback(song)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
                                        ) : (
                                            <Link to={`/admin/songs/library/${song._id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50">
                <div className="flex items-center gap-4">
                    <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}</span>
                    <select className="border border-slate-200 rounded px-2 py-1 text-xs" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={1000}>All</option>
                    </select>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

export default LibraryList;
