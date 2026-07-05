import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function FaviconManager() {
  const location = useLocation();

  useEffect(() => {
    let favicon = document.querySelector("link[rel*='icon']");

    if (favicon) {
      document.head.removeChild(favicon);
    }

    const isAdmin = location.pathname.startsWith("/admin");

    favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/x-icon";
    favicon.href = isAdmin ? "/favicon-admin.ico" : "/favicon-client.ico";
    document.head.appendChild(favicon);

    document.title = isAdmin
      ? "Church CMS Admin"
      : "Methodist Tamil Church | Padikuppam";
  }, [location.pathname]);

  return null;
}