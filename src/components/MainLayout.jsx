import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Contact from "./Contact";
import Footer from "./Footer";
import { useEffect } from "react";

export default function MainLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!pathname) return;
    
    // If there is no hash, scroll to top when pathname changes.
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    // If there is a hash, scroll to the element.
    const scrollWithOffset = () => {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Offset for the fixed navbar (height is 80px / h-20)
        const yOffset = -80; 
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    // Need a tiny delay for React to render the newly navigated page elements
    const timeout = window.setTimeout(scrollWithOffset, 100);
    return () => window.clearTimeout(timeout);
  }, [pathname, hash]);

  const isDarkContact = pathname.startsWith("/bible") || pathname.startsWith("/songs") || pathname.startsWith("/books");
  const contactTheme = isDarkContact ? "dark" : "light";

  return (
    <div className="flex flex-col min-h-screen bg-[#F4EFE7]">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Contact theme={contactTheme} />
      <Footer />
    </div>
  );
}
