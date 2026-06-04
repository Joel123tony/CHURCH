import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { PageView } from "./pages/PageView";
import { SearchPage } from "./pages/SearchPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="pastors/:slug" element={<PageView variant="pastor-detail" />} />
        <Route path="sermons/:slug" element={<PageView variant="sermon-detail" />} />
        <Route path=":slug" element={<PageView variant="page" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
