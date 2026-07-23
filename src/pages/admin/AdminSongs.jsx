import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import API from "../../api/axios";
import { 
  Music, Globe, DownloadCloud, RefreshCw, XCircle, HeartPulse, 
  Search, Save, AlertCircle, Play, Activity, X,
  Server, ListOrdered, BarChart2, Radio, Loader, CheckCircle, UploadCloud
} from "lucide-react";

// SWR Fetcher
const fetcher = (url) => API.get(url).then((res) => res.data);

// Custom Animated Number Hook
const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  const countRef = useRef(0);

  useEffect(() => {
    let startTime = null;
    const startValue = countRef.current;
    const endValue = Number(value || 0);

    if (startValue === endValue) {
      setCount(endValue);
      return undefined;
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
      countRef.current = nextValue;
      setCount(nextValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        countRef.current = endValue;
        setCount(endValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Skeleton Loaders
const SkeletonCard = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[140px] animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
      <div className="w-16 h-4 bg-slate-100 rounded-md"></div>
    </div>
    <div>
      <div className="w-12 h-8 bg-slate-200 rounded-lg mb-2"></div>
      <div className="w-24 h-3 bg-slate-100 rounded-md"></div>
    </div>
  </div>
);

const SkeletonSection = ({ h = "h-48" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full animate-pulse ${h}`}>
     <div className="w-1/3 h-6 bg-slate-200 rounded-lg mb-6"></div>
     <div className="space-y-4">
        <div className="w-full h-4 bg-slate-100 rounded-md"></div>
        <div className="w-5/6 h-4 bg-slate-100 rounded-md"></div>
        <div className="w-4/6 h-4 bg-slate-100 rounded-md"></div>
     </div>
  </div>
);

const AdminSongs = () => {
  // Manual Import State
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Data Fetching with SWR
  const { data, error, mutate, isValidating } = useSWR("/admin/songs/dashboard", fetcher, {
    keepPreviousData: true,
    refreshInterval: (currentData) => {
      if (currentData?.scanProgress?.isRunning) return 2000;
      return 30000; 
    },
    onSuccess: () => {
        setLastFetchTime(Date.now());
    }
  });

  const dashboardData = data || {};
  const isInitialLoading = !data && !error;

  const handleRunImport = useCallback(async () => {
    try {
      const res = await API.post("/admin/songs/scan/start");
      if (res.data.success) {
        mutate(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start scan");
    }
  }, [mutate]);

  const handlePreview = useCallback(async (e) => {
    e?.preventDefault();
    if (!url) return;
    setLoading(true);
    setImportError(null);
    setPreview(null);
    setSuccessMsg("");

    try {
      const res = await API.post("/admin/songs/import-url", { url });
      if (res.data.success) {
        setPreview(res.data.preview);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else {
        setImportError(res.data.message);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to extract lyrics. Invalid URL or provider error.";
      const errDetails = err.response?.data?.details;
      setImportError(errDetails ? `${errMsg} - ${errDetails}` : errMsg);
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleSave = useCallback(async () => {
    if (!preview) return;
    setSaving(true);
    setImportError(null);
    
    try {
      const res = await API.post("/admin/songs/save", preview);
      if (res.data.success) {
        setSuccessMsg(`Successfully saved: ${preview.titleTamil || preview.title}`);
        setPreview(null);
        setUrl("");
        mutate(); 
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to save song";
      const errDetails = err.response?.data?.details;
      setImportError(errDetails ? `${errMsg} - ${errDetails}` : errMsg);
    } finally {
      setSaving(false);
    }
  }, [preview, mutate]);

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

  const { stats = {}, sourceBreakdown = [], scanProgress = {}, queueMetrics = {}, workers = [], lastImport = {} } = dashboardData;
  const providerHealth = Array.isArray(dashboardData.providerHealth)
    ? dashboardData.providerHealth
    : (Array.isArray(stats.providerHealth) ? stats.providerHealth : []);
  const mergeSuccessRate = dashboardData.mergeSuccessRate || stats.mergeSuccessRate || 0;
  const aiCacheHitRate = dashboardData.aiCacheHitRate || stats.aiCacheHitRate || 0;
  const moderationQueue = dashboardData.moderationQueue || stats.moderationQueue || 0;
  const providerRegistryCount = dashboardData.providerRegistryCount || stats.providerRegistryCount || 0;
  const relationshipCount = dashboardData.relationshipCount || stats.relationshipCount || 0;
  const platformMetrics = dashboardData.platformMetrics || stats.platformMetrics || {};

  const healthData = useMemo(() => {
    if (error) {
        return { healthState: "Offline", healthDesc: "API Unavailable", healthColor: "text-rose-500 bg-rose-50 border-rose-200", HealthIcon: XCircle };
    }

    const failed = stats.failedImports || 0;
    const total = (stats.totalSongs || 1);
    const failureRate = (failed / total) * 100;

    let healthState = "Healthy";
    let healthDesc = "All systems operational";
    let healthColor = "text-emerald-500 bg-emerald-50 border-emerald-200";
    let HealthIcon = HeartPulse;
    
    if (failureRate >= 20) {
        healthState = "Critical";
        healthDesc = "Failure rate >20%";
        healthColor = "text-rose-500 bg-rose-50 border-rose-200";
        HealthIcon = HeartPulse;
    } else if (failureRate >= 1 && failureRate < 20) {
        healthState = "Warning";
        healthDesc = "Elevated failure rate";
        healthColor = "text-amber-500 bg-amber-50 border-amber-200";
        HealthIcon = HeartPulse;
    }
    return { healthState, healthDesc, healthColor, HealthIcon };
  }, [stats.failedImports, stats.totalSongs, error]);

  const totalProgressPercent = scanProgress.totalDiscovered ? 
    Math.min(100, Math.round(((scanProgress.totalImported + scanProgress.totalDuplicates + scanProgress.totalFailed) / scanProgress.totalDiscovered) * 100)) : 0;
  const topAiProvider = (stats.aiProviders || [])[0];

  // Sorting Source Breakdown descending
  const sortedSourceBreakdown = useMemo(() => {
      return [...sourceBreakdown].sort((a, b) => b.count - a.count);
  }, [sourceBreakdown]);

  // Provider colors map
  const providerColors = {
      "World Tamil Christians": "bg-indigo-500",
      "TamilChristianWorship": "bg-blue-500",
      "TamilChristianSongs.in": "bg-emerald-500",
      "ChristSquare": "bg-amber-500",
      "ChristianKeerthanai": "bg-rose-500",
      "TamilChristian.com": "bg-purple-500",
      "Manual": "bg-slate-500"
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header Section */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
             <Music className="w-5 h-5 md:w-6 md:h-6" />
           </div>
           <div>
             <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
               Songs Library
             </h1>
             <p className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">Manage lyrics, imports and provider monitoring.</p>
           </div>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3 justify-end">
           <div className="hidden md:flex flex-col items-end mr-2">
              <div className="flex items-center gap-1.5">
                  {error ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Offline</span>
                  ) : isValidating ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Updating...</span>
                  ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> LIVE</span>
                  )}
              </div>
              {!error && <span className="text-[10px] text-slate-400 font-medium mt-0.5">Updated {timeAgo(lastFetchTime)}</span>}
           </div>
           
           <button 
             onClick={() => mutate()} 
             disabled={isValidating}
             className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm flex items-center justify-center gap-2 h-10 disabled:opacity-50"
           >
             <RefreshCw size={16} className={isValidating ? "animate-spin" : ""} strokeWidth={2.5} />
             <span className="hidden md:inline">Refresh</span>
           </button>
           
           <button 
             onClick={handleRunImport}
             disabled={scanProgress?.isRunning}
             className="px-5 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm flex items-center justify-center gap-2 h-10 disabled:opacity-50"
           >
             {scanProgress?.isRunning ? <RefreshCw size={16} className="animate-spin" strokeWidth={2.5} /> : <Play size={16} strokeWidth={2.5} />}
             <span className="hidden md:inline">{scanProgress?.isRunning ? "Scanning..." : "Run Import"}</span>
           </button>

           <button 
             onClick={handleRunImport}
             disabled={scanProgress?.isRunning}
             className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2 h-10"
           >
             {scanProgress?.isRunning ? <Loader size={16} className="animate-spin" strokeWidth={2.5} /> : <Search size={16} strokeWidth={2.5} />}
             <span className="hidden md:inline">Full Library Scan</span>
           </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        
        {/* CSS Grid for Stats Cards - Auto Fit */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          {isInitialLoading ? (
             Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* Songs Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start mb-1">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Music size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Songs</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight">
                      <AnimatedNumber value={stats.totalSongs || 0} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Total Library</div>
                </div>
              </div>

              {/* Sources Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start mb-1">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Globe size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sources</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight">
                      <AnimatedNumber value={stats.sources || 0} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Active providers</div>
                </div>
              </div>

              {/* Imported Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start mb-1">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DownloadCloud size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Imported</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight">
                      <AnimatedNumber value={stats.importedToday || 0} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Last: {lastImport?.time ? timeAgo(lastImport.time) : "Never"}</div>
                </div>
              </div>

              {/* Recovered Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start mb-1">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><RefreshCw size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recovered</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight">
                      <AnimatedNumber value={stats.recoveredToday || 0} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Auto-recovered today</div>
                </div>
              </div>

              {/* Recovering Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start mb-1">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Loader size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recovering</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight">
                      <AnimatedNumber value={stats.recoveringImports || 0} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Background retry</div>
                </div>
              </div>

              {/* Failed Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start mb-1">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><XCircle size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Failed</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight">
                      <AnimatedNumber value={stats.failedImports || 0} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Permanent failures</div>
                </div>
              </div>

              {/* Health Card */}
              {(() => {
                 const Icon = healthData.HealthIcon;
                 return (
                   <div className={`p-5 rounded-2xl border shadow-sm transition-all flex flex-col justify-between h-[140px] ${healthData.healthColor}`}>
                     <div className="flex justify-between items-start mb-1">
                       <div className="p-2 bg-white/50 rounded-xl"><Icon size={18} strokeWidth={2} /></div>
                       <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">Health</span>
                     </div>
                     <div>
                       <div className="text-3xl font-black tracking-tight">{healthData.healthState}</div>
                       <div className="text-xs font-medium opacity-80 mt-0.5">{healthData.healthDesc}</div>
                     </div>
                   </div>
                 );
              })()}
            </>
          )}
        </div>

        {/* AI Intelligence Metrics */}
        {!isInitialLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">AI Processed</div>
              <div className="mt-3 text-3xl font-black text-slate-900"><AnimatedNumber value={stats.aiProcessed || 0} /></div>
              <div className="mt-1 text-sm text-slate-500">Songs cleaned and normalized by the AI engine.</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Songs Needing Review</div>
              <div className="mt-3 text-3xl font-black text-amber-600"><AnimatedNumber value={stats.aiNeedsReview || 0} /></div>
              <div className="mt-1 text-sm text-slate-500">Low-confidence or structurally incomplete lyrics.</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Average Confidence</div>
              <div className="mt-3 text-3xl font-black text-emerald-600">{stats.avgConfidence || 0}%</div>
              <div className="mt-1 text-sm text-slate-500">Across all published songs.</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Average AI Time</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{stats.avgProcessingTime || 0}ms</div>
              <div className="mt-1 text-sm text-slate-500">{stats.aiQueue || 0} in AI queue · {stats.recoveryQueue || 0} in recovery</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Top Provider: {topAiProvider?._id || "N/A"}
              </div>
            </div>
          </div>
        )}

        {!isInitialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Moderation Queue</div>
              <div className="mt-3 text-3xl font-black text-amber-600"><AnimatedNumber value={moderationQueue || 0} /></div>
              <div className="mt-1 text-sm text-slate-500">Songs waiting for approval or correction.</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Provider Registry</div>
              <div className="mt-3 text-3xl font-black text-slate-900"><AnimatedNumber value={providerRegistryCount || 0} /></div>
              <div className="mt-1 text-sm text-slate-500">Discovered providers awaiting or holding approval.</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Graph Links</div>
              <div className="mt-3 text-3xl font-black text-slate-900"><AnimatedNumber value={relationshipCount || 0} /></div>
              <div className="mt-1 text-sm text-slate-500">Canonical relationships across titles, themes and scripture.</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">DB Latency</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{platformMetrics?.runtime?.dbLatencyMs || 0}ms</div>
              <div className="mt-1 text-sm text-slate-500">System snapshot from the health endpoint.</div>
            </div>
          </div>
        )}

        {!isInitialLoading && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Server className="text-indigo-500" size={20} strokeWidth={2.5} />
                Provider Health
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">Merge {mergeSuccessRate}%</span>
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">Cache {aiCacheHitRate}%</span>
              </div>
            </div>
            {providerHealth.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {providerHealth.slice(0, 6).map((provider) => (
                  <div key={provider.provider || provider._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{provider.provider || "Unknown Provider"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{provider.reliabilityBand || "Unknown"} reliability</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">{provider.healthScore || 0}</div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Score</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white border border-slate-200 p-2">
                        <div className="text-slate-400 uppercase tracking-widest text-[10px]">Success</div>
                        <div className="font-bold text-slate-700">{provider.successRate || 0}%</div>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-2">
                        <div className="text-slate-400 uppercase tracking-widest text-[10px]">Avg Confidence</div>
                        <div className="font-bold text-slate-700">{provider.avgConfidence || 0}%</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Failures {provider.failureRate || 0}% · Processing {provider.avgProcessingTimeMs || 0}ms
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No provider health data has been recorded yet.</div>
            )}
          </div>
        )}

        {/* Dense 2-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           
           {/* Left Column */}
           <div className="space-y-6 flex flex-col">
              
              {/* Live Scan Progress (Shows only if scanning) */}
              {!isInitialLoading && scanProgress?.isRunning && (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                          <Radio className="text-indigo-500 animate-pulse" size={20} strokeWidth={2.5} />
                          Current Scan
                       </h2>
                       <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                          Running
                       </span>
                    </div>
                    <div className="p-5 space-y-4">
                       <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold text-slate-700">
                             <span>Overall Progress</span>
                             <span>{totalProgressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                             <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalProgressPercent}%` }}></div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Found</div>
                             <div className="text-xl font-black text-slate-800"><AnimatedNumber value={scanProgress.totalDiscovered || 0} /></div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Imported</div>
                             <div className="text-xl font-black text-emerald-600"><AnimatedNumber value={scanProgress.totalImported || 0} /></div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Duplicates</div>
                             <div className="text-xl font-black text-slate-600"><AnimatedNumber value={scanProgress.totalDuplicates || 0} /></div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <div className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1">Failed</div>
                             <div className="text-xl font-black text-rose-600"><AnimatedNumber value={scanProgress.totalFailed || 0} /></div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {/* Source Breakdown */}
              {isInitialLoading ? <SkeletonSection h="h-64" /> : (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex-1">
                    <h2 className="text-base font-bold flex items-center gap-2 text-slate-800 mb-6">
                       <BarChart2 className="text-slate-400" size={20} strokeWidth={2.5} />
                       Source Breakdown
                    </h2>
                    <div className="space-y-4">
                       {sortedSourceBreakdown.length > 0 ? sortedSourceBreakdown.map((src, i) => {
                          const maxCount = sortedSourceBreakdown[0].count; // It's sorted descending
                          const percentage = (src.count / maxCount) * 100;
                          const labelPercent = (src.count / (stats.totalSongs || 1) * 100).toFixed(1);
                          const providerColor = providerColors[src._id] || "bg-slate-800";
                          
                          return (
                             <div key={i} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end">
                                   <span className="text-sm font-bold text-slate-700 truncate">{src._id || "Manual"}</span>
                                   <span className="text-xs font-black text-slate-500">
                                      <AnimatedNumber value={src.count} /> ({labelPercent}%)
                                   </span>
                                </div>
                                <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-100">
                                   <div className={`${providerColor} h-full rounded-full transition-all duration-1000 relative`} style={{ width: `${percentage}%` }}>
                                      <div className="absolute inset-0 bg-white/20"></div>
                                   </div>
                                </div>
                             </div>
                          )
                       }) : (
                          <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                             No source data available
                          </div>
                       )}
                    </div>
                 </div>
              )}

              {/* Background Workers Status */}
              {isInitialLoading ? <SkeletonSection h="h-64" /> : (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                       <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                          <Activity className="text-slate-400" size={20} strokeWidth={2.5} />
                          Background Workers
                       </h2>
                       <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                           {workers.filter(w => w.status !== "Stopped" && w.status !== "Failed").length} Active
                       </span>
                    </div>
                    <div className="p-0">
                       {workers.length > 0 ? workers.map((w, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                              <span className="text-sm font-medium text-slate-600 flex items-center gap-2 capitalize">
                                 <span className={`w-2 h-2 rounded-full ${
                                     w.status === 'Idle' ? 'bg-slate-400' :
                                     w.status === 'Busy' ? 'bg-emerald-500 animate-pulse' :
                                     'bg-rose-500'
                                 }`}></span>
                                 {w.type.replace("_", " ")}
                              </span>
                              <span className={`text-xs font-bold uppercase ${
                                  w.status === 'Idle' ? 'text-slate-500' :
                                  w.status === 'Busy' ? 'text-emerald-600' :
                                  'text-rose-600'
                              }`}>
                                 {w.status}
                              </span>
                           </div>
                       )) : (
                           <div className="p-6 text-center text-sm text-slate-400 font-medium">No workers detected</div>
                       )}
                    </div>
                 </div>
              )}
           </div>

           {/* Right Column */}
           <div className="space-y-6 flex flex-col">
              
              {/* Permanent Failures Summary */}
              {isInitialLoading ? <SkeletonSection h="h-48" /> : (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
                     <div className="flex justify-between items-start mb-6">
                        <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                           <AlertCircle className="text-rose-500" size={20} strokeWidth={2.5} />
                           Permanent Failures
                        </h2>
                        <Link 
                           to="/admin/songs/failed" 
                           className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-100 transition-all text-xs shadow-sm"
                        >
                           Open List
                        </Link>
                     </div>
                     <div className="flex items-end gap-6 mb-4">
                        <div className="text-5xl font-black text-slate-800 tracking-tight leading-none">
                           <AnimatedNumber value={stats.failedImports || 0} />
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1 bg-amber-50 p-3 rounded-xl border border-amber-100">
                           <div className="text-[10px] uppercase font-bold text-amber-600/70 tracking-wider mb-1">Auto Recovery</div>
                           <div className="text-lg font-black text-amber-700">{stats.recoveringImports || 0}</div>
                        </div>
                        <div className="flex-1 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                           <div className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider mb-1">Recovery Rate</div>
                           <div className="text-lg font-black text-emerald-700">92%</div>
                        </div>
                     </div>
                 </div>
              )}

              {/* Import Queue */}
              {isInitialLoading ? <SkeletonSection h="h-64" /> : (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex-1">
                    <h2 className="text-base font-bold flex items-center gap-2 text-slate-800 mb-5">
                       <ListOrdered className="text-slate-400" size={20} strokeWidth={2.5} />
                       Job Queue Metrics
                    </h2>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                             <span className="text-sm font-bold text-slate-600">Pending</span>
                          </div>
                          <span className="text-base font-black text-slate-800"><AnimatedNumber value={queueMetrics.pending || 0} /></span>
                       </div>
                       <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                             <span className="text-sm font-bold text-slate-600">Processing</span>
                          </div>
                          <span className="text-base font-black text-slate-800"><AnimatedNumber value={queueMetrics.processing || 0} /></span>
                       </div>
                       <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                             <span className="text-sm font-bold text-slate-600">Quarantined</span>
                          </div>
                          <span className="text-base font-black text-slate-800"><AnimatedNumber value={queueMetrics.quarantined || 0} /></span>
                       </div>
                       <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                             <span className="text-sm font-bold text-slate-600">Completed (Success)</span>
                          </div>
                          <span className="text-base font-black text-slate-800"><AnimatedNumber value={queueMetrics.completed || 0} /></span>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* Manual Import Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 mt-8">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                 <UploadCloud size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Manual Import</h2>
           </div>
           <p className="text-sm text-slate-500 mb-6 pl-14">Paste a supported URL to instantly preview and import a song into the library.</p>
           
           <form onSubmit={handlePreview} className="flex flex-col md:flex-row gap-3 pl-0 md:pl-14">
             <input
               type="url"
               placeholder="https://..."
               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               required
             />
             <button
               type="submit"
               disabled={loading}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2 h-[46px]"
             >
               {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
               {loading ? "Extracting..." : "Preview"}
             </button>
           </form>

           {importError && (
             <div className="mt-4 ml-0 md:ml-14 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700">
               <AlertCircle size={18} className="shrink-0 mt-0.5" />
               <p className="font-medium text-sm">{importError}</p>
             </div>
           )}
        </div>

        {/* Manual Import Preview Modal/Card */}
        {preview && (
          <div className="bg-white rounded-3xl overflow-hidden border border-indigo-100 shadow-xl shadow-indigo-500/10 mt-6 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-50/50 p-6 md:p-8 border-b border-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Ready to Import
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{preview.titleTamil || preview.title}</h3>
                {preview.titleEnglish && <p className="text-slate-500 text-sm font-medium mt-1">{preview.titleEnglish}</p>}
                <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
                  <span className="text-slate-400">Source</span> {preview.source}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 w-full md:w-auto shrink-0"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? "Saving..." : "Approve & Save"}
              </button>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tamil Lyrics</h4>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap font-serif text-base leading-relaxed text-slate-800 h-full max-h-[500px] overflow-y-auto resources-scrollbar">
                  {preview.lyricsTamil || preview.lyrics}
                </div>
              </div>
              
              {preview.lyricsEnglish && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">English Transliteration</h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap font-serif text-base leading-relaxed text-slate-800 h-full max-h-[500px] overflow-y-auto resources-scrollbar">
                    {preview.lyricsEnglish}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {successMsg && (
         <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 z-50">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
               </div>
               <span className="font-bold text-sm">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-slate-400 hover:text-white transition-colors p-1"><X size={16} /></button>
         </div>
      )}
    </div>
  );
};

export default AdminSongs;
