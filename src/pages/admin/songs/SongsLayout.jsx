import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Library, AlertCircle, Copy, BarChart2, CheckSquare } from "lucide-react";
import Dashboard from "./Dashboard";
import LibraryList from "./LibraryList";
import SongEditor from "./SongEditor";
import DuplicateCenter from "./DuplicateCenter";
import FailedQueue from "./FailedQueue";
import Analytics from "./Analytics";
import QualityChecker from "./QualityChecker";

const SongsLayout = () => {
    const navItems = [
        { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "library", label: "Library", icon: Library },
        { path: "duplicates", label: "Duplicates", icon: Copy },
        { path: "failed", label: "Failed Imports", icon: AlertCircle },
        { path: "quality", label: "Quality Check", icon: CheckSquare },
        { path: "analytics", label: "Analytics", icon: BarChart2 }
    ];

    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-50">
            {/* Header / Tabs */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 md:px-8 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                        <Library className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Songs Library</h1>
                        <p className="text-sm text-slate-500">Manage 10,000+ songs, monitor AI imports, and resolve duplicates.</p>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8">
                <Routes>
                    <Route path="/" element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="library" element={<LibraryList />} />
                    <Route path="library/:id" element={<SongEditor />} />
                    <Route path="duplicates" element={<DuplicateCenter />} />
                    <Route path="failed" element={<FailedQueue />} />
                    <Route path="quality" element={<QualityChecker />} />
                    <Route path="analytics" element={<Analytics />} />
                </Routes>
            </main>
        </div>
    );
};

export default SongsLayout;
