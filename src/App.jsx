import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";

// ADMIN
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Pastors from "./pages/admin/Pastors";
import Events from "./pages/admin/Events";
import Gallery from "./pages/admin/Gallery";
import Messages from "./pages/admin/Messages";

// CLIENT GALLERY
import ClientGallery from "./pages/ClientGallery";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* USER */}
        <Route path="/" element={<Home />} />

        {/* PUBLIC GALLERY (CLIENT SIDE) */}
        <Route path="/gallery" element={<ClientGallery />} />

        {/* ADMIN LOGIN */}
        <Route path="/admin/login" element={<Login />} />

        {/* ADMIN PANEL */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pastors" element={<Pastors />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="messages" element={<Messages />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}