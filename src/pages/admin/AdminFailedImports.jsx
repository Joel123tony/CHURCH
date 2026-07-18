import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { 
  AlertOctagon, RefreshCw, Trash2, Globe, Clock, AlertCircle,
  Play, Search, ChevronLeft, ChevronRight, X, FileText, CheckCircle, RotateCcw, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminFailedImports() {
  // Data State
  const [failedImports, setFailedImports] = useState([]);
  const [stats, setStats] = useState({
    failed: 0,
    recovered: 0,
    retryQueue: 0,
    lastRetry: "N/A"
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Retry Progress State
  const [retryStatus, setRetryStatus] = useState(null);
  const retryIntervalRef = useRef(null);

  useEffect(() => {
    fetchFailedImports();
  }, [page, search]);

  useEffect(() => {
    // Poll retry status independently on mount to check if a background job is already running
    pollRetryStatus();
    return () => stopPolling();
  }, []);

  const fetchFailedImports = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/songs/failed?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setFailedImports(res.data.data);
        setTotalPages(res.data.totalPages);
        setHasNext(res.data.hasNext);
        setHasPrevious(res.data.hasPrevious);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch failed imports:", err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (retryIntervalRef.current) return;
    retryIntervalRef.current = setInterval(pollRetryStatus, 1000);
  };

  const stopPolling = () => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
  };

  const pollRetryStatus = async () => {
    try {
      const res = await API.get("/admin/songs/retry/status");
      if (res.data.success) {
        setRetryStatus(res.data.status);
        if (!res.data.status.isRunning && retryIntervalRef.current) {
           stopPolling();
           // Refresh list once done
           fetchFailedImports();
        } else if (res.data.status.isRunning && !retryIntervalRef.current) {
           startPolling();
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
      stopPolling();
    }
  };

  const handleRetryAll = async () => {
    try {
      await API.post("/admin/songs/retry-all");
      startPolling();
    } catch (err) {
      alert("Failed to start retry all. Job might already be running or queue is empty.");
    }
  };

  const handleRetrySelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await API.post("/admin/songs/retry-selected", { ids: selectedIds });
      setSelectedIds([]);
      startPolling();
    } catch (err) {
      alert("Failed to start retry selected.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} records forever?`)) return;
    
    // Process sequentially for simplicity
    for (const id of selectedIds) {
       await API.delete(`/admin/songs/failed/${id}`);
    }
    setSelectedIds([]);
    fetchFailedImports();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this failed record?")) return;
    try {
      const res = await API.delete(`/admin/songs/failed/${id}`);
      if (res.data.success) {
        fetchFailedImports();
      }
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
       prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === failedImports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(failedImports.map(s => s._id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  const formatReasonBadge = (reason, httpStatus) => {
     let color = "bg-slate-100 text-slate-600";
     let icon = <AlertCircle size={12} />;
     let label = reason || "Unknown Error";

     const r = (reason || "").toLowerCase();

     if (r.includes("too short") || r.includes("empty lyrics")) {
        color = "bg-amber-100 text-amber-700";
        label = "Lyrics Too Short / Empty";
     } else if (r.includes("timeout")) {
        color = "bg-blue-100 text-blue-700";
        label = "Timeout";
     } else if (r.includes("duplicate")) {
        color = "bg-yellow-100 text-yellow-700";
        label = "Duplicate Song";
     } else if (httpStatus && httpStatus >= 500) {
        color = "bg-red-100 text-red-700";
        label = `HTTP ${httpStatus}`;
     } else if (r.includes("404") || (httpStatus && httpStatus === 404)) {
        color = "bg-red-100 text-red-700";
        label = "Page Not Found (404)";
     } else if (r.includes("not a song page")) {
        color = "bg-slate-200 text-slate-700";
        label = "Not a Song Page";
     }

     return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${color}`}>
           {icon} {label}
        </span>
     );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Back Button */}
      <div>
        <Link 
          to="/admin/songs"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors w-max min-h-[44px]"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Songs Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm border border-red-100">
              <AlertOctagon size={24} />
            </div>
            Failed Imports <span className="text-lg text-slate-400 font-bold ml-2">({stats.failed})</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Review and manage failed background song scrapes.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchFailedImports} 
            disabled={loading || retryStatus?.isRunning}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh List
          </button>
          
          <button 
            onClick={handleRetryAll}
            disabled={retryStatus?.isRunning || stats.failed === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#54091b] text-white rounded-xl font-bold hover:bg-[#6a0b22] transition-all shadow-sm shadow-[#54091b]/20 disabled:opacity-50"
          >
            {retryStatus?.isRunning ? (
               <RefreshCw size={16} className="animate-spin" />
            ) : (
               <RotateCcw size={16} className="fill-white/20" />
            )}
            {retryStatus?.isRunning ? "Retrying..." : "Retry All Failed"}
          </button>
        </div>
      </div>

      {/* Retry Progress Bar */}
      {retryStatus?.isRunning && (
         <div className="bg-[#54091b] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                     <RefreshCw size={18} className="animate-spin" /> Retrying Failed Imports
                  </h3>
                  <p className="text-white/70 text-sm font-medium">Processing in background batches. You can navigate away safely.</p>
               </div>
               <div className="text-right">
                  <div className="text-2xl font-black">{retryStatus.retried} / {retryStatus.total}</div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider">Processed</div>
               </div>
            </div>
            
            <div className="mt-6">
               <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-emerald-400">{retryStatus.recovered} Recovered</span>
                  <span className="text-red-400">{retryStatus.failed} Still Failed</span>
                  <span className="text-slate-400">{retryStatus.skipped} Skipped</span>
               </div>
               <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(retryStatus.recovered / Math.max(1, retryStatus.total)) * 100}%` }}></div>
                  <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${(retryStatus.failed / Math.max(1, retryStatus.total)) * 100}%` }}></div>
                  <div className="bg-slate-500 h-full transition-all duration-300" style={{ width: `${(retryStatus.skipped / Math.max(1, retryStatus.total)) * 100}%` }}></div>
               </div>
            </div>
         </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Failed</div>
          <div className="text-3xl font-black text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recovered</div>
          <div className="text-3xl font-black text-emerald-600">{stats.recovered}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Retry Queue</div>
          <div className="text-3xl font-black text-blue-600">{stats.retryQueue}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Retry</div>
          <div className="text-xl font-black text-slate-800 mt-2">{stats.lastRetry}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 shrink-0">
              <FileText className="text-slate-400" size={18} />
              Quarantined Records
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
               {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in">
                     <button onClick={handleRetrySelected} className="px-3 py-1.5 bg-[#F4EFE7] text-[#54091b] font-bold text-xs rounded-lg border border-[#E8DCCB] hover:bg-[#E8DCCB] transition-colors">
                        Retry ({selectedIds.length})
                     </button>
                     <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-xs rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                        Delete
                     </button>
                  </div>
               )}
               
               <div className="relative w-full sm:w-64 shrink-0">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search by title, URL or provider..." 
                   value={search}
                   onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                   }}
                   className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#54091b] focus:ring-1 focus:ring-[#54091b] transition-all bg-white"
                 />
                 {search && (
                   <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                     <X size={14} />
                   </button>
                 )}
               </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 w-12 text-center">
                   <input type="checkbox" onChange={toggleAll} checked={failedImports.length > 0 && selectedIds.length === failedImports.length} className="rounded border-slate-300 text-[#54091b] focus:ring-[#54091b] w-4 h-4" />
                </th>
                <th className="px-4 py-4 w-[250px] max-w-[250px]">URL / Title</th>
                <th className="px-4 py-4">Provider</th>
                <th className="px-4 py-4">Reason</th>
                <th className="px-4 py-4 text-right">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"></td>
                      <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-1/2"></div></td>
                      <td className="px-4 py-4"><div className="h-6 bg-slate-200 rounded-md w-24"></div></td>
                      <td className="px-4 py-4"><div className="h-6 bg-slate-200 rounded-md w-32"></div></td>
                      <td className="px-4 py-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-20 ml-auto"></div></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                 ))
              ) : failedImports.length > 0 ? (
                 failedImports.map((song) => (
                    <tr key={song._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-center">
                         <input type="checkbox" checked={selectedIds.includes(song._id)} onChange={() => toggleSelection(song._id)} className="rounded border-slate-300 text-[#54091b] focus:ring-[#54091b] w-4 h-4" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                           {song.title && <span className="font-bold text-sm text-slate-800 mb-0.5">{song.title}</span>}
                           <div className="flex items-center gap-1.5">
                              <Globe size={12} className="text-slate-400 shrink-0" />
                              <a href={song.sourceUrl || song.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate w-48 block" title={song.sourceUrl || song.url}>
                                 {song.sourceUrl || song.url}
                              </a>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                          <Globe size={10} /> {song.source}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {formatReasonBadge(song.failReason, song.httpStatus)}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-500 text-right whitespace-nowrap">
                        {formatDate(song.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => { setSelectedIds([song._id]); handleRetrySelected(); }}
                             className="p-1.5 bg-white text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                             title="Retry"
                           >
                             <RotateCcw size={16} />
                           </button>
                           <button 
                             onClick={() => handleDelete(song._id)}
                             className="p-1.5 bg-white text-slate-400 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                             title="Delete"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                 ))
              ) : (
                 <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                       <div className="flex flex-col items-center gap-2">
                          <CheckCircle size={32} className="text-slate-300 mb-2" />
                          <p>No failed imports found.</p>
                          {search && (
                             <button onClick={() => { setSearch(""); setPage(1); }} className="mt-2 text-[#54091b] font-bold hover:underline">
                               Clear Search
                             </button>
                          )}
                       </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
             <button
               disabled={!hasPrevious}
               onClick={() => setPage(p => p - 1)}
               className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-[#54091b] disabled:opacity-30 disabled:hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
             >
               <ChevronLeft size={16} /> Previous
             </button>
             <div className="flex items-center gap-1 overflow-x-auto resources-scrollbar px-2">
               {Array.from({ length: totalPages }).map((_, i) => {
                 const pageNum = i + 1;
                 if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 2 && pageNum <= page + 2)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${pageNum === page ? 'bg-[#54091b] text-white shadow-md' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'}`}
                      >
                        {pageNum}
                      </button>
                    );
                 } else if (pageNum === page - 3 || pageNum === page + 3) {
                    return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                 }
                 return null;
               })}
             </div>
             <button
               disabled={!hasNext}
               onClick={() => setPage(p => p + 1)}
               className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-[#54091b] disabled:opacity-30 disabled:hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
             >
               Next <ChevronRight size={16} />
             </button>
           </div>
        )}
      </div>

    </div>
  );
}
