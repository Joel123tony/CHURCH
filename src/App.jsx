import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const ClientGallery = lazy(() => import("./pages/ClientGallery"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Pastors = lazy(() => import("./pages/admin/Pastors"));
const Events = lazy(() => import("./pages/admin/Events"));
const Gallery = lazy(() => import("./pages/admin/Gallery"));
const Messages = lazy(() => import("./pages/admin/Messages"));
const PrayerRequests = lazy(() => import("./pages/admin/PrayerRequests"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f4efe7] px-4">
    <div className="rounded-3xl border border-slate-100 bg-white px-6 py-4 shadow-lg">
      <p className="text-sm font-semibold text-slate-700">Loading page...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<ClientGallery />} />

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
              <Route path="messages" element={<Messages />} />
              <Route path="prayer-requests" element={<PrayerRequests />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}
