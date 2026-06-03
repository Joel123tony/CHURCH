import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./components/AdminShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ManagerPage } from "./pages/ManagerPage";
import { RequireAdminAuth } from "./components/RequireAdminAuth";

const managers = [
  "page-builder",
  "section-builder",
  "media-manager",
  "event-manager",
  "sermon-manager",
  "pastor-manager",
  "gallery-manager",
  "prayer-request-manager",
  "navbar-manager",
  "footer-manager",
  "theme-manager",
  "youtube-manager",
  "analytics"
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAdminAuth />}>
        <Route element={<AdminShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {managers.map((slug) => (
            <Route key={slug} path={`/${slug}`} element={<ManagerPage slug={slug} />} />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
