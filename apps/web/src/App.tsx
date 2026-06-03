import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { HomePage } from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
