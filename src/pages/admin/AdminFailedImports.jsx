import React, { useState, useEffect, useCallback } from "react";
import API from "../../api/axios";
import { 
  RefreshCw, Trash2, Globe, Clock, 
  Search, ChevronLeft, ChevronRight, X, ArrowLeft,
  ServerCrash, RotateCcw, AlertTriangle, Archive, FileDown,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminFailedImports() {
  // Data State
  const [failedImports, setFailedImports] = useState([]);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [stats, setStats] = useState({
    failed: 0,
    recovering: 0,
    recovered: 0,
    retryQueue: 0,
    lastRetry: "N/A"
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Retry Progress State
  const [retryStatus, setRetryStatus] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        if (search !== searchInput) {
            setSearch(searchInput);
            setPage(1);
        }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await API.get(`/admin/songs/failed?page=${page}&limit=10&search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}`);
      if (res.data.success) {
        setFailedImports(res.data.data || []);
        setActivityTimeline(res.data.activityTimeline || []);
        setTotalPages(res.data.totalPages || 1);
        setHasNext(res.data.hasNext || false);
        setHasPrevious(res.data.hasPrevious || false);
        setStats(res.data.stats || stats);
      }
    } catch (err) {
      console.error("Failed to fetch failed imports:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [page, search, filter, stats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pollRetryStatus = async () => {
    try {
      const res = await API.get("/admin/songs/retry/status");
      if (res.data.success) {
        setRetryStatus(res.data.status);
        setIsRetrying(res.data.status?.total > 0 && res.data.status?.retried < res.data.status?.total);
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  useEffect(() => {
    let interval;
    const poll = async () => {
        if (document.visibilityState === 'visible') {
            await pollRetryStatus();
            fetchData(true);
        }
    };
    
    // Auto Refresh: Every 2 seconds during retry operations, otherwise 30 seconds
    const intervalTime = isRetrying ? 2000 : 30000;
    interval = setInterval(poll, intervalTime);
    
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            poll();
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData, isRetrying]);

  const handleRetryAll = async () => {
    try {
      await API.post("/admin/songs/retry-all");
      pollRetryStatus();
      fetchData(true);
    } catch (err) {
      alert("Failed to start retry all. Job might already be running or queue is empty.");
    }
  };

  const handleRetrySelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await API.post("/admin/songs/retry-selected", { ids: selectedIds });
      setSelectedIds([]);
      pollRetryStatus();
      fetchData(true);
    } catch (err) {
      alert("Failed to start retry selected.");
    }
  };

  const handleClearArchived = async () => {
      if (!window.confirm("Are you sure you want to delete ALL permanent failures forever?")) return;
      alert("Mass clear is not yet implemented. Please select rows to delete.");
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} records forever?`)) return;
    
    for (const id of selectedIds) {
       await API.delete(`/admin/songs/failed/${id}`);
    }
    setSelectedIds([]);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this failed record?")) return;
    try {
      const res = await API.delete(`/admin/songs/failed/${id}`);
      if (res.data.success) {
        fetchData();
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

  const timeAgo = (dateString) => {
      if (!dateString) return "N/A";
      const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " yr ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hr ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " min ago";
      return "Just now";
  };

  const getReasonType = (r, http) => {
      const text = (r || "").toLowerCase();
      if (text.includes("404") || http === 404) return "404";
      if (text.includes("invalid url")) return "Invalid URL";
      if (text.includes("unsupported") || text.includes("not a song page")) return "Unsupported Provider";
      if (text.includes("too short") || text.includes("empty lyrics")) return "Parser Error";
      return "Manual Review";
  };

  const getProviderColor = (provider) => {
      const p = (provider || "").toLowerCase();
      if (p.includes("world tamil")) return "bg-blue-50 text-blue-700 border-blue-200";
      if (p.includes("tamilchristiansongs.in")) return "bg-green-50 text-green-700 border-green-200";
      if (p.includes("worship")) return "bg-orange-50 text-orange-700 border-orange-200";
      if (p.includes("christsquare")) return "bg-purple-50 text-purple-700 border-purple-200";
      if (p.includes("keerthanai")) return "bg-teal-50 text-teal-700 border-teal-200";
      return "bg-slate-50 text-slate-700 border-slate-200"; // fallback
  };

  const formatReasonBadge = (reason, httpStatus) => {
     const type = getReasonType(reason, httpStatus);
     
     // The requirements say: Status Badge -> 🔴 Permanent, 🟡 Recovering, 🟢 Recovered
     // But this is for the filter chips vs reason types. Since the page only shows Permanent Failures, we can just use Permanent.
     return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
           <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
           Permanent
        </span>
     );
  };

  const recoverTitle = (song) => {
     if (song.title && song.title !== "Unknown Title" && song.title !== "Untitled" && song.title !== "") {
         return song.title;
     }
     
     // 1. Recover from URL slug
     const url = song.sourceUrl || song.url || "";
     if (url) {
         try {
            const urlObj = new URL(url);
            let path = urlObj.pathname;
            // Remove trailing slash
            if (path.endsWith("/")) path = path.slice(0, -1);
            // Get last segment
            const segments = path.split("/");
            let lastSegment = segments[segments.length - 1];
            if (lastSegment) {
                // Replace hyphens with spaces and capitalize
                return lastSegment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
         } catch(e) {}
     }
     
     // 2. Recover from first lyric line
     if (song.lyrics) {
         const firstLine = song.lyrics.split('\n').find(l => l.trim().length > 0);
         if (firstLine && firstLine.length < 50) return firstLine.trim();
     }
     
     return "Title unavailable";
  };

  const filters = ["All", "404", "HTTP 500", "Timeout", "Invalid URL", "Parser Error", "Manual Review"];

  // Group timeline by hour/minute
  const groupedTimeline = activityTimeline.reduce((acc, item) => {
      const date = new Date(item.updatedAt);
      const timeKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!acc[timeKey]) acc[timeKey] = [];
      acc[timeKey].push(item);
      return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans text-slate-900 bg-[#f8fafc] min-h-screen">
      
      {/* Header Compact */}
      <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div className="flex flex-col gap-1">
            <Link 
                to="/admin/songs"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors w-max uppercase tracking-widest mb-1"
            >
                <ArrowLeft size={14} /> Back to Songs Dashboard
            </Link>
            <div className="flex items-center gap-4">
               <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">Failed Imports</h1>
            </div>
            <p className="text-slate-500 text-xs font-medium">Review permanently failed imports requiring manual attention.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
                onClick={() => fetchData()} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm text-sm"
            >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden md:inline">Refresh</span>
            </button>
            <button 
                onClick={handleRetryAll}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md text-sm"
            >
                <RotateCcw size={14} />
                <span className="hidden md:inline">Retry Recoverable</span>
            </button>
            <button 
                onClick={handleClearArchived}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-rose-600 border border-slate-200 rounded-xl font-bold hover:bg-rose-50 transition-all shadow-sm text-sm"
            >
                <Trash2 size={14} />
                <span className="hidden md:inline">Clear Archived</span>
            </button>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-6">
          {/* KPI Cards (Compact Height) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[115px]">
              <div className="flex justify-between items-start mb-1">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><ServerCrash size={16} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-800 tracking-tight leading-none">{stats.failed}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Permanent</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[115px]">
              <div className="flex justify-between items-start mb-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><RefreshCw size={16} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-800 tracking-tight leading-none">{stats.recovering || 0}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Recovering</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[115px]">
              <div className="flex justify-between items-start mb-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle size={16} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-800 tracking-tight leading-none">{stats.recovered}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Recovered</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[115px]">
              <div className="flex justify-between items-start mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Clock size={16} /></div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none truncate">{activityTimeline.length > 0 ? timeAgo(activityTimeline[0].updatedAt) : "N/A"}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Last Recovery</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Main Content Table Area */}
            <div className="flex-1 w-full space-y-4">
                
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto admin-scrollbar pb-1 md:pb-0">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80 shrink-0">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search title, URL, provider..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 hover:bg-white shadow-inner"
                        />
                        {searchInput && (
                            <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sticky Bulk Action Toolbar */}
                {selectedIds.length > 0 && (
                    <div className="sticky top-[88px] z-30 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs font-black">{selectedIds.length}</div>
                            <span className="font-bold text-sm">Rows Selected</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button onClick={handleRetrySelected} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors">
                                <RotateCcw size={14} /> Retry
                            </button>
                            <button onClick={handleDeleteSelected} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-200 rounded-xl font-bold text-sm transition-colors">
                                <Trash2 size={14} /> Delete
                            </button>
                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors">
                                <Archive size={14} /> Archive
                            </button>
                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors">
                                <FileDown size={14} /> Export
                            </button>
                        </div>
                    </div>
                )}

                {/* Permanent Failures Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-3 w-12 text-center">
                                        <input type="checkbox" onChange={toggleAll} checked={failedImports.length > 0 && selectedIds.length === failedImports.length} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4" />
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[40%]">Song</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-1/2"></div></td>
                                        <td className="px-4 py-4"><div className="h-6 bg-slate-200 rounded-full w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : failedImports.length > 0 ? (
                                failedImports.map((song) => {
                                    const title = recoverTitle(song);
                                    const providerStyle = getProviderColor(song.source);
                                    return (
                                    <tr key={song._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-3 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(song._id)} onChange={() => toggleSelection(song._id)} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm mb-0.5 truncate flex items-center gap-2 ${title === 'Title unavailable' ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                                                    <span className="text-lg opacity-80">🎵</span> {title}
                                                </span>
                                                <a href={song.sourceUrl || song.url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-slate-400 hover:text-indigo-600 hover:underline truncate" title={song.sourceUrl || song.url}>
                                                    {song.sourceUrl || song.url}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${providerStyle}`}>
                                                <Globe size={10} /> {song.source || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatReasonBadge(song.failReason, song.httpStatus)}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setSelectedIds([song._id]); handleRetrySelected(); }}
                                                    className="p-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                                                    title="Retry"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(song._id)}
                                                    className="p-1.5 bg-white text-rose-400 border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                                                <CheckCircle size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">✅ Great! No failed imports.</h3>
                                                <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mt-1">Background importer is healthy and running smoothly.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 py-2">
                        <button
                            disabled={!hasPrevious}
                            onClick={() => setPage(p => p - 1)}
                            className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <div className="flex items-center gap-1 overflow-x-auto admin-scrollbar px-2">
                            {Array.from({ length: totalPages }).map((_, i) => {
                            const pageNum = i + 1;
                            if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 2 && pageNum <= page + 2)) {
                                return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${pageNum === page ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'}`}
                                >
                                    {pageNum}
                                </button>
                                );
                            } else if (pageNum === page - 3 || pageNum === page + 3) {
                                return <span key={pageNum} className="text-slate-400 px-1 font-bold">...</span>;
                            }
                            return null;
                            })}
                        </div>
                        <button
                            disabled={!hasNext}
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Right Panel: Compact Activity Timeline */}
            <div className="w-full xl:w-[320px] shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                    <Clock size={16} className="text-slate-400" strokeWidth={2.5} />
                    <h2 className="text-sm font-bold text-slate-800">Timeline</h2>
                </div>
                <div className="p-5 flex-1 overflow-y-auto max-h-[600px] admin-scrollbar">
                    {Object.keys(groupedTimeline).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(groupedTimeline).map(([time, events], i) => {
                                // Count events by type
                                let failed = 0;
                                let recovered = 0;
                                let retrying = 0;
                                
                                events.forEach(e => {
                                    if (e.status === 'completed') recovered++;
                                    else if (e.status === 'recovering') retrying++;
                                    else failed++;
                                });

                                return (
                                    <div key={time} className="relative pl-4 border-l-2 border-slate-100 pb-2 last:pb-0">
                                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                        <div className="text-[10px] font-bold text-slate-400 mb-1.5">{time}</div>
                                        <div className="space-y-1">
                                            {failed > 0 && <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> {failed} permanent failures detected</div>}
                                            {recovered > 0 && <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> {recovered} recovered automatically</div>}
                                            {retrying > 0 && <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span> {retrying} retry started</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={16} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-500">No recent timeline activity.</p>
                        </div>
                    )}
                </div>
            </div>

          </div>
      </div>
    </div>
  );
}
