import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { 
  Music, UploadCloud, CheckCircle, Search, Save, AlertCircle, 
  RefreshCw, Play, Calendar, User, Folder, Clock, Activity, 
  AlertTriangle, FileText, Check, ChevronLeft, ChevronRight, X, Plus 
} from "lucide-react";

const AdminSongs = React.memo(() => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  
  const [status, setStatus] = useState({ 
    totalSongs: 0, 
    activeSources: 0,
    importedToday: 0,
    importedThisWeek: 0,
    artists: 0,
    categories: 0,
    pendingImports: 0,
    failedImports: 0,
    lastImport: null,
    sourceBreakdown: [],
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);

  // Recent Imports state
  const [recentPage, setRecentPage] = useState(1);
  const [recentSearch, setRecentSearch] = useState("");
  const [recentData, setRecentData] = useState({ data: [], totalPages: 1, totalRecords: 0, hasNext: false, hasPrevious: false });
  const [recentLoading, setRecentLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await API.get("/admin/songs/status");
      if (res.data.success) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchScanStatus = useCallback(async () => {
    try {
      const res = await API.get("/admin/songs/scan/status");
      if (res.data.success) {
        setScanStatus(res.data.scanStatus);
      }
    } catch (err) {
      console.error("Failed to fetch scan status", err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchScanStatus();
  }, [fetchStatus, fetchScanStatus]);

  useEffect(() => {
    let interval;
    if (scanStatus?.isRunning) {
        interval = setInterval(fetchScanStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [scanStatus?.isRunning, fetchScanStatus]);

  useEffect(() => {
    const fetchRecent = async () => {
      setRecentLoading(true);
      try {
        const res = await API.get(`/admin/songs/recent?page=${recentPage}&limit=10&search=${encodeURIComponent(recentSearch)}`);
        if (res.data.success) {
          setRecentData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch recent imports:", err);
      } finally {
        setRecentLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchRecent();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [recentPage, recentSearch]);

  const handlePreview = useCallback(async (e) => {
    e?.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setSuccessMsg("");
    setFabOpen(false);

    try {
      const res = await API.post("/admin/songs/import-url", { url });
      if (res.data.success) {
        setPreview(res.data.preview);
        // Scroll to preview on mobile
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to extract lyrics. Invalid URL or provider error.";
      const errDetails = err.response?.data?.details;
      setError(errDetails ? `${errMsg} - ${errDetails}` : errMsg);
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleSave = useCallback(async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    
    try {
      const res = await API.post("/admin/songs/save", preview);
      if (res.data.success) {
        setSuccessMsg(`Successfully saved: ${preview.titleTamil || preview.title}`);
        setPreview(null);
        setUrl("");
        fetchStatus();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to save song";
      const errDetails = err.response?.data?.details;
      setError(errDetails ? `${errMsg} - ${errDetails}` : errMsg);
    } finally {
      setSaving(false);
    }
  }, [preview, fetchStatus]);

  const handleRunImport = useCallback(async () => {
    setFabOpen(false);
    try {
      const res = await API.post("/admin/songs/scan/start");
      if (res.data.success) {
        fetchScanStatus();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start scan");
    }
  }, [fetchScanStatus]);

  const timeAgo = useCallback((dateString) => {
    if (!dateString) return "";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yrs ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mos ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hrs ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " secs ago";
  }, []);

  const healthData = useMemo(() => {
    let healthState = "healthy";
    let healthColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
    let HealthIcon = Check;
    
    if (status.failedImports > 0) {
       if (status.failedImports < 10) {
          healthState = "partial";
          healthColor = "text-amber-600 bg-amber-50 border-amber-200";
          HealthIcon = AlertTriangle;
       } else {
          healthState = "error";
          healthColor = "text-red-600 bg-red-50 border-red-200";
          HealthIcon = AlertCircle;
       }
    }
    return { healthState, healthColor, HealthIcon };
  }, [status.failedImports]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-0">
      
      {/* Sticky Header Area */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-4 pb-4 border-b border-slate-100 md:border-none md:bg-transparent md:backdrop-blur-none flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div>
          <h1 className="text-[20px] md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 text-[#54091b]">
              <Music className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            Songs Library
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1 md:mt-2 hidden sm:block">Real-time metrics, imports, and multi-source analytics.</p>
        </div>
        
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3 w-full md:w-auto">
          <div className="flex gap-2">
             <button 
               onClick={fetchStatus} 
               disabled={refreshing}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
             >
               <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
               <span>Refresh Stats</span>
             </button>
             <Link 
               to="/admin/songs/failed" 
               className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all shadow-sm"
             >
               Failed
             </Link>
          </div>
          
          <button 
            onClick={handleRunImport}
            disabled={scanStatus?.isRunning}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#54091b] text-white rounded-xl font-bold hover:bg-[#6a0b22] transition-all shadow-sm shadow-[#54091b]/20 disabled:opacity-50"
          >
            {scanStatus?.isRunning ? (
               <RefreshCw size={16} className="animate-spin" />
            ) : (
               <Play size={16} className="fill-white" />
            )}
            {scanStatus?.isRunning ? "Scanning..." : "Full Library Scan"}
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
         {fabOpen && (
            <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 fade-in items-end">
               <button onClick={fetchStatus} className="flex items-center justify-end gap-3 px-4 py-3 bg-white text-slate-800 rounded-full shadow-lg border border-slate-100 font-bold text-sm w-max min-h-[44px]">
                 <span>Refresh Stats</span>
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /></div>
               </button>
               <Link to="/admin/songs/failed" onClick={() => setFabOpen(false)} className="flex items-center justify-end gap-3 px-4 py-3 bg-white text-red-600 rounded-full shadow-lg border border-slate-100 font-bold text-sm w-max min-h-[44px]">
                 <span>Failed Imports</span>
                 <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><AlertOctagon size={14} /></div>
               </Link>
               <button onClick={() => { setFabOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('manual-import-input')?.focus(); }} className="flex items-center justify-end gap-3 px-4 py-3 bg-white text-slate-800 rounded-full shadow-lg border border-slate-100 font-bold text-sm w-max min-h-[44px]">
                 <span>Manual Import</span>
                 <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><UploadCloud size={14} /></div>
               </button>
               <button onClick={handleRunImport} disabled={scanStatus?.isRunning} className="flex items-center justify-end gap-3 px-4 py-3 bg-[#54091b] text-white rounded-full shadow-lg font-bold text-sm w-max min-h-[44px]">
                 <span>{scanStatus?.isRunning ? "Scanning..." : "Full Scan"}</span>
                 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">{scanStatus?.isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} className="fill-white" />}</div>
               </button>
            </div>
         )}
         <button 
            onClick={() => setFabOpen(!fabOpen)}
            className="w-14 h-14 bg-[#54091b] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#54091b]/30 hover:scale-105 transition-transform"
         >
            <Plus size={24} className={`transition-transform duration-300 ${fabOpen ? "rotate-45" : ""}`} />
         </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        
        <div className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-[90px] md:h-auto">
          <div className="flex justify-between items-center md:items-start mb-1 md:mb-2">
            <div className="hidden md:flex p-2 bg-[#F4EFE7] text-[#54091b] rounded-xl"><Music size={18} /></div>
            <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Songs</span>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-black text-slate-900">{status.totalSongs}</div>
            <div className="hidden md:block text-sm font-medium text-slate-500">Songs in library</div>
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-[90px] md:h-auto">
          <div className="flex justify-between items-center md:items-start mb-1 md:mb-2">
            <div className="hidden md:flex p-2 bg-blue-50 text-blue-600 rounded-xl"><Activity size={18} /></div>
            <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Sources</span>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-black text-slate-900">{status.activeSources}</div>
            <div className="hidden md:block text-sm font-medium text-slate-500">Active providers</div>
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-[90px] md:h-auto">
          <div className="flex justify-between items-center md:items-start mb-1 md:mb-2">
            <div className="hidden md:flex p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Calendar size={18} /></div>
            <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="flex items-end justify-between md:block">
            <div className="text-xl md:text-3xl font-black text-slate-900">{status.importedToday}</div>
            <div className="text-[11px] md:text-sm font-bold md:font-medium text-emerald-600 md:text-slate-500 bg-emerald-50 md:bg-transparent px-1.5 md:px-0 py-0.5 md:py-0 rounded">Wk: {status.importedThisWeek}</div>
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-[90px] md:h-auto">
          <div className="flex justify-between items-center md:items-start mb-1 md:mb-2">
            <div className="hidden md:flex p-2 bg-indigo-50 text-indigo-600 rounded-xl"><User size={18} /></div>
            <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Artists</span>
          </div>
          <div>
            <div className="text-xl md:text-3xl font-black text-slate-900">{status.artists}</div>
            <div className="hidden md:block text-sm font-medium text-slate-500">Categories: {status.categories}</div>
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1 h-[90px] md:h-auto">
          <div className="flex justify-between items-center md:items-start mb-1 md:mb-2">
            <div className={`hidden md:flex p-2 rounded-xl items-center gap-1 ${healthData.healthColor}`}>
               <healthData.HealthIcon size={16} />
               <span className="text-xs font-bold uppercase">{healthData.healthState}</span>
            </div>
            <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider md:hidden">Failed</span>
            <span className="hidden md:inline text-xs font-bold text-slate-400 uppercase tracking-wider">Health</span>
          </div>
          <div className="flex justify-between items-end md:block">
            <div className="flex gap-4">
               <div>
                  <div className="text-xl md:text-2xl font-black text-red-600 md:text-slate-900">{status.failedImports}</div>
                  <div className="hidden md:block text-xs font-medium text-slate-500 uppercase">Failed</div>
               </div>
               <div className="hidden md:block">
                  <div className="text-xl md:text-2xl font-black text-slate-900">{status.pendingImports}</div>
                  <div className="text-xs font-medium text-slate-500 uppercase">Pending</div>
               </div>
            </div>
            <div className="text-[11px] md:text-xs font-bold text-slate-400 md:mt-2 flex items-center gap-1">
               <Clock size={10} className="md:w-3 md:h-3" /> {status.lastImport ? timeAgo(status.lastImport) : "N/A"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Running Scan Progress */}
          {scanStatus && (scanStatus.isRunning || scanStatus.totalDiscovered > 0) && (
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-[#F4EFE7] gap-3 md:gap-4">
                   <div className="flex items-center gap-3 md:gap-4">
                     <h2 className="text-[16px] md:text-lg font-bold text-[#54091b] flex items-center gap-2">
                        <Activity className={scanStatus.isRunning ? "animate-pulse" : ""} size={18} />
                        {scanStatus.isRunning ? "Scan in Progress" : "Scan Complete"}
                     </h2>
                   </div>
                   
                   <div className="grid grid-cols-4 md:flex gap-2 md:gap-6 text-sm">
                      <div className="flex flex-col">
                         <span className="text-slate-500 font-bold md:font-medium text-[10px] md:text-xs uppercase tracking-wider">Found</span>
                         <span className="font-black text-slate-800">{scanStatus.totalDiscovered}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-slate-500 font-bold md:font-medium text-[10px] md:text-xs uppercase tracking-wider">Queued</span>
                         <span className="font-black text-slate-800">{scanStatus.totalQueued}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[#54091b] font-bold md:font-medium text-[10px] md:text-xs uppercase tracking-wider">Done</span>
                         <span className="font-black text-[#54091b]">{scanStatus.totalImported + scanStatus.totalDuplicates + scanStatus.totalFailed + scanStatus.totalSkipped}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-blue-600 font-bold md:font-medium text-[10px] md:text-xs uppercase tracking-wider">Left</span>
                         <span className="font-black text-blue-700">{scanStatus.totalRemaining}</span>
                      </div>
                   </div>
                </div>
                
                {/* Desktop Table for Scan */}
                <div className="hidden md:block p-6 overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[800px]">
                     <thead>
                       <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                         <th className="pb-3">Provider</th>
                         <th className="pb-3 text-right">Found</th>
                         <th className="pb-3 text-right">Imported</th>
                         <th className="pb-3 text-right text-slate-300">Dups</th>
                         <th className="pb-3 text-right text-red-400">Failed</th>
                         <th className="pb-3 text-right text-blue-500">Remaining</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {Object.entries(scanStatus.providers).map(([providerName, stats]) => (
                          <tr key={providerName}>
                            <td className="py-3 font-bold text-sm text-slate-800">{providerName} <span className="text-[10px] text-slate-400 font-normal ml-2">({stats.status})</span></td>
                            <td className="py-3 text-right font-medium text-slate-600">{stats.discovered}</td>
                            <td className="py-3 text-right font-black text-[#54091b]">{stats.imported}</td>
                            <td className="py-3 text-right font-medium text-slate-400">{stats.duplicates}</td>
                            <td className="py-3 text-right font-medium text-red-500">{stats.failed}</td>
                            <td className="py-3 text-right font-medium text-blue-600">{stats.remaining}</td>
                          </tr>
                       ))}
                     </tbody>
                   </table>
                </div>

                {/* Mobile Cards for Scan */}
                <div className="md:hidden p-4 space-y-3 bg-slate-50">
                   {Object.entries(scanStatus.providers).map(([providerName, stats]) => (
                      <div key={providerName} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-[13px] text-slate-800 truncate">{providerName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">{stats.status}</span>
                         </div>
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mb-3">
                            <div className="bg-[#54091b] h-full" style={{ width: `${(stats.imported / Math.max(1, stats.discovered)) * 100}%` }}></div>
                            <div className="bg-slate-300 h-full" style={{ width: `${(stats.duplicates / Math.max(1, stats.discovered)) * 100}%` }}></div>
                            <div className="bg-red-500 h-full" style={{ width: `${(stats.failed / Math.max(1, stats.discovered)) * 100}%` }}></div>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[#54091b]">{stats.imported} Imported</span>
                            <span className="text-red-500">{stats.failed} Failed</span>
                            <span className="text-blue-600">{stats.remaining} Left</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Recent Imports Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 bg-slate-50/50 sticky top-[72px] md:static z-20">
               <h2 className="text-[16px] md:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="text-slate-400" size={18} />
                  Recent Imports
               </h2>
               <div className="relative w-full md:w-64">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={recentSearch}
                   onChange={(e) => {
                      setRecentSearch(e.target.value);
                      setRecentPage(1);
                   }}
                   className="w-full pl-9 pr-8 py-2 md:py-2 min-h-[44px] md:min-h-[38px] text-[16px] md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#54091b] focus:ring-1 focus:ring-[#54091b] transition-all bg-white"
                 />
                 {recentSearch && (
                   <button 
                     onClick={() => {
                        setRecentSearch("");
                        setRecentPage(1);
                     }}
                     className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                   >
                     <X size={16} />
                   </button>
                 )}
               </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block flex-1 overflow-x-auto min-h-[400px]">
               <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                   <th className="px-6 py-4">Title</th>
                   <th className="px-6 py-4">Source</th>
                   <th className="px-6 py-4">Time</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100/80">
                 {recentLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-slate-200 rounded-md w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded-md w-16"></div>
                        </td>
                      </tr>
                    ))
                 ) : recentData.data && recentData.data.length > 0 ? (
                    recentData.data.map((song, i) => (
                       <tr key={song._id || i} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="font-bold text-sm text-slate-800">{song.titleTamil || song.title}</div>
                           {(song.artist || song.album) && (
                              <div className="text-xs text-slate-500 mt-0.5">{song.artist || song.album}</div>
                           )}
                         </td>
                         <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#F4EFE7] text-[#54091b] border border-[#E8DCCB]">
                             {song.source}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                           {timeAgo(song.importedAt || song.createdAt)}
                         </td>
                       </tr>
                    ))
                 ) : (
                    <tr>
                       <td colSpan="3" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                             <Search size={32} className="text-slate-300" />
                             <p>No matching songs found.</p>
                             {recentSearch && (
                                <button 
                                  onClick={() => { setRecentSearch(""); setRecentPage(1); }}
                                  className="mt-2 text-[#54091b] font-bold hover:underline min-h-[44px] px-4"
                                >
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

            {/* Mobile Cards */}
            <div className="md:hidden flex-1 p-3 bg-slate-50 space-y-3 min-h-[400px]">
               {recentLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                        <div className="flex justify-between">
                           <div className="h-6 bg-slate-200 rounded w-24"></div>
                           <div className="h-4 bg-slate-100 rounded w-16"></div>
                        </div>
                     </div>
                  ))
               ) : recentData.data && recentData.data.length > 0 ? (
                  recentData.data.map((song, i) => (
                     <div key={song._id || i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="font-bold text-[14px] text-slate-900 leading-tight mb-1">{song.titleTamil || song.title}</div>
                        {(song.artist || song.album) && (
                           <div className="text-[12px] text-slate-500 mb-3">{song.artist || song.album}</div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                           <span className="inline-flex items-center px-2 py-1 rounded-[6px] text-[10px] font-bold bg-[#F4EFE7] text-[#54091b] border border-[#E8DCCB] uppercase tracking-wider">
                             {song.source}
                           </span>
                           <span className="text-[11px] font-bold text-slate-400">
                             {timeAgo(song.importedAt || song.createdAt)}
                           </span>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="py-12 text-center text-sm font-medium text-slate-400">
                     <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-slate-300" />
                        <p>No matching songs found.</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Pagination Controls */}
            {recentData.totalPages > 1 && (
               <div className="p-3 md:p-4 border-t border-slate-100 bg-white md:bg-slate-50 flex items-center justify-between gap-2 md:gap-4 sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] md:shadow-none">
                 <button
                   disabled={!recentData.hasPrevious}
                   onClick={() => setRecentPage(p => p - 1)}
                   className="flex items-center justify-center gap-1 text-[13px] md:text-sm font-bold text-slate-600 hover:text-[#54091b] disabled:opacity-30 disabled:hover:text-slate-600 transition-colors px-3 py-2 min-h-[44px] rounded-xl hover:bg-slate-100 border border-slate-200 md:border-transparent flex-1 md:flex-none"
                 >
                   <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
                 </button>
                 
                 {/* Desktop Pagination Numbers */}
                 <div className="hidden md:flex items-center gap-1 overflow-x-auto resources-scrollbar px-2">
                   {Array.from({ length: recentData.totalPages }).map((_, i) => {
                     const pageNum = i + 1;
                     if (pageNum === 1 || pageNum === recentData.totalPages || (pageNum >= recentPage - 2 && pageNum <= recentPage + 2)) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setRecentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${pageNum === recentPage ? 'bg-[#54091b] text-white shadow-md' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'}`}
                          >
                            {pageNum}
                          </button>
                        );
                     } else if (pageNum === recentPage - 3 || pageNum === recentPage + 3) {
                        return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                     }
                     return null;
                   })}
                 </div>

                 {/* Mobile Pagination Info */}
                 <div className="md:hidden text-[13px] font-bold text-slate-500 whitespace-nowrap">
                    Page {recentPage} of {recentData.totalPages}
                 </div>

                 <button
                   disabled={!recentData.hasNext}
                   onClick={() => setRecentPage(p => p + 1)}
                   className="flex items-center justify-center gap-1 text-[13px] md:text-sm font-bold text-slate-600 hover:text-[#54091b] disabled:opacity-30 disabled:hover:text-slate-600 transition-colors px-3 py-2 min-h-[44px] rounded-xl hover:bg-slate-100 border border-slate-200 md:border-transparent flex-1 md:flex-none"
                 >
                   <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar: Source Breakdown & URL Import */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Source Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6">
             <h2 className="text-[16px] md:text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 md:mb-5">
                <Folder className="text-slate-400" size={18} />
                Source Breakdown
             </h2>
             <div className="space-y-3">
                {status.sourceBreakdown && status.sourceBreakdown.length > 0 ? (
                   status.sourceBreakdown.map((src, i) => {
                      const maxCount = Math.max(...status.sourceBreakdown.map(s => s.count));
                      const percentage = (src.count / maxCount) * 100;
                      return (
                         <div key={i} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                               <span className="text-[13px] md:text-sm font-bold text-slate-700 truncate mr-2">{src._id || "Unknown"}</span>
                               <span className="text-[11px] md:text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded shrink-0">{src.count}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                               <div className="bg-[#54091b] h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                            </div>
                         </div>
                      );
                   })
                ) : (
                   <div className="text-center text-sm text-slate-400 font-medium py-4">No sources available</div>
                )}
             </div>
          </div>

          {/* Manual Import Card */}
          <div className="bg-gradient-to-br from-[#54091b] to-[#7a0f29] rounded-3xl p-5 md:p-6 shadow-md text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 hidden md:block">
               <UploadCloud size={100} />
            </div>
            <div className="relative z-10">
               <h2 className="text-[16px] md:text-lg font-bold flex items-center gap-2 mb-2">
                 <UploadCloud size={18} />
                 Manual Import
               </h2>
               <p className="text-[13px] md:text-sm font-medium text-white/80 mb-4 md:mb-5">
                  Paste a song URL directly from approved providers to import immediately.
               </p>
               <form onSubmit={handlePreview} className="flex flex-col gap-3">
                 <input
                   id="manual-import-input"
                   type="url"
                   placeholder="https://..."
                   className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 min-h-[44px] md:min-h-[auto] md:py-3 text-[16px] md:text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                   required
                 />
                 <button
                   type="submit"
                   disabled={loading}
                   className="w-full bg-white text-[#54091b] px-6 py-2 min-h-[44px] md:min-h-[auto] md:py-3 rounded-xl font-bold hover:bg-[#F4EFE7] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                 >
                   {loading ? <div className="w-5 h-5 border-2 border-[#54091b]/30 border-t-[#54091b] rounded-full animate-spin" /> : <Search size={18} />}
                   {loading ? "Extracting..." : "Preview"}
                 </button>
               </form>

               {error && (
                 <div className="mt-4 p-3 bg-red-500/20 text-red-100 rounded-xl border border-red-500/30 flex items-start gap-2">
                   <AlertCircle size={16} className="shrink-0 mt-0.5" />
                   <p className="font-medium text-xs break-words">{error}</p>
                 </div>
               )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Manual Import Preview Modal/Card */}
      {preview && (
        <div className="bg-white rounded-3xl overflow-hidden border border-[#D4AF37]/30 shadow-xl shadow-[#D4AF37]/10 relative animate-in zoom-in-95 duration-300 flex flex-col">
          <div className="bg-gradient-to-r from-[#F4EFE7] to-white p-4 md:p-8 border-b border-[#E8DCCB] flex flex-col justify-between items-start gap-4">
            <div className="w-full">
              <div className="text-[10px] md:text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle size={14} /> Import Ready
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{preview.titleTamil || preview.title}</h3>
              {preview.titleEnglish && <p className="text-slate-500 text-[13px] md:text-sm font-bold mt-1">{preview.titleEnglish}</p>}
              <div className="mt-3 text-[11px] md:text-sm text-slate-500 flex items-center gap-2">
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">Source</span> {preview.source}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#D4AF37] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl min-h-[44px] md:min-h-[auto] font-black hover:bg-[#c39b26] transition-all shadow-md shadow-[#D4AF37]/30 flex items-center justify-center gap-2 w-full hover:-translate-y-0.5"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              {saving ? "Saving..." : "Approve & Save"}
            </button>
          </div>
          
          <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 bg-[#FAFAFA] flex-1">
            <div>
              <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Tamil Lyrics</h4>
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap font-serif text-[14px] md:text-base leading-relaxed text-slate-800 h-full">
                {preview.lyricsTamil || preview.lyrics}
              </div>
            </div>
            
            {preview.lyricsEnglish && (
              <div>
                <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3">English Transliteration</h4>
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap font-serif text-[14px] md:text-base leading-relaxed text-slate-800 h-full">
                  {preview.lyricsEnglish}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {successMsg && (
         <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 left-4 md:left-auto bg-emerald-600 text-white px-4 md:px-6 py-3 md:py-4 min-h-[44px] rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 z-50">
            <div className="flex items-center gap-3">
               <CheckCircle size={20} className="shrink-0" />
               <span className="font-bold text-[13px] md:text-sm truncate max-w-[200px] md:max-w-[none]">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="ml-2 opacity-70 hover:opacity-100 p-2"><X size={16} /></button>
         </div>
      )}
    </div>
  );
});

export default AdminSongs;
