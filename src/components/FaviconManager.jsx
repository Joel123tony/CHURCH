import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function FaviconManager() {
  const location = useLocation();

  useEffect(() => {
    let favicon = document.querySelector("link[rel='icon']");

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    const isAdmin = location.pathname.startsWith("/admin");

    favicon.type = "image/x-icon";
    favicon.href = isAdmin
      ? "/favicon-admin.ico"
      : "/favicon-client.ico";

    document.title = isAdmin
      ? "MTC Admin Panel"
      : "Methodist Tamil Church Padikuppam";
  }, [location.pathname]);

  return null;
}