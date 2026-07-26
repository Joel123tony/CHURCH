import { useState, useEffect } from "react";
import API from "../../../api/axios";
import { RefreshCw, Trash2, CheckCircle, AlertTriangle, AlertCircle, ExternalLink } from "lucide-react";

const FailedQueue = () => {
    const [failedImports, setFailedImports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchFailed = async () => {
        try {
            const res = await API.get("/admin/songs/failed");
            if (res.data.success) setFailedImports(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch failed imports", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFailed();
    }, []);

    const handleRetry = async (id) => {
        setActionLoading(true);
        try {
            const res = await API.post("/admin/songs/retry-selected", { ids: [id] });
            if (res.data.success) {
                alert("Retry queued successfully");
                fetchFailed();
            }
        } catch (err) {
            alert("Retry failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this failed import log?")) return;
        try {
            const res = await API.delete(`/admin/songs/failed/${id}`);
            if (res.data.success) fetchFailed();
        } catch (err) {
            alert("Delete failed");
        }
    };

    if (loading) return <div className="p-8">Loading failed queue...</div>;

    if (!failedImports || failedImports.length === 0) return (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
            <AlertCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Failed Imports</h3>
            <p className="text-slate-500 mt-2">All import pipelines are running smoothly.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-rose-50 p-4 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-3 text-rose-700">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold text-lg">Failed Import Queue</h3>
                        <p className="text-sm text-rose-600 opacity-80">{failedImports?.length || 0} items require attention</p>
                    </div>
                </div>
                <button 
                    disabled={actionLoading || !failedImports || failedImports.length === 0}
                    onClick={async () => {
                        if (!confirm("Are you sure you want to retry all failed imports?")) return;
                        setActionLoading(true);
                        try {
                            const res = await API.post("/admin/songs/retry-all");
                            if (res.data.success) {
                                alert("All retries queued successfully");
                                fetchFailed();
                            }
                        } catch (err) {
                            alert("Bulk retry failed");
                        } finally {
                            setActionLoading(false);
                        }
                    }}
                    className="bg-white text-rose-700 border border-rose-200 px-4 py-2 rounded-lg font-medium hover:bg-rose-50 text-sm disabled:opacity-50"
                >
                    Retry All
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {(failedImports || []).map(item => (
                    <div key={item._id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-800">{item.metadata?.title || "Unknown Title"}</h4>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 hover:underline flex items-center gap-1 mt-1">
                                    {item.url} <ExternalLink className="w-3 h-3" />
                                </a>
                                <div className="mt-2 text-xs font-mono bg-slate-100 text-slate-600 p-2 rounded max-w-2xl break-words">
                                    {item.error || "Unknown error"}
                                </div>
                                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                                    <span>Failed: {new Date(item.updatedAt || item.createdAt).toLocaleString()}</span>
                                    <span>Retries: {item.attempts || 0}</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => handleRetry(item._id)} disabled={actionLoading} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Retry Import">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(item._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" title="Delete Record">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FailedQueue;
