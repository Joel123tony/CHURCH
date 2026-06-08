import { Routes, Route } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import Dashboard from "./Dashboard";
import Pastors from "./Pastors";
import Events from "./Events";
import Gallery from "./Gallery";
import Messages from "./Messages";
import Login from "./Login";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function Admin() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pastors" element={<Pastors />} />
        <Route path="events" element={<Events />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="messages" element={<Messages />} />
      </Route>

    </Routes>
  );
}