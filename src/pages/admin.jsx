import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Pastors from "./admin/pages/Pastors";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pastors" element={<Pastors />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}