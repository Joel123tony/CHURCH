import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { PageView } from "./pages/PageView";

const staticPages = ["about", "ministries", "events", "gallery", "pastors", "contact", "sermons", "search"];

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        {staticPages.map((slug) => (
          <Route key={slug} path={slug} element={<PageView slug={slug} />} />
        ))}
        <Route path="pastors/:slug" element={<PageView slug="pastor-detail" />} />
        <Route path="sermons/:slug" element={<PageView slug="sermon-detail" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

