import { useState, useEffect } from "react";
import API from "../../../api/axios";
import { BarChart2, TrendingUp, Search, Music } from "lucide-react";

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await API.get("/admin/songs/analytics");
                if (res.data.success) {
                    setAnalytics(res.data.analytics);
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8"><Loader className="animate-spin w-6 h-6" /></div>;
    if (!analytics) return <div className="p-8 text-rose-500">Failed to load analytics data.</div>;

    const { importsPerDay = [], providerContribution = [], searchFrequency = [] } = analytics;
    
    // We'll build simple visual bars since we don't have a charting library guaranteed to be installed (e.g. Chart.js / Recharts)
    const maxImport = Math.max(...importsPerDay.map(d => d.count), 1);
    const maxSearch = Math.max(...searchFrequency.map(s => s.searchCount), 1);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Imports (Last 30 Days)
                </h3>
                <div className="flex items-end gap-1 h-48 w-full overflow-x-auto pb-2">
                    {importsPerDay.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1 min-w-[20px] group relative">
                            <div 
                                className="w-full bg-indigo-200 hover:bg-indigo-500 transition-colors rounded-t-sm"
                                style={{ height: `${(day.count / maxImport) * 100}%`, minHeight: '4px' }}
                            ></div>
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                {day._id}: {day.count}
                            </div>
                        </div>
                    ))}
                    {importsPerDay.length === 0 && <p className="text-slate-500 self-center w-full text-center">No import data available for the last 30 days.</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-emerald-500" />
                        Provider Contributions
                    </h3>
                    <div className="space-y-4">
                        {providerContribution.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{p._id || "Unknown"}</span>
                                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-sm">{p.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-amber-500" />
                        Most Searched Songs
                    </h3>
                    <div className="space-y-4">
                        {searchFrequency.map((s, idx) => (
                            <div key={s._id} className="relative pt-1">
                                <div className="flex mb-1 items-center justify-between">
                                    <div className="text-sm font-medium text-slate-700 truncate w-3/4">
                                        {idx + 1}. {s.title}
                                    </div>
                                    <div className="text-xs font-bold text-slate-500">
                                        {s.searchCount}
                                    </div>
                                </div>
                                <div className="overflow-hidden h-1.5 flex rounded bg-amber-100">
                                    <div style={{ width: `${(s.searchCount / maxSearch) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"></div>
                                </div>
                            </div>
                        ))}
                        {searchFrequency.length === 0 && <p className="text-slate-500 text-sm">No search data recorded yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
