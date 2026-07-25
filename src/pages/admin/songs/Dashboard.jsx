import { useState } from "react";
import useSWR from "swr";
import API from "../../../api/axios";
import { Music, Globe, DownloadCloud, RefreshCw, XCircle, HeartPulse, Server, ListOrdered, BarChart2, Radio, Loader, CheckCircle, Activity, Play, AlertCircle } from "lucide-react";

const fetcher = (url) => API.get(url).then((res) => res.data);

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className={`p-5 rounded-2xl border ${bg} border-slate-100 shadow-sm flex flex-col justify-between h-[140px]`}>
        <div className="flex justify-between items-start mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{value}</span>
        </div>
        <div className="text-sm font-medium text-slate-600">{title}</div>
    </div>
);

const Dashboard = () => {
    const { data, error, mutate } = useSWR("/admin/songs/dashboard", fetcher, { refreshInterval: 10000 });
    const [scanning, setScanning] = useState(false);

    if (error) return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;
    if (!data) return <div className="p-8 flex items-center gap-2"><Loader className="animate-spin w-5 h-5"/> Loading dashboard...</div>;

    const { stats = {}, sourceBreakdown = [], aiProviders = [], scanProgress = {}, queueMetrics = {} } = data;
    const providerHealth = data.providerHealth || [];

    const handleRunImport = async () => {
        try {
            setScanning(true);
            await API.post("/admin/songs/scan/start");
            mutate();
        } catch (err) {
            alert("Failed to start scan");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Overview</h2>
                <button 
                    onClick={handleRunImport}
                    disabled={scanProgress.backgroundScan || scanning}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                    {scanProgress.backgroundScan || scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {scanProgress.backgroundScan ? "Scan Running..." : "Run Global Scan"}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Songs" value={stats.totalSongs || 0} icon={Music} color="bg-indigo-100 text-indigo-600" bg="bg-white" />
                <StatCard title="Imported Today" value={stats.importedToday || 0} icon={DownloadCloud} color="bg-emerald-100 text-emerald-600" bg="bg-white" />
                <StatCard title="Failed Imports" value={stats.failedImports || 0} icon={XCircle} color="bg-rose-100 text-rose-600" bg="bg-white" />
                <StatCard title="Active Sources" value={stats.activeSources || 0} icon={Globe} color="bg-amber-100 text-amber-600" bg="bg-white" />
                <StatCard title="AI Needs Review" value={stats.aiNeedsReview || 0} icon={AlertCircle} color="bg-orange-100 text-orange-600" bg="bg-white" />
                <StatCard title="Queue (AI)" value={stats.aiQueue || 0} icon={ListOrdered} color="bg-blue-100 text-blue-600" bg="bg-white" />
                <StatCard title="Avg AI Confidence" value={`${stats.avgConfidence || 0}%`} icon={CheckCircle} color="bg-purple-100 text-purple-600" bg="bg-white" />
                <StatCard title="Moderation Queue" value={stats.moderationQueue || 0} icon={Server} color="bg-slate-100 text-slate-600" bg="bg-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Provider Health
                    </h3>
                    <div className="space-y-4">
                        {providerHealth.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="font-semibold text-slate-700">{p.provider}</p>
                                    <p className="text-xs text-slate-500">{p.totalSamples || 0} imports • {p.healthScore}% health</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${p.healthScore >= 80 ? 'bg-emerald-100 text-emerald-700' : p.healthScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {p.reliabilityBand || "Unknown"}
                                </div>
                            </div>
                        ))}
                        {providerHealth.length === 0 && <p className="text-slate-500 text-sm">No provider health data available yet.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-500" />
                        Source Breakdown
                    </h3>
                    <div className="space-y-3">
                        {sourceBreakdown.map((s, idx) => {
                            const health = providerHealth.find(p => p.provider === s._id) || {};
                            return (
                                <div key={idx} className="flex flex-col p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-800">{s._id || "Unknown"}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-slate-500">Songs:</span>
                                            <span className="text-sm font-bold text-slate-800">{s.count}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mt-1">
                                        <div>
                                            <span className="block font-medium text-slate-400">Health</span>
                                            <span className={`font-bold ${health.healthScore >= 80 ? 'text-emerald-600' : health.healthScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                {health.healthScore || 0}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block font-medium text-slate-400">Success Rate</span>
                                            <span className="font-bold text-slate-700">{health.successRate || 0}%</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium text-slate-400">Last Success</span>
                                            <span className="font-bold text-slate-700">{health.lastSuccessAt ? new Date(health.lastSuccessAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
