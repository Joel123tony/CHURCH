import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ClientGallery from "./pages/ClientGallery";

// ADMIN
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Pastors from "./pages/admin/Pastors";
import Events from "./pages/admin/Events";
import Gallery from "./pages/admin/Gallery";
import Messages from "./pages/admin/Messages";
import PrayerRequests from "./pages/admin/PrayerRequests";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= CLIENT ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<ClientGallery />} />

        {/* ================= LOGIN ================= */}
        <Route path="/admin/login" element={<Login />} />

        {/* ================= ADMIN (PROTECTED) ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          {/* Default admin page */}
          <Route index element={<Dashboard />} />

          {/* FIXED SAFE ROUTES */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pastors" element={<Pastors />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="messages" element={<Messages />} />
          <Route path="prayer-requests" element={<PrayerRequests />} />

        </Route>

        {/* ================= SAFETY FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}