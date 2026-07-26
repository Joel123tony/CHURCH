import { useState, useEffect } from "react";
import API from "../../../api/axios";
import { CheckSquare, AlertTriangle, XCircle, Search, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const QualityChecker = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await API.get("/admin/songs/quality-report");
                if (res.data.success) {
                    setReport(res.data.report);
                }
            } catch (err) {
                console.error("Failed to fetch quality report", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (loading) return <div className="p-8">Analyzing library...</div>;
    if (!report) return <div className="p-8 text-rose-500">Failed to load quality report.</div>;

    const issues = [
        { 
            title: "Empty or Missing Lyrics", 
            count: report.emptyLyrics || 0, 
            icon: FileText, 
            color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200",
            link: "/admin/songs/library?missing=lyrics"
        },
        { 
            title: "Missing Metadata (Author/Album)", 
            count: report.missingMetadata || 0, 
            icon: Search, 
            color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200",
            link: "/admin/songs/library?missing=metadata"
        },
        { 
            title: "Low AI Quality Score (<60)", 
            count: report.lowQuality || 0, 
            icon: AlertTriangle, 
            color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200",
            link: "/admin/songs/library?needsReview=true"
        },
        { 
            title: "Failed Imports in Queue", 
            count: report.failedImports || 0, 
            icon: XCircle, 
            color: "text-red-500", bg: "bg-red-50", border: "border-red-200",
            link: "/admin/songs/failed-imports"
        }
    ];

    const totalIssues = issues.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                <CheckSquare className={`w-12 h-12 mx-auto mb-4 ${totalIssues === 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
                <h2 className="text-2xl font-bold text-slate-800">Library Health Check</h2>
                <p className="text-slate-500 mt-2">
                    {totalIssues === 0 ? "Your library is in perfect condition! No automated issues detected." : `We found ${totalIssues} potential issues that need your attention.`}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.map((issue, idx) => {
                    const Icon = issue.icon;
                    return (
                        <div key={idx} className={`p-6 rounded-2xl border ${issue.border} ${issue.bg} flex justify-between items-center`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 bg-white rounded-xl shadow-sm ${issue.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{issue.title}</h3>
                                    <p className={`text-2xl font-black ${issue.color}`}>{issue.count}</p>
                                </div>
                            </div>
                            {issue.count > 0 && (
                                <Link to={issue.link} className="bg-white text-slate-700 px-4 py-2 rounded-lg font-medium text-sm border border-slate-200 hover:bg-slate-50">
                                    Fix Issues
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QualityChecker;
