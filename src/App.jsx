import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FaviconManager from "./components/FaviconManager";
import EditorTest from "./pages/EditorTest";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const ClientGallery = lazy(() => import("./pages/ClientGallery"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Pastors = lazy(() => import("./pages/admin/Pastors"));
const Events = lazy(() => import("./pages/admin/Events"));
const Gallery = lazy(() => import("./pages/admin/Gallery"));
const Messages = lazy(() => import("./pages/admin/Messages"));
const WebEditor = lazy(() => import("./pages/admin/WebEditor"));
const PrayerRequests = lazy(() => import("./pages/admin/PrayerRequests"));
const PastorMessage = lazy(() => import("./pages/admin/PastorMessage"));
const Books = lazy(() => import("./pages/admin/Books"));


const PageLoader = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4efe7] px-4">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(238,0,57,0.08),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(239,191,4,0.12),_transparent_36%)]" />

    <div className="relative flex flex-col items-center gap-4 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-white/75 shadow-2xl shadow-[#54091b]/15 backdrop-blur">
        <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-r from-[#EFBF04] via-[#ee0039] to-[#EFBF04] opacity-80 blur-xl animate-pulse" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#54091b] via-[#7f1730] to-[#ee0039] shadow-lg animate-mtc-float">
          <span className="animate-mtc-gradient bg-gradient-to-r from-[#EFBF04] via-[#ffe27a] to-[#ff7b9c] bg-clip-text text-5xl font-black tracking-[0.2em] text-transparent sm:text-6xl">
            MTC
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-[0.45em] text-[#54091b]/70">
          LOADING
        </p>
        <p className="mt-2 text-sm text-[#54091b]/60">
          Preparing the church pages
        </p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <LanguageProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <FaviconManager />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<ClientGallery />} />

              <Route path="/editor-test" element={<EditorTest />} />

              <Route path="/admin/login" element={<Login />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="pastors" element={<Pastors />} />
                <Route path="events" element={<Events />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="books" element={<Books />} />
                <Route path="messages" element={<Messages />} />
                <Route path="prayer-requests" element={<PrayerRequests />} />
                <Route path="web-editor" element={<WebEditor />} />
                <Route path="pastor-message" element={<PastorMessage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ConfirmProvider>
    </LanguageProvider>
  );
}
